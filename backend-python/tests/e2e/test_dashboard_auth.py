"""Authentication and tenant isolation for dashboard routes"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import AsyncMock

from main import create_app
from app.config import get_settings
from app.infrastructure.security.jwt_tokens import create_access_token
from app.infrastructure.security.passwords import hash_password
from app.presentation.dependencies import get_dashboard_service

TEST_SECRET = "test-secret-key-with-at-least-32-characters"


@pytest.fixture
def settings(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", TEST_SECRET)
    monkeypatch.setenv(
        "TENANT_PASSWORD_HASHES",
        '{"empresa1": "%s"}' % hash_password("senha-empresa1"),
    )
    get_settings.cache_clear()
    yield get_settings()
    get_settings.cache_clear()


@pytest.fixture
def service():
    svc = AsyncMock()
    svc.list_dashboards.return_value = ([], 0)
    return svc


@pytest_asyncio.fixture
async def client(settings, service):
    app = create_app()
    app.dependency_overrides[get_dashboard_service] = lambda: service
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c


def auth(tenant, settings):
    token, _ = create_access_token(tenant, settings)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_without_token_is_401(client, service):
    response = await client.get("/api/dashboards/empresa2")
    assert response.status_code == 401
    service.list_dashboards.assert_not_called()


@pytest.mark.asyncio
async def test_invalid_token_is_401(client, service):
    response = await client.get(
        "/api/dashboards/empresa1", headers={"Authorization": "Bearer not-a-jwt"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_signed_with_other_secret_is_401(client, settings):
    import jwt

    forged = jwt.encode({"tenant": "empresa2", "iat": 0, "exp": 9999999999}, "x" * 40, "HS256")
    response = await client.get(
        "/api/dashboards/empresa2", headers={"Authorization": f"Bearer {forged}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/api/dashboards/empresa2"),
        ("GET", "/api/dashboards/empresa2/abc"),
        ("POST", "/api/dashboards/empresa2"),
        ("PUT", "/api/dashboards/empresa2/abc"),
        ("DELETE", "/api/dashboards/empresa2/abc"),
    ],
)
async def test_cross_tenant_is_403(client, settings, service, method, path):
    response = await client.request(
        method, path, headers=auth("empresa1", settings), json={"name": "x"}
    )
    assert response.status_code == 403
    for call in service.method_calls:
        pytest.fail(f"service called: {call}")


@pytest.mark.asyncio
async def test_own_tenant_is_allowed(client, settings, service):
    response = await client.get("/api/dashboards/empresa1", headers=auth("empresa1", settings))
    assert response.status_code == 200
    service.list_dashboards.assert_awaited_once_with("empresa1", 0, 50)


@pytest.mark.asyncio
async def test_login_issues_token_for_own_tenant(client):
    response = await client.post(
        "/api/auth/login", json={"tenant": "empresa1", "password": "senha-empresa1"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    own = await client.get(
        "/api/dashboards/empresa1", headers={"Authorization": f"Bearer {token}"}
    )
    other = await client.get(
        "/api/dashboards/empresa2", headers={"Authorization": f"Bearer {token}"}
    )
    assert own.status_code == 200
    assert other.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "tenant,password",
    [("empresa1", "errada"), ("empresa2", "senha-empresa1"), ("inexistente", "x")],
)
async def test_login_rejects_bad_credentials(client, tenant, password):
    response = await client.post("/api/auth/login", json={"tenant": tenant, "password": password})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_default_jwt_secret_is_refused(monkeypatch, service):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv(
        "TENANT_PASSWORD_HASHES", '{"empresa1": "%s"}' % hash_password("senha-empresa1")
    )
    get_settings.cache_clear()
    try:
        app = create_app()
        async with AsyncClient(app=app, base_url="http://test") as c:
            response = await c.post(
                "/api/auth/login", json={"tenant": "empresa1", "password": "senha-empresa1"}
            )
        assert response.status_code == 500
    finally:
        get_settings.cache_clear()
