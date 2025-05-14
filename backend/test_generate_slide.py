import httpx
import asyncio
import json

async def generate_slide():
    url = "http://localhost:8000/api/generate/slide"
    
    # Sample slide data
    payload = {
        "topic": {
            "id": "water-cycle-1",
            "title": "The Water Cycle",
            "key_points": [
                "Water evaporates from the Earth's surface",
                "Water vapor condenses to form clouds",
                "Precipitation returns water to the Earth's surface",
                "Water collects in rivers, lakes, and oceans"
            ],
            "image_prompt": "A colorful diagram of the water cycle showing evaporation, condensation, and precipitation",
            "description": "The water cycle describes how water moves through the Earth's atmosphere, land, and oceans through processes like evaporation, condensation, and precipitation.",
            "subtopics": []
        },
        "instructional_level": "middle_school",
        "layout": "title-bullets-image"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            
            if response.status_code == 200:
                result = response.json()
                print("Successfully generated slide:")
                print(json.dumps(result, indent=2))
                
                # Save the response to a file
                with open("slide_response.json", "w") as f:
                    json.dump(result, f, indent=2)
                print("\nResponse saved to slide_response.json")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(generate_slide())
