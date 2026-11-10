"""API dependencies for FastAPI"""

import logging
from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.exceptions import ForbiddenException, UnauthorizedException
from app.infrastructure.security.jwt_tokens import decode_access_token

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


_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_tenant(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> str:
    """Return the tenant bound to the caller's bearer token"""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedException("Missing bearer token")
    return decode_access_token(credentials.credentials, settings)


def require_tenant_access(
    tenant: str,
    current_tenant: str = Depends(get_current_tenant),
) -> str:
    """Ensure the tenant in the path matches the authenticated tenant"""
    if tenant != current_tenant:
        logger.warning(f"Tenant mismatch: token={current_tenant} path={tenant}")
        raise ForbiddenException("Access to this tenant is not allowed")
    return current_tenant
