from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Basic CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Server is running"}

if __name__ == "__main__":
    import uvicorn
    print("Starting test server on port 9090...")
    uvicorn.run(app, host="127.0.0.1", port=9090)
