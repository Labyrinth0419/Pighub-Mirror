import jieba
from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models

def search_images(query: str, db: Session, limit: int = 20):
    """
    使用 jieba 分词进行图片搜索
    """
    if not query or not query.strip():
        return []
    
    # 对查询词进行分词
    keywords = jieba.cut_for_search(query)
    keywords = [kw.strip() for kw in keywords if kw.strip() and len(kw.strip()) > 1]
    
    if not keywords:
        return []
    
    # 构建 OR 条件：任意关键词匹配标题
    conditions = [models.Image.title.like(f"%{kw}%") for kw in keywords]
    
    # 查询数据库
    results = db.query(models.Image).filter(or_(*conditions)).order_by(
        models.Image.created_at.desc()
    ).limit(limit).all()
    
    return results
