from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Load OpenAI API key from credentials
try:
    with open('credentials/marvelai-imagen-sa-key.json', 'r') as f:
        credentials = json.load(f)
        openai.api_key = credentials.get('openai_api_key')
except Exception as e:
    print(f"Error loading credentials: {str(e)}")
    raise

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        prompt = data.get('prompt', '')
        service = data.get('service', 'dalle')

        if not prompt:
            prompt = "A professional, minimalist presentation slide background"

        if service != 'dalle':
            return jsonify({'error': 'Only DALL-E service is currently supported'}), 400

        print(f"Generating image with prompt: {prompt}")  # Debug log

        # Generate image using DALL-E
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size="1024x1024"
        )

        image_url = response['data'][0]['url']
        print(f"Generated image URL: {image_url}")  # Debug log
        return jsonify({'imageUrl': image_url})

    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server on port 8000...")  # Debug log
    app.run(debug=True, port=8000)
