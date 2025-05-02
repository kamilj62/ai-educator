import os
import asyncio
from openai import AsyncOpenAI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_api_key():
    try:
        # Get the API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY not found in environment variables")
            return False

        # Initialize client
        client = AsyncOpenAI(api_key=api_key)
        
        # Test models endpoint
        logger.info("Testing API key with models endpoint...")
        models = await client.models.list()
        logger.info("✓ Successfully connected to OpenAI API")
        logger.info(f"✓ Found {len(models.data)} available models")
        
        # Test chat completion
        logger.info("\nTesting chat completion...")
        completion = await client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello, are you working?"}],
            max_tokens=10
        )
        logger.info("✓ Successfully made a chat completion request")
        logger.info(f"✓ Response: {completion.choices[0].message.content}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing API key: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(test_api_key())
