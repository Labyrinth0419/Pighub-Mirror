from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class SourceURL(Base):
    __tablename__ = "source_urls"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    interval_minutes = Column(Integer, default=60)
    last_crawled = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    logs = relationship("CrawlLog", back_populates="source")

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    remote_id = Column(Integer, unique=True, index=True) # Pighub ID
    title = Column(String)
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    thumbnail_url = Column(String) # Original thumbnail URL from API
    local_path = Column(String) # Local storage path relative to static root
    filename = Column(String)
    duration = Column(String) # e.g. "图片", "GIF"
    image_type = Column(String) # e.g. "static", "animated"
    mtime = Column(BigInteger) # Unix timestamp
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("source_urls.id"), nullable=True) # Nullable for general API crawl
    status = Column(String) # "success", "failed"
    images_found = Column(Integer, default=0)
    images_downloaded = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source = relationship("SourceURL", back_populates="logs")
