"""Health check and info routers"""

import logging
from fastapi import APIRouter
from datetime import datetime

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "analytics-platform-backend"
    }


@router.get("/info")
async def get_info():
    """Get API information"""
    settings = get_settings()
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
        "timestamp": datetime.utcnow().isoformat()
    }
