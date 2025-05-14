import httpx
import asyncio
import json
from datetime import datetime

def log_request_response(url, method, request_data, response_data, status_code, error=None):
    """Log detailed information about the request and response."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "url": url,
        "method": method,
        "request": request_data,
        "response": {
            "status_code": status_code,
            "data": response_data
        },
        "error": str(error) if error else None
    }
    
    # Print to console
    print(f"\n{'='*50}")
    print(f"TEST REQUEST - {timestamp}")
    print(f"URL: {method} {url}")
    print("\nREQUEST BODY:")
    print(json.dumps(request_data, indent=2))
    print(f"\nSTATUS CODE: {status_code}")
    print("\nRESPONSE:")
    print(json.dumps(response_data, indent=2) if isinstance(response_data, dict) else response_data)
    if error:
        print(f"\nERROR: {error}")
    print(f"{'='*50}\n")
    
    # Save to file
    with open("api_test_logs.json", "a") as f:
        json.dump(log_entry, f)
        f.write("\n")

async def test_slide_generation():
    url = "https://ai-powerpoint-f44a1d57b590.herokuapp.com/api/generate/slide"
    
    # Test with different layouts
    test_cases = [
        {
            "name": "Title Only",
            "layout": "title-only",
            "topic": {
                "title": "The Water Cycle",
                "description": "The water cycle describes how water moves through the Earth's atmosphere, land, and oceans.",
                "key_points": [
                    "Evaporation: Water turns from liquid to vapor",
                    "Condensation: Water vapor forms clouds",
                    "Precipitation: Water falls as rain, snow, etc.",
                    "Collection: Water collects in rivers, lakes, and oceans"
                ],
                "image_prompt": "A colorful diagram of the water cycle"
            },
            "instructional_level": "middle_school"
        },
        {
            "name": "Title with Bullets",
            "layout": "title-bullets",
            "topic": {
                "title": "The Water Cycle",
                "description": "The water cycle describes how water moves through the Earth's atmosphere, land, and oceans.",
                "key_points": [
                    "Evaporation: Water turns from liquid to vapor",
                    "Condensation: Water vapor forms clouds",
                    "Precipitation: Water falls as rain, snow, etc.",
                    "Collection: Water collects in rivers, lakes, and oceans"
                ],
                "image_prompt": "A colorful diagram of the water cycle"
            },
            "instructional_level": "middle_school"
        },
        {
            "name": "Title with Bullets and Image",
            "layout": "title-bullets-image",
            "topic": {
                "title": "The Water Cycle",
                "description": "The water cycle describes how water moves through the Earth's atmosphere, land, and oceans.",
                "key_points": [
                    "Evaporation: Water turns from liquid to vapor",
                    "Condensation: Water vapor forms clouds",
                    "Precipitation: Water falls as rain, snow, etc.",
                    "Collection: Water collects in rivers, lakes, and oceans"
                ],
                "image_prompt": "A colorful diagram of the water cycle"
            },
            "instructional_level": "middle_school"
        }
    ]
    
    async with httpx.AsyncClient() as client:
        for test_case in test_cases:
            print(f"\n{'*'*20} Testing: {test_case['name']} ({test_case['layout']}) {'*'*20}")
            
            payload = {
                "topic": test_case["topic"],
                "instructional_level": test_case["instructional_level"],
                "layout": test_case["layout"]
            }
            
            try:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=60.0
                )
                
                response_data = response.json() if response.content else {}
                
                log_request_response(
                    url=url,
                    method="POST",
                    request_data=payload,
                    response_data=response_data,
                    status_code=response.status_code
                )
                
                # Print a summary
                print(f"\nTEST CASE: {test_case['name']} ({test_case['layout']})")
                print(f"Status: {'SUCCESS' if response.status_code == 200 else 'FAILED'}")
                print(f"Response keys: {list(response_data.keys())}")
                
                # Check if the response contains the expected fields
                if test_case["layout"] == "title-bullets" or test_case["layout"] == "title-bullets-image":
                    if "content" in response_data and "key_points" not in response_data["content"]:
                        print("WARNING: key_points missing from response content")
                
                # Add a small delay between tests
                await asyncio.sleep(1)
                
            except Exception as e:
                log_request_response(
                    url=url,
                    method="POST",
                    request_data=payload,
                    response_data=None,
                    status_code=None,
                    error=e
                )
                print(f"Error in test case {test_case['name']}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_slide_generation())
