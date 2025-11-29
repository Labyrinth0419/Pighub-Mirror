import httpx
import os
import uuid
from sqlalchemy.orm import Session
from . import models, database
import logging
import asyncio
from datetime import datetime
from urllib.parse import urljoin

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

IMAGE_DIR = "data/images"
API_BASE_URL = "https://www.pighub.top/api/images"
BASE_URL = "https://www.pighub.top"

async def download_image(client: httpx.AsyncClient, image_data: dict, db: Session) -> bool:
    """
    下载单张图片并保存到数据库
    """
    try:
        remote_id = int(image_data["id"])
        
        # 检查是否已存在
        existing = db.query(models.Image).filter(models.Image.remote_id == remote_id).first()
        if existing:
            return False

        # 构建下载链接
        thumbnail_path = image_data.get("thumbnail")
        if not thumbnail_path:
            return False
            
        # 如果 thumbnail 已经是完整 URL 则直接使用，否则拼接
        if thumbnail_path.startswith("http"):
            download_url = thumbnail_path
        else:
            download_url = urljoin(BASE_URL, thumbnail_path)

        logger.info(f"Downloading {download_url}")
        
        response = await client.get(download_url)
        if response.status_code != 200:
            logger.error(f"Failed to download {download_url}: Status {response.status_code}")
            return False
        
        # 生成本地文件名
        # 尝试保留原始扩展名
        original_filename = image_data.get("filename", "")
        ext = os.path.splitext(original_filename)[1]
        if not ext:
            ext = ".jpg" # 默认回退
            
        local_filename = f"{remote_id}_{uuid.uuid4()}{ext}"
        local_filepath = os.path.join(IMAGE_DIR, local_filename)

        # 确保目录存在
        os.makedirs(IMAGE_DIR, exist_ok=True)

        # 保存文件
        with open(local_filepath, "wb") as f:
            f.write(response.content)

        # 保存到数据库
        db_image = models.Image(
            remote_id=remote_id,
            title=image_data.get("title", "Untitled"),
            view_count=image_data.get("view_count", 0),
            download_count=image_data.get("download_count", 0),
            thumbnail_url=thumbnail_path,
            local_path=local_filename, # 存储相对路径
            filename=original_filename,
            duration=image_data.get("duration", "static"),
            image_type=image_data.get("image_type", "static"),
            mtime=image_data.get("mtime", 0)
        )
        db.add(db_image)
        db.commit()
        return True
    except Exception as e:
        logger.error(f"Error processing image {image_data.get('id')}: {e}")
        return False

async def crawl_pighub(limit: int = 20):
    """
    爬取 Pighub API
    """
    db = database.SessionLocal()
    
    logger.info(f"Starting crawl from Pighub API")
    
    log = models.CrawlLog(status="running")
    db.add(log)
    db.commit()

    images_found = 0
    images_downloaded = 0
    status_msg = "success"
    error_msg = None

    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            # 获取列表
            api_url = f"{API_BASE_URL}?limit={limit}&sort=latest"
            response = await client.get(api_url)
            
            if response.status_code == 200:
                data = response.json()
                images_list = data.get("images", [])
                images_found = len(images_list)
                
                tasks = []
                for img_data in images_list:
                    tasks.append(download_image(client, img_data, db))
                
                results = await asyncio.gather(*tasks)
                images_downloaded = sum(results)
            else:
                raise Exception(f"API returned status {response.status_code}")

    except Exception as e:
        logger.error(f"Crawl failed: {e}")
        status_msg = "failed"
        error_msg = str(e)
    
    # 更新日志
    log.status = status_msg
    log.images_found = images_found
    log.images_downloaded = images_downloaded
    log.error_message = error_msg
    
    db.commit()
    db.close()
    logger.info(f"Finished crawl. Downloaded {images_downloaded}/{images_found}")
