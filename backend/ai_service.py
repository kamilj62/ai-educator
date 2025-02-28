from typing import List
from openai import OpenAI, APITimeoutError
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

logger = logging.getLogger(__name__)

load_dotenv()

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
            
        self.client = OpenAI(
            api_key=api_key,
            timeout=30.0  # 30 seconds timeout
        )
        
    def _parse_json_response(self, content: str, error_context: str) -> dict:
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

    def _validate_json_response(self, response_text: str) -> dict:
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

    def generate_outline(self, context: str, num_slides: int, level: InstructionalLevel) -> List[SlideTopic]:
        """Generate presentation outline based on context and parameters."""
        try:
            example = {
                "topics": [
                    {
                        "title": "British Mandate Period (1920-1948)",
                        "description": "Examine British administration of Palestine"
                    },
                    {
                        "title": "Independence and Early Years (1948-1967)",
                        "description": "Explore the establishment of Israel and its early development"
                    }
                ]
            }
            
            prompt = {
                "task": f"Create a focused outline with exactly {num_slides} slides",
                "level": level.value,
                "slides": num_slides,
                "context": context,
                "format": example,
                "requirements": [
                    f"Generate exactly {num_slides} topics",
                    "Each topic must be unique and non-overlapping",
                    "Focus on specific events and dates",
                    "Include key policy changes",
                    "Cover measurable impacts"
                ]
            }

            logger.info("Sending outline generation prompt to OpenAI")
            
            try:
                completion = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a JSON generator. Analyze the input JSON and return a new JSON object with a 'topics' array containing exactly {num_slides} topics. Each topic must have 'title' and 'description' fields. Do not include any other text. The topics must be unique and non-overlapping."
                        },
                        {"role": "user", "content": json.dumps(prompt, indent=2)}
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"},
                    timeout=45
                )
                
                # Get the response content
                response_text = completion.choices[0].message.content.strip()
                logger.debug(f"Raw OpenAI response: {response_text}")
                
                # Parse the response
                content = self._parse_json_response(response_text, "outline generation")
                logger.debug(f"Parsed content: {json.dumps(content, indent=2)}")
                
                # Ensure it has topics array
                if not isinstance(content, dict):
                    logger.error(f"Content is not a dict: {type(content)}")
                    raise ValueError("Response must be a JSON object")
                    
                if "topics" not in content:
                    logger.error(f"Missing 'topics' key. Keys found: {list(content.keys())}")
                    raise ValueError("Response must contain a 'topics' key")
                    
                topics = content["topics"]
                if not isinstance(topics, list):
                    logger.error(f"'topics' is not a list: {type(topics)}")
                    raise ValueError("'topics' must be an array")
                
                # Validate each slide topic
                validated_topics = []
                for i, topic in enumerate(topics):
                    if not isinstance(topic, dict):
                        logger.error(f"Topic {i+1} is not a dict: {type(topic)}")
                        raise ValueError(f"Topic {i+1} must be a JSON object")
                        
                    if "title" not in topic:
                        logger.error(f"Topic {i+1} missing 'title'. Keys found: {list(topic.keys())}")
                        raise ValueError(f"Topic {i+1} missing 'title'")
                        
                    if "description" not in topic:
                        logger.error(f"Topic {i+1} missing 'description'. Keys found: {list(topic.keys())}")
                        raise ValueError(f"Topic {i+1} missing 'description'")
                        
                    if not isinstance(topic["title"], str):
                        logger.error(f"Topic {i+1} 'title' is not a string: {type(topic['title'])}")
                        raise ValueError(f"Topic {i+1} 'title' must be a string")
                        
                    if not isinstance(topic["description"], str):
                        logger.error(f"Topic {i+1} 'description' is not a string: {type(topic['description'])}")
                        raise ValueError(f"Topic {i+1} 'description' must be a string")
                    
                    validated_topics.append(SlideTopic(**topic))
                
                logger.info(f"Successfully validated {len(validated_topics)} topics")
                return validated_topics
                
            except ValueError as ve:
                logger.error(f"Value error in outline generation: {str(ve)}")
                raise
            except Exception as e:
                logger.error(f"Error in outline generation: {str(e)}")
                logger.error(traceback.format_exc())
                raise ValueError(f"Failed to generate outline: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to generate outline: {str(e)}")

    def generate_slide_content(self, topic: SlideTopic, level: InstructionalLevel) -> SlideContent:
        """Generate content for a single slide."""
        try:
            # Define the prompt structure
            prompt = {
                "task": "Create educational slide content",
                "topic": {
                    "title": topic.title,
                    "description": topic.description
                },
                "level": level.value,
                "requirements": [
                    "Include specific dates and events",
                    "Focus on measurable impacts",
                    "Provide concrete examples",
                    "Use clear, age-appropriate language",
                    "Ensure all content is historically accurate"
                ],
                "format": {
                    "title": topic.title,
                    "subtitle": "Optional subtitle",
                    "introduction": "Brief introduction with context",
                    "bullet_points": [
                        {
                            "text": "Main point with date",
                            "sub_points": [
                                "Specific detail or outcome",
                                "Measurable impact"
                            ],
                            "emphasis": True
                        }
                    ],
                    "examples": [
                        {
                            "description": "Specific historical example",
                            "details": [
                                "Concrete detail",
                                "Measurable outcome"
                            ]
                        }
                    ],
                    "key_takeaway": "Main lesson or understanding",
                    "discussion_questions": [
                        "Question about causes and effects",
                        "Question about historical significance"
                    ]
                }
            }

            completion = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a specialized educational content generator.
