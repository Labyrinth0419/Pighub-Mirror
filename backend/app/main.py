from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from . import models, database, auth, schemas
from .database import engine
import os

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Image Mirror API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all. In production, specify frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (Images)
# Ensure directory exists
os.makedirs("data/images", exist_ok=True)
app.mount("/images", StaticFiles(directory="data/images"), name="images")

# Mount frontend static assets (built by Vite)
# We assume the 'assets' folder is inside 'app/static' after Docker build
# Check if directory exists to avoid errors in dev mode
if os.path.exists("app/static/assets"):
    app.mount("/assets", StaticFiles(directory="app/static/assets"), name="assets")

# ... (Auth Routes, Image Routes, Crawler Routes remain the same) ...

# Initial User Setup
@app.on_event("startup")
def create_initial_user():
    db = database.SessionLocal()
    user = db.query(models.User).first()
    if not user:
        hashed_password = auth.get_password_hash("admin")
        db_user = models.User(username="admin", hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
    
    # Check if we need to run full sync
    image_count = db.query(models.Image).count()
    if image_count == 0:
        print("Database is empty. Triggering FULL SYNC...")
        from . import crawler
        import asyncio
        asyncio.create_task(crawler.crawl_all_images())

    db.close()
    
    # Start Scheduler
    from . import scheduler
    scheduler.start_scheduler()

from fastapi.responses import FileResponse

# Catch-all for SPA
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # API requests should have been handled by specific routes or return 404 if not found
    if full_path.startswith("api") or full_path.startswith("images") or full_path.startswith("assets"):
         raise HTTPException(status_code=404, detail="Not Found")
    
    # Serve index.html for all other routes (client-side routing)
    # In dev mode, this might fail if static files aren't built, but we use Vite dev server in dev.
    # This is for production Docker container.
    index_path = "app/static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not built or not found. Please run in Docker or build frontend."}



