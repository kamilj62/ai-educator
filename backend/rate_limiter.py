import asyncio
import time
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_minute: int = 50, requests_per_day: int = 500):
        self.requests_per_minute = requests_per_minute
        self.requests_per_day = requests_per_day
        self.minute_window = []  # List of timestamps for requests in the current minute
        self.day_window = []     # List of timestamps for requests in the current day
        self.lock = asyncio.Lock()
        
        # Cost weights for different API calls based on OpenAI's pricing
        self.cost_weights = {
            'chat': 1,           # GPT-4 chat completion (base cost)
            'image': 4,          # DALL-E 3 image generation (4x more expensive)
            'models': 0.5,       # Model listing (lightweight operation)
            'default': 1         # Default cost for unspecified operations
        }
        
        # Specific rate limits for different operations
        self.operation_limits = {
            'chat': {
                'minute': 200,   # GPT-4 has higher rate limits
                'day': 2000
            },
            'image': {
                'minute': 50,    # DALL-E has stricter limits
                'day': 500
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

    async def wait_if_needed(self, operation_type: str = 'default') -> None:
        """Wait until the operation can be performed within rate limits."""
        retry_count = 0
        max_retries = 5  # Maximum number of retries before giving up
        
        while not await self.check_rate_limit(operation_type):
            retry_count += 1
            if retry_count > max_retries:
                raise ValueError(f"Rate limit exceeded for {operation_type} after {max_retries} retries")
                
            wait_time = min(5 * retry_count, 30)  # Exponential backoff, max 30 seconds
            logger.info(f"Rate limit reached for {operation_type}, waiting {wait_time} seconds (attempt {retry_count}/{max_retries})...")
            await asyncio.sleep(wait_time)
        
        await self.add_request(operation_type)

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
