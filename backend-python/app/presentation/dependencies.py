"""API dependencies for FastAPI"""

import logging
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.postgres.connection import PostgreSQLConnection
from app.infrastructure.persistence.postgres.dashboard_repository import (
    PostgreSQLDashboardRepository,
)
from app.application.services.dashboard_service import DashboardService
from app.application.services.bedrock_service import BedrockService

logger = logging.getLogger(__name__)


async def get_db_session() -> AsyncSession:
    """Dependency to get database session"""
    session = await PostgreSQLConnection.get_session()
    try:
        yield session
    finally:
        await session.close()


async def get_dashboard_service(
    session: AsyncSession = Depends(get_db_session),
) -> DashboardService:
    """Dependency to get dashboard service"""
    repository = PostgreSQLDashboardRepository(session)
    return DashboardService(repository)

def get_bedrock_service() -> BedrockService:
    """Dependency to get Bedrock service"""
    return BedrockService()
