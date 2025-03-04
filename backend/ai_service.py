from typing import List
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError, AuthenticationError
from google.cloud import aiplatform
from models import InstructionalLevel, SlideContent, SlideTopic, BulletPoint, Example
import json
import os
import time
from dotenv import load_dotenv
import logging
from fastapi import HTTPException
import traceback
import re
import asyncio

logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables from .env file
load_dotenv(override=True)

class AIService:
    def __init__(self):
        # Get API key
        api_key = os.getenv("OPENAI_API_KEY")
        logger.debug(f"API Key loaded: {'yes' if api_key else 'no'}")
        
        if not api_key:
            logger.error("OPENAI_API_KEY environment variable is not set")
            raise ValueError("OPENAI_API_KEY environment variable is not set")
            
        # Validate API key format
        if not (api_key.startswith("sk-") or api_key.startswith("sk-proj-")):
            logger.error("Invalid OpenAI API key format")
            raise ValueError("Invalid OpenAI API key format. It should start with 'sk-' or 'sk-proj-'")
            
        # Initialize AsyncOpenAI client
        try:
            self.client = AsyncOpenAI(
                api_key=api_key,
                timeout=30.0  # 30 seconds timeout
            )
            logger.debug("AsyncOpenAI client initialized successfully")
            
            # Test API connection
            asyncio.run(self.test_connection())
            logger.info("OpenAI API connection test successful")
            
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to initialize OpenAI client: {str(e)}")
            
    async def test_connection(self):
        """Test the OpenAI API connection."""
        try:
            await self.client.models.list()
        except Exception as e:
            logger.error(f"OpenAI API connection test failed: {str(e)}")
            raise

    async def _parse_json_response(self, content: str, error_context: str) -> dict:
        """Safely parse JSON response from OpenAI."""
        try:
            # Remove any leading/trailing whitespace or quotes
            content = content.strip().strip('"\'')
            
            # If the content starts with a newline, remove it
            content = content.lstrip('\n')
            
            # Log the raw content
            logger.info(f"Raw content to parse: {content}")
            
            # Check if the content starts with "Internal Server Error"
            if content.startswith("Internal S"):
                logger.error("Received Internal Server Error response")
                raise ValueError("OpenAI service temporarily unavailable")
            
            # Try to parse as JSON
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {str(e)}")
                logger.error(f"Content that failed to parse: {content}")
                raise ValueError(f"Failed to parse response as JSON: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error parsing response for {error_context}: {str(e)}")
            logger.error(f"Raw content: {content}")
            raise ValueError(f"Error processing response: {str(e)}")

    async def _validate_json_response(self, response_text: str) -> dict:
        """Validate and parse JSON response from OpenAI."""
        try:
            if not response_text:
                raise ValueError("Empty response from OpenAI")
            
            # Log the raw response for debugging
            logger.debug(f"Raw response from OpenAI: {response_text}")
            
            # Try direct JSON parsing first
            try:
                content = json.loads(response_text)
                logger.debug("Successfully parsed JSON directly")
                return content
            except json.JSONDecodeError as e:
                logger.debug(f"Direct JSON parsing failed: {str(e)}")
            
            # If direct parsing fails, try to clean the response
            try:
                # Remove any leading/trailing whitespace
                cleaned = response_text.strip()
                
                # Remove any markdown code block markers
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                
                # Remove any leading/trailing whitespace again
                cleaned = cleaned.strip()
                
                logger.debug(f"Cleaned response: {cleaned}")
                
                # Try parsing the cleaned JSON
                content = json.loads(cleaned)
                logger.debug("Successfully parsed cleaned JSON")
                return content
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse cleaned JSON: {cleaned}")
                logger.error(f"JSON error: {str(e)}")
                raise ValueError(f"Response was not valid JSON: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error validating JSON: {str(e)}")
            logger.error(f"Full response: {response_text}")
            raise ValueError(f"Error validating JSON: {str(e)}")

    async def _validate_response_format(self, response_data: dict) -> None:
        """Validate that the response has the correct format."""
        required_fields = ["title", "bullet_points", "discussion_questions", "examples"]
        for field in required_fields:
            if field not in response_data:
                raise ValueError(f"Missing required field: {field}")
            
            if not isinstance(response_data[field], list) and field != "title":
                raise ValueError(f"Field {field} must be a list")
            
            if field == "title" and not isinstance(response_data[field], str):
                raise ValueError("Title must be a string")
            
            if field == "bullet_points":
                for i, point in enumerate(response_data[field]):
                    if not isinstance(point, str):
                        raise ValueError(f"Bullet point {i+1} must be a string")
            
            if field == "discussion_questions":
                for i, question in enumerate(response_data[field]):
                    if not isinstance(question, str):
                        raise ValueError(f"Discussion question {i+1} must be a string")
            
            if field == "examples":
                for i, example in enumerate(response_data[field]):
                    if not isinstance(example, str):
                        raise ValueError(f"Example {i+1} must be a string")

    async def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel) -> List[SlideTopic]:
        """Generate a presentation outline based on context and parameters."""
        try:
            logger.info(f"Generating outline for context: {context}")
            logger.debug(f"Parameters: num_slides={num_slides}, level={level}")
            
            # Create the prompt
            prompt = {
                "context": context,
                "num_slides": num_slides,
                "level": level.value,
                "instructions": "Create an educational presentation outline"
            }
            
            try:
                completion = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a JSON generator. Analyze the input JSON and return a new JSON object with a 'topics' array containing exactly {num_slides} topics. Each topic must have 'title' and 'description' fields. Do not include any other text. The topics must be unique and non-overlapping."
                        },
                        {"role": "user", "content": json.dumps(prompt, indent=2)}
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                
                # Get the response content
                response_text = completion.choices[0].message.content
                logger.debug(f"Raw response: {response_text}")
                
                # Parse the response
                try:
                    response_data = json.loads(response_text)
                    if not isinstance(response_data, dict) or "topics" not in response_data:
                        raise ValueError("Invalid response format: missing 'topics' array")
                        
                    topics_data = response_data["topics"]
                    if not isinstance(topics_data, list):
                        raise ValueError("Invalid response format: 'topics' is not an array")
                        
                    if len(topics_data) != num_slides:
                        raise ValueError(f"Expected {num_slides} topics, but got {len(topics_data)}")
                        
                    # Convert to SlideTopic objects
                    topics = []
                    for topic in topics_data:
                        if not isinstance(topic, dict):
                            raise ValueError("Invalid topic format: not an object")
                            
                        if "title" not in topic or "description" not in topic:
                            raise ValueError("Invalid topic format: missing required fields")
                            
                        topics.append(SlideTopic(
                            title=topic["title"],
                            description=topic["description"]
                        ))
                        
                    logger.info(f"Successfully generated {len(topics)} topics")
                    return topics
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {str(e)}")
                    logger.error(f"Response text: {response_text}")
                    raise ValueError(f"Invalid JSON response from OpenAI: {str(e)}")
                    
                except KeyError as e:
                    logger.error(f"Missing key in response: {str(e)}")
                    logger.error(f"Response data: {response_data}")
                    raise ValueError(f"Invalid response format: missing key {str(e)}")
                    
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                logger.error(traceback.format_exc())
                raise ValueError(f"Failed to generate outline: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def generate_slide_content(self, topic: SlideTopic, level: InstructionalLevel) -> SlideContent:
        """Generate content for a single slide."""
        try:
            logger.info(f"Generating content for topic: {topic.title}")
            logger.debug(f"Parameters: level={level}")
            
            # Create the prompt
            prompt = {
                "topic": topic.dict(),
                "level": level.value,
                "instructions": "Create educational slide content",
                "format": {
                    "title": "string",
                    "bullet_points": ["string"],
                    "discussion_questions": ["string"],
                    "examples": ["string"]
                }
            }
            
            try:
                completion = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": """You are a JSON generator. Create educational slide content based on the topic.
Return a JSON object with the following fields:
{
    "title": "string",
    "bullet_points": ["string", "string", "string"],
    "discussion_questions": ["string", "string"],
    "examples": ["string", "string"]
}

Each bullet point should be a complete thought. Include 3-5 bullet points, 2-3 discussion questions, and 2 concrete examples.
Do not include any nested objects or additional fields.

Example response:
{
    "title": "Early Computing Machines",
    "bullet_points": [
        "The abacus, invented around 2400 BC, was one of the first devices used for mathematical calculations",
        "Charles Babbage designed the Analytical Engine in 1837, which is considered the first general-purpose computer",
        "The ENIAC, completed in 1945, was the first electronic general-purpose computer"
    ],
    "discussion_questions": [
        "How did early computing machines influence modern computer design?",
        "What were the main challenges in developing early computers?"
    ],
    "examples": [
        "The UNIVAC I, delivered to the US Census Bureau in 1951, was the first commercial computer available in the United States",
        "The IBM 650, released in 1954, became the first mass-produced computer with over 2,000 units sold"
    ]
}"""
                        },
                        {"role": "user", "content": json.dumps(prompt, indent=2)}
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                
                # Get the response content
                response_text = completion.choices[0].message.content
                logger.debug(f"Raw response: {response_text}")
                
                # Parse the response
                try:
                    response_data = json.loads(response_text)
                    
                    # Validate response format
                    await self._validate_response_format(response_data)
                    
                    # Convert bullet points to proper format
                    bullet_points = [
                        BulletPoint(text=point)
                        for point in response_data.get("bullet_points", [])
                    ]
                    
                    # Convert examples to proper format
                    examples = [
                        Example(text=example)
                        for example in response_data.get("examples", [])
                    ]
                    
                    # Create slide content
                    slide_content = SlideContent(
                        title=response_data["title"],
                        bullet_points=bullet_points,
                        discussion_questions=response_data["discussion_questions"],
                        examples=examples
                    )
                    
                    logger.info("Successfully generated slide content")
                    return slide_content
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {str(e)}")
                    logger.error(f"Response text: {response_text}")
                    raise ValueError(f"Invalid JSON response from OpenAI: {str(e)}")
                    
                except KeyError as e:
                    logger.error(f"Missing key in response: {str(e)}")
                    logger.error(f"Response data: {response_data}")
                    raise ValueError(f"Invalid response format: missing key {str(e)}")
                    
                except Exception as e:
                    logger.error(f"Error processing response: {str(e)}")
                    logger.error(traceback.format_exc())
                    raise ValueError(f"Failed to process OpenAI response: {str(e)}")
                    
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                logger.error(traceback.format_exc())
                raise ValueError(f"Failed to generate slide content: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error in generate_slide_content: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def _validate_content_specificity(self, slide_data: dict) -> None:
        """Validate that the content is specific, detailed, and non-repetitive."""
        # Generic terms to avoid
        generic_terms = {'things', 'stuff', 'etc'}
        
        # Track used content to prevent repetition
        used_content = set()
        
        def check_text(text: str, context: str, min_words: int = 4) -> None:
            # Remove punctuation for word counting
            words = text.replace(',', ' ').replace('.', ' ').replace(';', ' ').split()
            unique_words = set(w.lower() for w in words)
            
            # Check for overly generic terms
            if generic_terms & unique_words:
                raise ValueError(f"Found overly generic terms in {context}: {generic_terms & unique_words}")
            
            # Check for repetitive content
            content_key = ' '.join(sorted(unique_words))  # Normalize word order
            if content_key in used_content:
                raise ValueError(f"Found repetitive content in {context}: {text}")
            used_content.add(content_key)
            
            # Allow shorter phrases if they contain specific data or terminology
            contains_data = any(c.isdigit() for c in text)
            contains_proper_noun = any(w[0].isupper() and not w.isupper() for w in words[1:])  # Skip first word
            contains_date = bool(re.search(r'\b\d{4}\b', text))  # Check for year
            
            if len(words) < min_words and not (contains_data or contains_proper_noun or contains_date):
                raise ValueError(f"Content needs more detail in {context}: {text}")

        # Validate title and subtitle
        if not slide_data.get('title'):
            raise ValueError("Missing title")
        if not slide_data.get('subtitle'):
            raise ValueError("Missing subtitle")
        check_text(slide_data['subtitle'], 'subtitle')

        # Validate introduction
        if not slide_data.get('introduction'):
            raise ValueError("Missing introduction")
        check_text(slide_data['introduction'], 'introduction', min_words=8)

        # Track topics to prevent repetition across bullet points
        topic_fingerprints = set()
        
        # Validate bullet points
        if not slide_data.get('bullet_points'):
            raise ValueError("Missing bullet points")
            
        for i, point in enumerate(slide_data['bullet_points']):
            # Extract main topic from bullet point and create fingerprint
            topic_words = ' '.join(sorted(set(point.lower().split())))
            if topic_words in topic_fingerprints:
                raise ValueError(f"Bullet point {i+1} repeats a previously covered topic")
            topic_fingerprints.add(topic_words)
            
            # Main point should be more detailed
            check_text(point, f"bullet point {i+1}", min_words=6)
            
            # Sub-points can be more concise if they contain specific data
            for j, sub_point in enumerate(point.get('sub_points', [])):
                check_text(sub_point, f"sub-point {i+1}.{j+1}", min_words=4)

        # Validate examples
        if not slide_data.get('examples'):
            raise ValueError("Missing examples")
            
        for i, example in enumerate(slide_data['examples']):
            # Check if example repeats a topic from bullet points
            example_words = ' '.join(sorted(set(example.lower().split())))
            if example_words in topic_fingerprints:
                raise ValueError(f"Example {i+1} repeats content from bullet points")
            topic_fingerprints.add(example_words)
            
            # Description should be detailed
            check_text(example, f"example {i+1}", min_words=5)
            
            # Details can be more concise if they contain specific data
            for j, detail in enumerate(example.get('details', [])):
                check_text(detail, f"example detail {i+1}.{j+1}", min_words=4)

        # Validate key takeaway
        if not slide_data.get('key_takeaway'):
            raise ValueError("Missing key takeaway")
        check_text(slide_data['key_takeaway'], 'key takeaway', min_words=6)

        # Validate discussion questions
        if not slide_data.get('discussion_questions'):
            raise ValueError("Missing discussion questions")
            
        for i, question in enumerate(slide_data['discussion_questions']):
            # Ensure questions cover different aspects
            question_words = ' '.join(sorted(set(question.lower().split())))
            if question_words in topic_fingerprints:
                raise ValueError(f"Discussion question {i+1} repeats content from bullet points")
            topic_fingerprints.add(question_words)
            
            # Ensure proper question format
            if not any(w in question.lower() for w in ['how', 'what', 'why', 'when', 'where', 'which']):
                raise ValueError(f"Discussion question {i+1} should start with a question word (how, what, why, etc.)")
            check_text(question, f"discussion question {i+1}", min_words=6)
    
    async def enhance_content(self, slide_content: SlideContent, level: InstructionalLevel) -> SlideContent:
        """Enhance slide content with Gemini Pro (optional enhancement)."""
        try:
            # Initialize Vertex AI
            aiplatform.init(project=os.getenv("GOOGLE_CLOUD_PROJECT"))
            return slide_content
        except Exception as e:
            logger.error(f"Error in enhance_content: {str(e)}")
            # Don't raise an error here, just return the original content
            return slide_content
