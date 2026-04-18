# AI Educator — Educational Presentation Generator

An AI-powered tool that generates complete educational presentations from a topic and difficulty level. Enter any subject, select an instructional level, and the app produces a full slide deck with AI-generated content and images — exported as a viewable presentation or downloadable PowerPoint file.

🌐 **Live Demo:** [ai-educator-ten.vercel.app](https://ai-educator-ten.vercel.app)

Deployed on Vercel (frontend) with a FastAPI backend.

---

## What It Does

- 📝 **Generates slide outlines** — AI creates a structured educational outline from any topic
- 🖼️ **AI-generated images** — each slide gets a contextually relevant image via Google Vertex AI (Imagen) with DALL-E as fallback
- 🎓 **Multiple instructional levels** — adapts content complexity for different audiences
- 📊 **Fullscreen presentation mode** — built-in slideshow viewer in the browser
- 💾 **PowerPoint export** — download the generated deck as a `.pptx` file
- 🛡️ **Rate limiting & error handling** — exponential backoff, content safety checks, automatic fallback between image providers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | FastAPI + Uvicorn |
| LLM | OpenAI GPT (content generation) |
| Image Generation | Google Vertex AI (Imagen) + DALL-E fallback |
| Cloud | Google Cloud Platform (Vertex AI) |
| Deployment | Vercel (frontend) |
| Dependency Management | pip + virtualenv |

---

## Project Structure

```
ai-educator/
├── backend/
│   ├── main.py                  # FastAPI app entry point, all API routes
│   ├── ai_service.py            # Core AI logic — outline generation, image generation
│   ├── presentation_service.py  # PowerPoint (.pptx) creation and export
│   ├── models.py                # Pydantic data models
│   ├── rate_limiter.py          # Rate limiting with exponential backoff
│   ├── exceptions.py            # Custom error types and handlers
│   ├── app.py                   # Flask app (image generation endpoint)
│   └── requirements.txt         # Python dependencies
├── frontend/                    # React frontend
├── static/                      # Generated slide images
├── env.template                 # Environment variable template
└── Procfile                     # Deployment config
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key
- Google Cloud account with Vertex AI enabled (for Imagen)

### 1. Clone the repo

```bash
git clone https://github.com/kamilj62/ai-educator.git
cd ai-educator
```

### 2. Set up environment variables

```bash
cp env.template .env
```

Edit `.env` with your credentials:

```env
OPENAI_API_KEY=your_openai_key_here
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=backend/credentials/your-service-account-key.json
```

### 3. Set up Google Cloud (for Imagen image generation)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Vertex AI API**
3. Create a service account with these roles:
   - `roles/aiplatform.user`
   - `roles/serviceusage.serviceUsageViewer`
4. Download the service account key JSON and place it in `backend/credentials/`

> If Imagen is unavailable, the app automatically falls back to DALL-E.

### 4. Install backend dependencies

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

### 6. Run the app

**Backend:**
```bash
source venv/bin/activate
cd backend
python3 main.py
```

**Frontend (new terminal):**
```bash
cd frontend
npm start
```

The app will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## How It Works

1. User enters a **topic** and selects an **instructional level**
2. Backend sends the topic to OpenAI to generate a structured **slide outline**
3. For each slide, the AI generates:
   - Educational content (title, bullets, examples)
   - A contextually relevant image prompt
4. Images are generated via **Google Vertex AI Imagen** (with automatic DALL-E fallback if Imagen is unavailable or rate-limited)
5. The complete presentation is rendered in the browser with a fullscreen slideshow mode
6. User can export the deck as a **.pptx** PowerPoint file

---

## Key Features

**Dual image provider with automatic fallback**
The app tries Google Vertex AI Imagen first for higher quality images. If it hits a rate limit or error, it automatically switches to DALL-E without any interruption to the user.

**Rate limiting with exponential backoff**
Built-in rate limiter handles API throttling gracefully — retries with increasing delays rather than failing immediately.

**Content safety checks**
Sensitive topics are detected and handled with appropriate guardrails before being sent to image generation APIs.

**PowerPoint export**
Generated presentations can be downloaded as `.pptx` files using `python-pptx`, preserving slide structure and images.

---

## Author

**Joseph Kamil** — AI/ML Engineer based in Los Angeles, CA

Built with AI coding assistance (Windsurf/Codeium). Architecture, design decisions, and implementation directed by Joseph Kamil.

- GitHub: [@kamilj62](https://github.com/kamilj62)
- Email: kamilj@umich.edu

---

## License

MIT
