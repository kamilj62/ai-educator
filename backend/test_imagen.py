import os
from dotenv import load_dotenv
import asyncio
import logging
from google.cloud import aiplatform
from google.oauth2 import service_account

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_imagen_configuration():
    """Test Imagen API configuration and access."""
    try:
        # Load environment variables
        load_dotenv()
        
        # 1. Test environment variables
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        if not project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT environment variable not set")
        if not credentials_path:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
            
        logger.info(f"Found project ID: {project_id}")
        logger.info(f"Found credentials path: {credentials_path}")
        
        # 2. Test credentials file
        if not os.path.exists(credentials_path):
            raise FileNotFoundError(f"Credentials file not found at: {credentials_path}")
        
        # 3. Initialize credentials
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        
        logger.info("Successfully loaded service account credentials")
        
        # 4. Initialize Vertex AI with location
        aiplatform.init(
            project=project_id,
            location="us-central1",
            credentials=credentials
        )
        
        logger.info("Successfully initialized Vertex AI")
        
        # 5. Test Imagen model access
        prediction_client = aiplatform.gapic.PredictionServiceClient(
            client_options={"api_endpoint": "us-central1-aiplatform.googleapis.com"}
        )
        
        # Get the full resource name of the model
        model_name = f"projects/{project_id}/locations/us-central1/publishers/google/models/imagegeneration@002"
        
        # 6. Try a simple test generation
        instance = {
            "prompt": "A simple test image of a blue circle on a white background",
            "sampleCount": 1,
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_LOW_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_LOW_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_LOW_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_LOW_AND_ABOVE"}
            ]
        }
        
        logger.info("Attempting to generate a test image...")
        response = prediction_client.predict(
            endpoint=model_name,
            instances=[instance],
            parameters={"temperature": 0.2}
        )
        
        if response and hasattr(response, 'predictions') and response.predictions:
            logger.info("Successfully generated test image!")
            logger.info("API Response structure:")
            logger.info(str(response))
        else:
            logger.warning("No images in response")
            
        logger.info("All tests passed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    asyncio.run(test_imagen_configuration())
