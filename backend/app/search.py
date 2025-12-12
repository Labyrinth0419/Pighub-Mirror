from sqlalchemy.orm import Session
from . import models

def search_images(query: str, db: Session, limit: int = 20):
    """
    使用直接文本搜索图片标题
    """
    if not query or not query.strip():
        return []
    
    # 直接使用 LIKE 进行子串匹配
    search_pattern = f"%{query.strip()}%"
    
    # 查询数据库
    results = db.query(models.Image).filter(
        models.Image.title.like(search_pattern)
    ).order_by(
        models.Image.remote_id.desc()
    ).limit(limit).all()
    
    return results
