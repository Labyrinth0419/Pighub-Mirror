from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from . import models, database, crawler
import asyncio
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def check_and_run_crawls():
    """
    定期运行爬虫任务
    """
    # 这里我们简化逻辑，直接调用 Pighub 爬虫
    # 在实际应用中，可以根据 SourceURL 配置来决定爬取哪些源
    # 但目前需求主要针对 Pighub API
    from . import crawler
    await crawler.crawl_pighub(limit=20)

def start_scheduler():
    # Run the check every 60 minutes (default)
    # But for testing, maybe every minute? Let's stick to a reasonable default.
    # User can configure source intervals, but we need a master ticker.
    scheduler.add_job(check_and_run_crawls, IntervalTrigger(minutes=60))
    scheduler.start()
    logger.info("Scheduler started")
