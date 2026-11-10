"""Authentication router"""

import logging
from functools import lru_cache

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.config import Settings, get_settings
from app.exceptions import RateLimitException, UnauthorizedException
from app.infrastructure.security.login_throttle import LoginThrottle
from app.infrastructure.security.jwt_tokens import create_access_token
from app.infrastructure.security.passwords import hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Verified against when the tenant is unknown so response timing doesn't reveal valid tenants
_DUMMY_HASH = hash_password("dummy-password-for-timing")


@lru_cache()
def get_login_throttle() -> LoginThrottle:
    settings = get_settings()
    return LoginThrottle(settings.LOGIN_MAX_FAILURES, settings.LOGIN_FAILURE_WINDOW_SECONDS)


class LoginRequest(BaseModel):
    tenant: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=1024)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    tenant: str


@router.post("/login", response_model=TokenResponse, summary="Authenticate a tenant")
def login(
    payload: LoginRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    throttle: LoginThrottle = Depends(get_login_throttle),
):
    # Sync handler: FastAPI runs it in the threadpool so scrypt doesn't block the event loop
    client_ip = request.client.host if request.client else "unknown"
    # Per (client, tenant) so one tenant's failures don't lock out others behind the same IP;
    # unknown tenants share one bucket so rotating names can't bypass the limit.
    tenant_key = payload.tenant if payload.tenant in settings.VALID_TENANTS else "*"
    throttle_key = f"{client_ip}:{tenant_key}"
    retry_after = throttle.try_acquire(throttle_key)
    if retry_after:
        logger.warning(f"Login throttled for client {client_ip}")
        raise RateLimitException(retry_after=retry_after)

    stored_hash = None
    if payload.tenant in settings.VALID_TENANTS:
        stored_hash = settings.TENANT_PASSWORD_HASHES.get(payload.tenant)

    password_ok = verify_password(payload.password, stored_hash or _DUMMY_HASH)
    if stored_hash is None or not password_ok:
        logger.warning(f"Failed login for tenant: {payload.tenant}")
        raise UnauthorizedException("Invalid tenant or password")

    throttle.release(throttle_key)
    token, expires_in = create_access_token(payload.tenant, settings)
    return TokenResponse(access_token=token, expires_in=expires_in, tenant=payload.tenant)
