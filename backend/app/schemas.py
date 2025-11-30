from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SourceURLBase(BaseModel):
    url: str
    name: Optional[str] = None
    interval_minutes: int = 60
    is_active: bool = True

class SourceURLCreate(SourceURLBase):
    pass

class SourceURL(SourceURLBase):
    id: int
    last_crawled: Optional[datetime] = None

    class Config:
        from_attributes = True

class ImageBase(BaseModel):
    remote_id: int
    title: str
    view_count: int
    download_count: int
    thumbnail_url: str
    filename: str
    duration: str
    image_type: str
    mtime: int

class Image(ImageBase):
    id: int
    local_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class CrawlLogBase(BaseModel):
    status: str
    images_found: int
    images_downloaded: int
    error_message: Optional[str] = None

class CrawlLog(CrawlLogBase):
    id: int
    source_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ImagePagination(BaseModel):
    data: List[Image]
    total: int
    page: int
    limit: int
