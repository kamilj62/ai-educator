import httpx
import asyncio
import json

async def test_outline_generation():
    url = "https://ai-powerpoint-f44a1d57b590.herokuapp.com/api/generate/outline"
    
    payload = {
        "context": "The Solar System and Space Exploration",
        "num_slides": 3,
        "instructional_level": "elementary"
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
                with open("outline_response.json", "w") as f:
                    json.dump(result, f, indent=2)
                print("\nResponse saved to outline_response.json")
            else:
                print("\nError response:")
                print(response.text)
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_outline_generation())
