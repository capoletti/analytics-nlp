"""Authentication router"""

import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.config import Settings, get_settings
from app.exceptions import UnauthorizedException
from app.infrastructure.security.jwt_tokens import create_access_token
from app.infrastructure.security.passwords import hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Verified against when the tenant is unknown so response timing doesn't reveal valid tenants
_DUMMY_HASH = hash_password("dummy-password-for-timing")


class LoginRequest(BaseModel):
    tenant: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=1024)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    tenant: str


@router.post("/login", response_model=TokenResponse, summary="Authenticate a tenant")
async def login(payload: LoginRequest, settings: Settings = Depends(get_settings)):
    stored_hash = None
    if payload.tenant in settings.VALID_TENANTS:
        stored_hash = settings.TENANT_PASSWORD_HASHES.get(payload.tenant)

    password_ok = verify_password(payload.password, stored_hash or _DUMMY_HASH)
    if stored_hash is None or not password_ok:
        logger.warning(f"Failed login for tenant: {payload.tenant}")
        raise UnauthorizedException("Invalid tenant or password")

    token, expires_in = create_access_token(payload.tenant, settings)
    return TokenResponse(access_token=token, expires_in=expires_in, tenant=payload.tenant)
