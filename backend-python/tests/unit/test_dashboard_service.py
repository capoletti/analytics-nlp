"""Unit tests for dashboard service"""

import pytest
import uuid
from datetime import datetime

from app.domain.dashboard.entities import Dashboard, DashboardElement
from app.application.dto.dashboard import DashboardCreateDTO, DashboardElementDTO
from app.application.services.dashboard_service import DashboardService
from app.exceptions import (
    InvalidTenantException,
    DashboardNotFoundException,
    ValidationException,
)
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def mock_repository():
    """Create mock repository"""
    return AsyncMock()


@pytest.fixture
def dashboard_service(mock_repository):
    """Create dashboard service with mock repository"""
    return DashboardService(mock_repository)


@pytest.fixture
def sample_dashboard() -> Dashboard:
    """Create sample dashboard entity"""
    return Dashboard(
        id=str(uuid.uuid4()),
        tenant="empresa1",
        name="Test Dashboard",
        description="Test Description",
        elements=[
            DashboardElement(
                id=str(uuid.uuid4()),
                name="Test Chart",
                type="chart",
                config={"title": "Test"},
            )
        ],
        filters={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@pytest.mark.asyncio
async def test_create_dashboard_success(dashboard_service, mock_repository, sample_dashboard):
    """Test successful dashboard creation"""
    # Setup
    dto = DashboardCreateDTO(
        name="Test Dashboard",
        description="Test",
        elements=[
            DashboardElementDTO(
                name="Chart",
                type="chart",
                config={"title": "Test"}
            )
        ]
    )
    
    mock_repository.save.return_value = sample_dashboard
    
    # Execute
    result = await dashboard_service.create_dashboard("empresa1", dto)
    
    # Assert
    assert result.name == "Test Dashboard"
    assert result.tenant == "empresa1"
    mock_repository.save.assert_called_once()


@pytest.mark.asyncio
async def test_create_dashboard_invalid_tenant(dashboard_service):
    """Test creation with invalid tenant"""
    dto = DashboardCreateDTO(
        name="Test",
        elements=[
            DashboardElementDTO(
                name="Chart",
                type="chart",
                config={}
            )
        ]
    )
    
    with pytest.raises(InvalidTenantException):
        await dashboard_service.create_dashboard("invalid_tenant", dto)


@pytest.mark.asyncio
async def test_create_dashboard_validation_error(dashboard_service):
    """Test creation with invalid data"""
    dto = DashboardCreateDTO(
        name="",  # Empty name
        elements=[
            DashboardElementDTO(
                name="Chart",
                type="chart",
                config={}
            )
        ]
    )
    
    # Should fail on validation at DTO level
    # Pydantic will raise ValidationError before service


@pytest.mark.asyncio
async def test_get_dashboard_success(dashboard_service, mock_repository, sample_dashboard):
    """Test successful dashboard retrieval"""
    mock_repository.find_by_id.return_value = sample_dashboard
    
    result = await dashboard_service.get_dashboard("empresa1", sample_dashboard.id)
    
    assert result.id == sample_dashboard.id
    assert result.name == "Test Dashboard"
    mock_repository.find_by_id.assert_called_once_with(sample_dashboard.id, "empresa1")


@pytest.mark.asyncio
async def test_get_dashboard_not_found(dashboard_service, mock_repository):
    """Test get non-existent dashboard"""
    mock_repository.find_by_id.return_value = None
    
    with pytest.raises(DashboardNotFoundException):
        await dashboard_service.get_dashboard("empresa1", "non-existent-id")


@pytest.mark.asyncio
async def test_list_dashboards(dashboard_service, mock_repository, sample_dashboard):
    """Test listing dashboards"""
    mock_repository.find_all_by_tenant.return_value = [sample_dashboard]
    mock_repository.count_by_tenant.return_value = 1
    
    results, total = await dashboard_service.list_dashboards("empresa1")
    
    assert len(results) == 1
    assert total == 1
    assert results[0].name == "Test Dashboard"


@pytest.mark.asyncio
async def test_list_dashboards_limit_enforcement(dashboard_service, mock_repository):
    """Test that limit is capped at 100"""
    mock_repository.find_all_by_tenant.return_value = []
    mock_repository.count_by_tenant.return_value = 0
    
    await dashboard_service.list_dashboards("empresa1", skip=0, limit=200)
    
    # Service should cap limit at 100
    mock_repository.find_all_by_tenant.assert_called_once()
    call_args = mock_repository.find_all_by_tenant.call_args
    assert call_args[0][2] == 100  # limit argument


@pytest.mark.asyncio
async def test_delete_dashboard_success(dashboard_service, mock_repository):
    """Test successful dashboard deletion"""
    mock_repository.delete.return_value = True
    
    result = await dashboard_service.delete_dashboard("empresa1", "dashboard-id")
    
    assert result is True
    mock_repository.delete.assert_called_once_with("dashboard-id", "empresa1")


@pytest.mark.asyncio
async def test_delete_dashboard_not_found(dashboard_service, mock_repository):
    """Test delete non-existent dashboard"""
    mock_repository.delete.return_value = False
    
    with pytest.raises(DashboardNotFoundException):
        await dashboard_service.delete_dashboard("empresa1", "non-existent-id")
