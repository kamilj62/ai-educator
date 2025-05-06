import asyncio
import time
from typing import Dict, Optional
import logging
from contextlib import asynccontextmanager
from .models import ImageServiceProvider

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_minute: int = 50, requests_per_day: int = 500):
        self.requests_per_minute = requests_per_minute
        self.requests_per_day = requests_per_day
        self.minute_window = []  # List of timestamps for requests in the current minute
        self.day_window = []     # List of timestamps for requests in the current day
        self.lock = asyncio.Lock()
        
        # Cost weights for different API calls
        self.cost_weights = {
            'chat': 1,           # GPT-4 chat completion (base cost)
            'imagen': 10,        # Imagen has very strict quotas
            'dalle': 5,          # DALL-E has higher quotas
            'models': 0.5,       # Model listing (lightweight operation)
            'default': 1         # Default cost for unspecified operations
        }
        
        # Specific rate limits for different operations
        self.operation_limits = {
            'chat': {
                'minute': 200,   # GPT-4 has higher rate limits
                'day': 2000
            },
            'imagen': {
                'minute': 2,     # Extremely conservative limit for Imagen (1 request per 30 seconds)
                'day': 20        # Limited daily quota until increase is approved
            },
            'dalle': {
                'minute': 10,    # DALL-E has higher quotas
                'day': 100      # More generous daily limit for DALL-E
            },
            'default': {
                'minute': 50,
                'day': 500
            }
        }
        
        logger.info(f"Rate limiter initialized with {requests_per_minute} requests/minute and {requests_per_day} requests/day")
        logger.info(f"Operation limits: {self.operation_limits}")

    def _cleanup_window(self, window: list, duration: int) -> None:
        """Remove timestamps older than the specified duration."""
        current_time = time.time()
        while window and window[0] < current_time - duration:
            window.pop(0)

    def _get_operation_limits(self, operation_type: str) -> Dict[str, int]:
        """Get rate limits for a specific operation type."""
        return self.operation_limits.get(operation_type, self.operation_limits['default'])

    async def check_rate_limit(self, operation_type: str = 'default') -> bool:
        """Check if the operation would exceed rate limits."""
        async with self.lock:
            current_time = time.time()
            
            # Clean up old timestamps
            self._cleanup_window(self.minute_window, 60)  # 1 minute window
            self._cleanup_window(self.day_window, 86400)  # 24 hour window
            
            # Get operation-specific limits
            limits = self._get_operation_limits(operation_type)
            cost = self.cost_weights.get(operation_type, self.cost_weights['default'])
            
            # Check minute limit
            minute_usage = sum(1 for t in self.minute_window if t > current_time - 60)
            if minute_usage * cost >= limits['minute']:
                logger.warning(f"Rate limit exceeded for {operation_type}: {minute_usage} requests in last minute")
                return False
                
            # Check daily limit
            day_usage = sum(1 for t in self.day_window if t > current_time - 86400)
            if day_usage * cost >= limits['day']:
                logger.warning(f"Daily limit exceeded for {operation_type}: {day_usage} requests today")
                return False
            
            return True

    async def add_request(self, operation_type: str = 'default') -> None:
        """Record a new request."""
        async with self.lock:
            current_time = time.time()
            self.minute_window.append(current_time)
            self.day_window.append(current_time)
            
            # Get current usage for logging
            minute_usage = len([t for t in self.minute_window if t > current_time - 60])
            day_usage = len([t for t in self.day_window if t > current_time - 86400])
            limits = self._get_operation_limits(operation_type)
            
            logger.debug(
                f"Added {operation_type} request. "
                f"Minute: {minute_usage}/{limits['minute']} ({(minute_usage/limits['minute'])*100:.1f}%), "
                f"Day: {day_usage}/{limits['day']} ({(day_usage/limits['day'])*100:.1f}%)"
            )

    async def get_usage(self, operation_type: str, time_window: str) -> int:
        """Get current usage for a specific operation type and time window."""
        async with self.lock:
            current_time = time.time()
            if time_window == 'minute':
                return sum(1 for t in self.minute_window if t > current_time - 60)
            elif time_window == 'day':
                return sum(1 for t in self.day_window if t > current_time - 86400)
            else:
                raise ValueError(f"Invalid time window: {time_window}")

    async def wait_if_needed(self, operation_type: str, max_retries: int = 5) -> None:
        """Check if we need to wait before making another request."""
        retry_count = 0
        while retry_count < max_retries:
            minute_usage = await self.get_usage(operation_type, 'minute')
            day_usage = await self.get_usage(operation_type, 'day')
            
            minute_limit = self.operation_limits.get(operation_type, self.operation_limits['default'])['minute']
            day_limit = self.operation_limits.get(operation_type, self.operation_limits['default'])['day']
            
            if minute_usage >= minute_limit or day_usage >= day_limit:
                if operation_type == 'imagen':
                    # Don't retry for Imagen, let it fail fast to fallback to DALL-E
                    raise ValueError(f"Rate limit exceeded for {operation_type}")
                
                retry_count += 1
                if retry_count >= max_retries:
                    raise ValueError(f"Rate limit exceeded for {operation_type} after {max_retries} retries")
                
                # Wait before retrying
                await asyncio.sleep(5 * retry_count)
            else:
                break

    @asynccontextmanager
    async def limit(self, operation_type: str = 'default'):
        """Context manager for rate limiting operations."""
        try:
            await self.wait_if_needed(operation_type)
            await self.add_request(operation_type)
            yield
        except Exception as e:
            logger.error(f"Error during rate-limited operation {operation_type}: {str(e)}")
            raise
        finally:
            logger.debug(f"Completed rate-limited operation: {operation_type}")

    def get_current_usage(self) -> Dict[str, Dict[str, float]]:
        """Get current usage statistics for all operation types."""
        current_time = time.time()
        self._cleanup_window(self.minute_window, 60)
        self._cleanup_window(self.day_window, 86400)
        
        minute_usage = len([t for t in self.minute_window if t > current_time - 60])
        day_usage = len([t for t in self.day_window if t > current_time - 86400])
        
        usage_stats = {}
        for op_type in self.operation_limits.keys():
            limits = self._get_operation_limits(op_type)
            usage_stats[op_type] = {
                'minute_usage': minute_usage / limits['minute'],
                'day_usage': day_usage / limits['day'],
                'minute_remaining': limits['minute'] - minute_usage,
                'day_remaining': limits['day'] - day_usage
            }
        
        return usage_stats
