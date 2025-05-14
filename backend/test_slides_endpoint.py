import httpx
import asyncio
import json

async def test_slides_endpoint():
    url = "https://ai-powerpoint-f44a1d57b590.herokuapp.com/api/generate/slides"
    
    # Using the outline we got earlier
    payload = {
        "topics": [
            {
                "id": "slide_1",
                "title": "Introduction to the Solar System",
                "key_points": [
                    "The solar system consists of the sun and eight planets",
                    "Planets orbit the sun in specific paths",
                    "Each planet has unique characteristics"
                ],
                "image_prompt": "Illustration showing the sun at the center with orbiting planets labeled",
                "description": "This slide provides an overview of the solar system and its basic components.",
                "subtopics": []
            },
            {
                "id": "slide_2",
                "title": "Space Exploration History",
                "key_points": [
                    "Humans have sent spacecraft to explore space",
                    "First human landing on the moon was in 1969",
                    "Space telescopes help us study distant galaxies"
                ],
                "image_prompt": "Historical photo of astronauts on the moon's surface",
                "description": "This slide highlights key milestones in space exploration history.",
                "subtopics": []
            }
        ],
        "instructional_level": "elementary",
        "layout": "title-bullets-image"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print("Sending request to:", url)
            print("Payload:", json.dumps(payload, indent=2))
            
            response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            
            print(f"\nStatus code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("\nSuccess! Response:")
                print(json.dumps(result, indent=2))
                
                # Save the response to a file
                with open("slides_response.json", "w") as f:
                    json.dump(result, f, indent=2)
                print("\nResponse saved to slides_response.json")
            else:
                print("\nError response:")
                print(response.text)
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_slides_endpoint())
