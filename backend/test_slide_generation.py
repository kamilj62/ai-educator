import httpx
import asyncio
import json

async def test_slide_generation():
    url = "https://ai-powerpoint-f44a1d57b590.herokuapp.com/api/generate/slide"
    
    # Using the first slide from our outline test
    payload = {
        "topic": {
            "title": "Introduction to the Solar System",
            "key_points": [
                "The solar system consists of the sun and eight planets",
                "Planets orbit the sun in specific paths",
                "Each planet has unique characteristics"
            ],
            "image_prompt": "Illustration showing the sun at the center with orbiting planets labeled",
            "description": "This slide provides an overview of the solar system and its basic components.",
            "id": "slide_1"
        },
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
                with open("slide_response.json", "w") as f:
                    json.dump(result, f, indent=2)
                print("\nResponse saved to slide_response.json")
            else:
                print("\nError response:")
                print(response.text)
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_slide_generation())
