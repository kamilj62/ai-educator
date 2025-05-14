import httpx
import asyncio
import json

async def test_slide_generation():
    url = "https://ai-powerpoint-f44a1d57b590.herokuapp.com/api/generate/slide"
    
    payload = {
        "topic": {
            "title": "The Water Cycle",
            "key_points": [
                "Evaporation: Water turns from liquid to vapor",
                "Condensation: Water vapor forms clouds",
                "Precipitation: Water falls as rain, snow, etc.",
                "Collection: Water collects in rivers, lakes, and oceans"
            ],
            "description": "The water cycle describes how water moves through the Earth's atmosphere, land, and oceans through processes like evaporation, condensation, and precipitation.",
            "image_prompt": "A colorful diagram of the water cycle showing evaporation, condensation, and precipitation"
        },
        "instructional_level": "middle_school",
        "layout": "title-bullets-image"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print("Sending request to:", url)
            response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            
            print(f"Status code: {response.status_code}")
            
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
