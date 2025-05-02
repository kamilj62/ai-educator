# Marvel AI - Educational Presentation Generator

An AI-powered tool that generates educational presentations with visually engaging slides.

## Features

- Generate comprehensive educational outlines
- Create visually engaging slides with AI-generated images
- Support for multiple educational levels
- Fullscreen presentation mode with cross-browser support
- Robust error handling and fallback mechanisms

## Setup

1. Clone the repository:
```bash
git clone https://github.com/kamilj62/ai-educator.git
<<<<<<< HEAD
cd marvelAI
=======
cd ai-educator
>>>>>>> 8da82d2 (Update GitHub username in README)
```

2. Set up environment variables:
```bash
# Copy the environment template
cp env.template .env

# Edit .env with your credentials
nano .env
```

3. Install dependencies:
```bash
# Backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## API Credentials

### Google Cloud Setup (Imagen)
1. Create a project in Google Cloud Console
2. Enable the Vertex AI API
3. Create a service account with the following roles:
   - `roles/aiplatform.user`
   - `roles/serviceusage.serviceUsageViewer`
4. Download the service account key JSON file
5. Update `.env` with:
   - `GOOGLE_CLOUD_PROJECT`: Your project ID
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account key file

### OpenAI Setup (DALL-E Fallback)
1. Create an account at [OpenAI](https://platform.openai.com)
2. Generate an API key
3. Add the key to `.env`: `OPENAI_API_KEY=your_key_here`

## Running the Application

1. Start the backend server:
```bash
# From the project root
source venv/bin/activate
cd backend
python3 main.py
```

2. Start the frontend development server:
```bash
# In a new terminal, from the project root
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Error Handling

The application includes robust error handling:
- Automatic fallback from Imagen to DALL-E
- Rate limit handling with exponential backoff
- Comprehensive logging for debugging
- Clear error messages in the UI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Security Notes

- Never commit API keys or credentials to the repository
- Always use environment variables for sensitive data
- Keep your `.env` file secure and never share it
- Regularly rotate your API keys

## License

This project is licensed under the MIT License - see the LICENSE file for details.
