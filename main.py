# Entrypoint for Heroku FastAPI deployment. Copied from backend/main.py
import sys
import traceback
try:
    sys.path.insert(0, './backend')
    from backend.main import app
    print('Successfully imported app from backend.main')
except Exception as e:
    print('Error importing app from backend.main:', e)
    traceback.print_exc()
    app = None
