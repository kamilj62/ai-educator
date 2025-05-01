from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",  # Next.js frontend
        "http://127.0.0.1:3002",  # Alternative frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"status": "ok"}

@app.get("/test")
async def test():
    return {"message": "Server is working"}

if __name__ == "__main__":
    import uvicorn
    print("Starting minimal server on port 9090...")
    uvicorn.run(app, host="127.0.0.1", port=9090, log_level="info")
