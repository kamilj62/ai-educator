import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

import pytest
from fastapi.testclient import TestClient
from backend.main import app

def get_sample_topic():
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

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_generate_slide_valid(client):
    payload = {
        "topic": get_sample_topic(),
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
    assert "bullet_points" in slide and isinstance(slide["bullet_points"], list)


def test_generate_slide_missing_keypoints(client):
    topic = get_sample_topic()
    topic["key_points"] = []  # Remove key points
    payload = {
        "topic": topic,
        "instructional_level": "high_school",
        "layout": "title-bullets"
    }
    response = client.post("/api/generate/slide", json=payload)
    # Should fail validation or return a 400/422 error
    assert response.status_code in (400, 422)


def test_generate_slide_invalid_layout(client):
    payload = {
        "topic": get_sample_topic(),
        "instructional_level": "high_school",
        "layout": "not-a-real-layout"
    }
    response = client.post("/api/generate/slide", json=payload)
    assert response.status_code in (400, 422)
    

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
