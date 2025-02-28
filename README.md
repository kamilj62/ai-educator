# MarvelAI - AI-Powered Presentation Generator

MarvelAI is an innovative educational tool that uses AI to generate engaging, informative presentations. Built with FastAPI and Next.js, it helps educators create well-structured slides with accurate historical content.

## Features

- **Smart Outline Generation**: Creates structured outlines based on your topic
- **Dynamic Slide Creation**: Generates detailed slides with bullet points, examples, and discussion questions
- **Educational Level Adaptation**: Adjusts content complexity based on instructional level
- **Multiple Export Options**: Export to PDF, PowerPoint, or Google Slides
- **Real-time Preview**: See your slides as they're generated

## Tech Stack

### Frontend
- Next.js
- Redux Toolkit
- Material-UI (MUI)

### Backend
- FastAPI
- Pydantic
- OpenAI GPT-4

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/marvelAI.git
cd marvelAI
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
pip install -r requirements.txt
```

4. Set up environment variables:
Create `.env` files in both frontend and backend directories with the required configuration.

5. Start the development servers:

Backend:
```bash
cd backend
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

## Recent Updates

- Fixed slide generation to consistently produce the requested number of slides
- Improved content specificity with better prompts
- Enhanced error handling for partial slide generation
- Added support for multiple educational levels

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details
