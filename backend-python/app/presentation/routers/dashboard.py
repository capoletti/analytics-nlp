"""Dashboard API router"""

import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import JSONResponse

from app.application.services.dashboard_service import DashboardService
from app.application.dto.dashboard import (
    DashboardCreateDTO,
    DashboardUpdateDTO,
    DashboardResponseDTO,
    DashboardListResponseDTO,
)
from app.presentation.dependencies import get_dashboard_service, require_tenant_access
from app.exceptions import ApplicationException

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/dashboards",
    tags=["dashboards"],
    dependencies=[Depends(require_tenant_access)],
    responses={
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    }
)


@router.post(
    "/{tenant}",
    response_model=DashboardResponseDTO,
    status_code=201,
    summary="Create new dashboard",
    description="Create a new dashboard for a specific tenant"
)
async def create_dashboard(
    tenant: str,
    dto: DashboardCreateDTO,
    service: DashboardService = Depends(get_dashboard_service),
):
    """Create a new dashboard"""
    try:
        return await service.create_dashboard(tenant, dto)
    except ApplicationException as e:
        logger.warning(f"Application error: {e.message}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/{tenant}/{dashboard_id}",
    response_model=DashboardResponseDTO,
    summary="Get dashboard by ID",
    description="Retrieve a specific dashboard"
)
async def get_dashboard(
    tenant: str,
    dashboard_id: str,
    service: DashboardService = Depends(get_dashboard_service),
):
    """Get a dashboard by ID"""
    try:
        return await service.get_dashboard(tenant, dashboard_id)
    except ApplicationException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/{tenant}",
    response_model=DashboardListResponseDTO,
    summary="List dashboards",
    description="List all dashboards for a tenant with pagination"
)
async def list_dashboards(
    tenant: str,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    service: DashboardService = Depends(get_dashboard_service),
):
    """List dashboards with pagination"""
    try:
        dashboards, total = await service.list_dashboards(tenant, skip, limit)
        return DashboardListResponseDTO(
            dashboards=dashboards,
            total=total,
            skip=skip,
            limit=limit
        )
    except ApplicationException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put(
    "/{tenant}/{dashboard_id}",
    response_model=DashboardResponseDTO,
    summary="Update dashboard",
    description="Update an existing dashboard"
)
async def update_dashboard(
    tenant: str,
    dashboard_id: str,
    dto: DashboardUpdateDTO,
    service: DashboardService = Depends(get_dashboard_service),
):
    """Update a dashboard"""
    try:
        return await service.update_dashboard(tenant, dashboard_id, dto)
    except ApplicationException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete(
    "/{tenant}/{dashboard_id}",
    status_code=204,
    summary="Delete dashboard",
    description="Delete a dashboard"
)
async def delete_dashboard(
    tenant: str,
    dashboard_id: str,
    service: DashboardService = Depends(get_dashboard_service),
):
    """Delete a dashboard"""
    try:
        await service.delete_dashboard(tenant, dashboard_id)
    except ApplicationException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