Your task is to create detailed, accurate slide content for history education.
Return only a JSON object matching the exact format provided.
Ensure all dates, events, and facts are historically accurate.
Include specific examples and measurable impacts.
Adapt language and complexity to the specified educational level."""
                    },
                    {"role": "user", "content": json.dumps(prompt, indent=2)}
                ],
                temperature=0.7,
                response_format={"type": "json_object"},
                timeout=45
            )

            # Get the response content
            response_text = completion.choices[0].message.content.strip()
            logger.debug(f"Raw OpenAI response for slide content: {response_text}")

            # Parse and validate the response
            content = self._parse_json_response(response_text, "slide content generation")
            
            # Convert to SlideContent model
            slide_content = SlideContent(**content)
            
            # Validate content specificity
            self._validate_content_specificity(content)
            
            return slide_content

        except Exception as e:
            logger.error(f"Error generating slide content: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to generate specific slide content: {str(e)}")

    def _validate_content_specificity(self, slide_data: dict) -> None:
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
            topic_words = ' '.join(sorted(set(point['text'].lower().split())))
            if topic_words in topic_fingerprints:
                raise ValueError(f"Bullet point {i+1} repeats a previously covered topic")
            topic_fingerprints.add(topic_words)
            
            # Main point should be more detailed
            check_text(point['text'], f"bullet point {i+1}", min_words=6)
            
            # Sub-points can be more concise if they contain specific data
            for j, sub_point in enumerate(point.get('sub_points', [])):
                check_text(sub_point, f"sub-point {i+1}.{j+1}", min_words=4)

        # Validate examples
        if not slide_data.get('examples'):
            raise ValueError("Missing examples")
            
        for i, example in enumerate(slide_data['examples']):
            # Check if example repeats a topic from bullet points
            example_words = ' '.join(sorted(set(example['description'].lower().split())))
            if example_words in topic_fingerprints:
                raise ValueError(f"Example {i+1} repeats content from bullet points")
            topic_fingerprints.add(example_words)
            
            # Description should be detailed
            check_text(example['description'], f"example {i+1}", min_words=5)
            
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
    
    def enhance_content(self, slide_content: SlideContent, level: InstructionalLevel) -> SlideContent:
        """Enhance slide content with Gemini Pro (optional enhancement)."""
        try:
            # Initialize Vertex AI
            aiplatform.init(project=os.getenv("GOOGLE_CLOUD_PROJECT"))
            return slide_content
        except Exception as e:
            logger.error(f"Error in enhance_content: {str(e)}")
            # Don't raise an error here, just return the original content
            return slide_content
