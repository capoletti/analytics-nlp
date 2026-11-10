"""JWT issuing and verification bound to a tenant identity"""

from datetime import datetime, timedelta, timezone

import jwt

from app.config import Settings
from app.exceptions import ApplicationException, ErrorCode, UnauthorizedException

INSECURE_JWT_SECRETS = {"", "your-super-secret-key-change-in-production"}
MIN_JWT_SECRET_LENGTH = 32


def _get_secret(settings: Settings) -> str:
    secret = settings.JWT_SECRET
    if secret in INSECURE_JWT_SECRETS or len(secret) < MIN_JWT_SECRET_LENGTH:
        raise ApplicationException(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="Authentication is not configured",
            status_code=500,
        )
    return secret


def create_access_token(tenant: str, settings: Settings) -> tuple[str, int]:
    expires_in = settings.JWT_EXPIRATION_HOURS * 3600
    now = datetime.now(timezone.utc)
    payload = {
        "sub": tenant,
        "tenant": tenant,
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, _get_secret(settings), algorithm=settings.JWT_ALGORITHM)
    return token, expires_in


def decode_access_token(token: str, settings: Settings) -> str:
    """Return the tenant bound to a valid token"""
    try:
        payload = jwt.decode(
            token,
            _get_secret(settings),
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "iat", "tenant"]},
        )
    except jwt.PyJWTError:
        raise UnauthorizedException("Invalid or expired token")

    tenant = payload.get("tenant")
    if not isinstance(tenant, str) or tenant not in settings.VALID_TENANTS:
        raise UnauthorizedException("Invalid or expired token")
    return tenant
