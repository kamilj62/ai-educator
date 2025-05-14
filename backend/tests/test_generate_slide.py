import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

# This fixture is provided by conftest.py
# client fixture is provided by conftest.py

def test_generate_slide_valid(client, sample_topic):
    payload = {
        "topic": sample_topic,
        "instructional_level": "high_school",
        "layout": "title-bullets"
    }
    response = client.post("/api/generate/slide", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data and "slide" in data["data"]
    slide = data["data"]["slide"]
    assert slide["title"]
    assert slide["layout"] == "title-bullets"
    assert "key_points" in slide and isinstance(slide["key_points"], list)

def test_generate_slide_missing_keypoints(client, sample_topic):
    topic = sample_topic.copy()
    topic["key_points"] = []  # Remove key points
    payload = {
        "topic": topic,
        "instructional_level": "high_school",
        "layout": "title-bullets"
    }
    response = client.post("/api/generate/slide", json=payload)
    # Should fail validation or return a 400/422 error
    assert response.status_code in (400, 422)

def test_generate_slide_invalid_layout(sample_topic):
    """Test that an invalid layout raises a validation error."""
    from pydantic import ValidationError
    from server import SlideGenerationRequest
    
    # This should raise a validation error due to invalid layout
    with pytest.raises(ValidationError) as exc_info:
        SlideGenerationRequest(
            topic=sample_topic,
            instructional_level="high_school",
            layout="not-a-real-layout"
        )
    
    # Check that the error is about the layout field
    errors = exc_info.value.errors()
    assert any(
        error["loc"] == ("layout",) and 
        ("string does not match regex" in error["msg"] or 
         error.get("type") == "string_pattern_mismatch")
        for error in errors
    ), f"Expected validation error for layout, but got: {errors}"

def test_generate_slide_minimal(client):
    payload = {
        "topic": {
            "title": "Gravity",
            "description": "The force that attracts a body toward the center of the earth.",
            "key_points": ["Universal force", "Acts at a distance", "Explains planetary motion"],
            "image_prompt": "A diagram of gravity acting on Earth",
            "subtopics": []
        },
        "instructional_level": "elementary",
        "layout": "title-only"
    }
    response = client.post("/api/generate/slide", json=payload)
    assert response.status_code == 200
    data = response.json()
    slide = data["data"]["slide"]
    assert slide["title"]
    assert slide["layout"] == "title-only"
