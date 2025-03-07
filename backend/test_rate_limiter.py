import asyncio
import logging
from rate_limiter import RateLimiter
import time
from typing import List, Dict
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_operation(
    rate_limiter: RateLimiter,
    operation_type: str,
    num_requests: int,
    delay: float = 0.1
) -> List[Dict]:
    """Test a specific operation type with rate limiting."""
    results = []
    
    logger.info(f"Testing {operation_type} with {num_requests} requests...")
    
    for i in range(num_requests):
        start_time = time.time()
        try:
            await rate_limiter.wait_if_needed(operation_type)
            duration = time.time() - start_time
            results.append({
                "request": i + 1,
                "success": True,
                "duration": duration,
                "operation": operation_type
            })
            logger.info(f"{operation_type} request {i+1}/{num_requests} succeeded after {duration:.2f}s")
            
        except Exception as e:
            duration = time.time() - start_time
            results.append({
                "request": i + 1,
                "success": False,
                "duration": duration,
                "error": str(e),
                "operation": operation_type
            })
            logger.error(f"{operation_type} request {i+1} failed after {duration:.2f}s: {e}")
            
        # Add a small delay between requests
        await asyncio.sleep(delay)
        
        # Print current usage after every 5 requests
        if (i + 1) % 5 == 0:
            usage = rate_limiter.get_current_usage()
            logger.info(f"\nCurrent usage for {operation_type}:")
            logger.info(f"Minute: {usage[operation_type]['minute_remaining']} remaining")
            logger.info(f"Day: {usage[operation_type]['day_remaining']} remaining\n")
    
    return results

async def analyze_results(results: List[Dict]):
    """Analyze test results."""
    total = len(results)
    successes = sum(1 for r in results if r["success"])
    failures = total - successes
    
    avg_duration = sum(r["duration"] for r in results) / total if total > 0 else 0
    max_duration = max(r["duration"] for r in results) if results else 0
    
    logger.info("\n=== Test Results ===")
    logger.info(f"Total requests: {total}")
    logger.info(f"Successful: {successes} ({(successes/total)*100:.1f}%)")
    logger.info(f"Failed: {failures} ({(failures/total)*100:.1f}%)")
    logger.info(f"Average duration: {avg_duration:.2f}s")
    logger.info(f"Max duration: {max_duration:.2f}s")
    
    # Group by operation type
    by_operation = {}
    for result in results:
        op = result["operation"]
        if op not in by_operation:
            by_operation[op] = {"total": 0, "success": 0, "fail": 0}
        by_operation[op]["total"] += 1
        if result["success"]:
            by_operation[op]["success"] += 1
        else:
            by_operation[op]["fail"] += 1
    
    logger.info("\nBy Operation Type:")
    for op, stats in by_operation.items():
        success_rate = (stats["success"] / stats["total"]) * 100
        logger.info(f"{op}: {stats['success']}/{stats['total']} ({success_rate:.1f}% success)")

async def main():
    """Run rate limiter tests."""
    rate_limiter = RateLimiter()
    all_results = []
    
    # Test chat operations (should handle higher volume)
    chat_results = await test_operation(rate_limiter, "chat", 20)
    all_results.extend(chat_results)
    
    # Test image operations (should be more restricted)
    image_results = await test_operation(rate_limiter, "image", 10)
    all_results.extend(image_results)
    
    # Test mixed operations
    logger.info("\nTesting mixed operations...")
    for _ in range(5):
        # Alternate between chat and image requests
        chat_result = await test_operation(rate_limiter, "chat", 2)
        image_result = await test_operation(rate_limiter, "image", 1)
        all_results.extend(chat_result)
        all_results.extend(image_result)
    
    # Analyze all results
    await analyze_results(all_results)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nTest interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Test failed: {e}")
        sys.exit(1)
