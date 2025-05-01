import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")  # Print first & last part of key

# Set OpenAI API key
openai.api_key = api_key

# Test API call
try:
    models = openai.Model.list()
    print("✅ Successfully connected to OpenAI API!")
except openai.error.AuthenticationError:
    print("❌ Invalid API Key! Check your OpenAI account.")
except Exception as e:
    print(f"❌ Another error occurred: {e}")
