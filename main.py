# Entrypoint for Heroku FastAPI deployment. Copied from backend/main.py
import sys
sys.path.insert(0, './backend')
from backend.main import app
