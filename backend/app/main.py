from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File, Form, Body
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

# Mount static files FIRST (before CORS middleware)
# Ensure directory exists
os.makedirs("data/images", exist_ok=True)
app.mount("/images", StaticFiles(directory="data/images"), name="images")

# Mount frontend static assets (built by Vite)
# Check if directory exists to avoid errors in dev mode
if os.path.exists("app/static/assets"):
    app.mount("/assets", StaticFiles(directory="app/static/assets"), name="assets")

# Configure CORS (after mounting static files)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all. In production, specify frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- Auth Routes ---

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.TokenData)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"username": current_user.username}

# --- Image Routes ---

@app.get("/api/images", response_model=schemas.ImagePagination)
def read_images(page: int = 1, limit: int = 20, db: Session = Depends(database.get_db)):
    skip = (page - 1) * limit
    images = db.query(models.Image).order_by(models.Image.remote_id.desc()).offset(skip).limit(limit).all()
    total = db.query(models.Image).count()
    
    return {
        "data": images,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.delete("/api/images/{image_id}")
def delete_image(image_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file from disk
    try:
        if image.local_path:
            file_path = os.path.join("data/images", image.local_path)
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")

    db.delete(image)
    db.commit()
    return {"ok": True}

@app.post("/api/upload", response_model=schemas.Image)
async def upload_image(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    import uuid
    from datetime import datetime
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"upload_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("data/images", unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create database record
    db_image = models.Image(
        remote_id=0,  # Manual upload
        title=title,
        view_count=0,
        download_count=0,
        thumbnail_url="",
        local_path=unique_filename,
        filename=file.filename,
        duration="图片",
        image_type="static",
        mtime=int(datetime.now().timestamp())
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    return db_image

@app.put("/api/images/{image_id}/rename", response_model=schemas.Image)
def rename_image(
    image_id: int,
    title: str = Body(..., embed=True),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image.title = title
    db.commit()
    db.refresh(image)
    
    return image

@app.get("/api/search", response_model=List[schemas.Image])
def search_images_endpoint(q: str, db: Session = Depends(database.get_db)):
    from . import search
    results = search.search_images(q, db, limit=50)
    return results

# --- Crawler Routes ---

@app.post("/api/crawl")
async def trigger_crawl(background_tasks: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from . import crawler
    import asyncio
    
    # Run in background
    asyncio.create_task(crawler.crawl_pighub(limit=20))
    return {"message": "Crawl started in background"}

@app.get("/api/logs", response_model=List[schemas.CrawlLog])
def read_logs(skip: int = 0, limit: int = 20, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = db.query(models.CrawlLog).order_by(models.CrawlLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

# Initial User Setup
@app.on_event("startup")
def create_initial_user():
    db = database.SessionLocal()
    user = db.query(models.User).first()
    if not user:
        import secrets
        import string
        # Generate a strong random password: 16 characters with letters, digits and symbols
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        random_password = ''.join(secrets.choice(alphabet) for i in range(16))
        
        hashed_password = auth.get_password_hash(random_password)
        db_user = models.User(username="Labyrinth", hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        
        # Print credentials for first-time setup
        print("=" * 60)
        print("🔐 初始管理员账户已创建:")
        print(f"   用户名: Labyrinth")
        print(f"   密码: {random_password}")
        print("   ⚠️  请立即登录并妥善保存此密码！")
        print("=" * 60)
    
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



