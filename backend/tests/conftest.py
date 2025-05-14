import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import using relative imports
from main import app, ai_service
from ai_service import AIService
from rate_limiter import RateLimiter

@pytest.fixture(scope="module")
def mock_ai_service():
    # Create a mock RateLimiter
    mock_rate_limiter = MagicMock(spec=RateLimiter)
    
    # Create a mock AIService with the mock RateLimiter
    mock_service = MagicMock(spec=AIService)
    mock_service.rate_limiter = mock_rate_limiter
    
    # Mock the generate_slide_content method
    mock_service.generate_slide_content.return_value = {
        "title": "Test Slide",
        "key_points": ["Point 1", "Point 2"],
        "layout": "title-bullets"
    }
    
    return mock_service

@pytest.fixture(scope="module")
def client(mock_ai_service):
    # Override the ai_service in the app with our mock
    app.dependency_overrides = {}
    app.dependency_overrides[ai_service] = lambda: mock_ai_service
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides = {}

# This fixture provides the sample topic data
@pytest.fixture(scope="module")
def sample_topic():
    return {
        "title": "Photosynthesis",
        "description": "The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.",
        "key_points": [
            "Occurs in chloroplasts",
            "Produces glucose and oxygen",
            "Requires sunlight"
        ],
        "image_prompt": "A diagram of photosynthesis in a leaf",
        "subtopics": []
    }
