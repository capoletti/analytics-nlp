"""Dashboard application service with business logic"""

import logging
import uuid
from typing import List, Tuple, Optional
from datetime import datetime

from app.domain.dashboard.entities import Dashboard, DashboardElement
from app.domain.dashboard.repositories import DashboardRepository
from app.application.dto.dashboard import (
    DashboardCreateDTO,
    DashboardUpdateDTO,
    DashboardResponseDTO,
)
from app.exceptions import (
    InvalidTenantException,
    DashboardNotFoundException,
    ValidationException,
    DatabaseException,
)
from app.config import get_settings

logger = logging.getLogger(__name__)


class DashboardService:
    """Business logic for dashboard operations"""
    
    def __init__(self, repository: DashboardRepository):
        self.repository = repository
        self.settings = get_settings()
    
    def _validate_tenant(self, tenant: str) -> None:
        """Validate tenant exists"""
        if tenant not in self.settings.VALID_TENANTS:
            logger.warning(f"Invalid tenant: {tenant}")
            raise InvalidTenantException(tenant)
    
    async def create_dashboard(
        self,
        tenant: str,
        dto: DashboardCreateDTO
    ) -> DashboardResponseDTO:
        """Create a new dashboard with validation"""
        self._validate_tenant(tenant)
        
        try:
            # Convert DTO to domain entities
            elements = [
                DashboardElement(
                    id=elem.id or str(uuid.uuid4()),
                    name=elem.name,
                    type=elem.type,
                    config=elem.config,
                    sql=elem.sql,
                )
                for elem in dto.elements
            ]
            
            # Create domain entity
            dashboard = Dashboard(
                id=str(uuid.uuid4()),
                tenant=tenant,
                name=dto.name,
                description=dto.description,
                elements=elements,
                filters=dto.filters,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            
            # Validate business rules
            dashboard.validate()
            
            # Persist
            saved = await self.repository.save(dashboard)
            
            logger.info(
                f"Dashboard created",
                extra={"dashboard_id": saved.id, "tenant": tenant}
            )
            
            return DashboardResponseDTO.model_validate(saved)
        
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise ValidationException(str(e))
        except InvalidTenantException:
            raise
        except Exception as e:
            logger.error(f"Error creating dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to create dashboard",
                original_error=e
            )
    
    async def get_dashboard(
        self,
        tenant: str,
        dashboard_id: str
    ) -> DashboardResponseDTO:
        """Retrieve a dashboard by ID"""
        self._validate_tenant(tenant)
        
        try:
            dashboard = await self.repository.find_by_id(dashboard_id, tenant)
            
            if not dashboard:
                logger.warning(f"Dashboard not found: {dashboard_id}")
                raise DashboardNotFoundException(dashboard_id)
            
            return DashboardResponseDTO.model_validate(dashboard)
        
        except DashboardNotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error getting dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to get dashboard",
                original_error=e
            )
    
    async def list_dashboards(
        self,
        tenant: str,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[DashboardResponseDTO], int]:
        """List dashboards with pagination"""
        self._validate_tenant(tenant)
        
        # Enforce max limit to prevent DoS
        if limit > 100:
            limit = 100
        
        try:
            dashboards = await self.repository.find_all_by_tenant(
                tenant,
                skip=skip,
                limit=limit
            )
            
            total = await self.repository.count_by_tenant(tenant)
            
            logger.debug(
                f"Listed dashboards",
                extra={"tenant": tenant, "count": len(dashboards), "total": total}
            )
            
            return (
                [DashboardResponseDTO.model_validate(d) for d in dashboards],
                total
            )
        
        except Exception as e:
            logger.error(f"Error listing dashboards: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to list dashboards",
                original_error=e
            )
    
    async def update_dashboard(
        self,
        tenant: str,
        dashboard_id: str,
        dto: DashboardUpdateDTO
    ) -> DashboardResponseDTO:
        """Update a dashboard"""
        self._validate_tenant(tenant)
        
        try:
            dashboard = await self.repository.find_by_id(dashboard_id, tenant)
            
            if not dashboard:
                raise DashboardNotFoundException(dashboard_id)
            
            # Update with provided values
            update_data = {}
            if dto.name is not None:
                update_data["name"] = dto.name
            if dto.description is not None:
                update_data["description"] = dto.description
            if dto.elements is not None:
                update_data["elements"] = [
                    DashboardElement(
                        id=elem.id or str(uuid.uuid4()),
                        name=elem.name,
                        type=elem.type,
                        config=elem.config,
                        sql=elem.sql,
                    )
                    for elem in dto.elements
                ]
            if dto.filters is not None:
                update_data["filters"] = dto.filters
            
            dashboard.update(**update_data)
            
            saved = await self.repository.update(dashboard)
            
            logger.info(
                f"Dashboard updated",
                extra={"dashboard_id": dashboard_id, "tenant": tenant}
            )
            
            return DashboardResponseDTO.model_validate(saved)
        
        except (DashboardNotFoundException, ValueError):
            raise
        except Exception as e:
            logger.error(f"Error updating dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to update dashboard",
                original_error=e
            )
    
    async def delete_dashboard(
        self,
        tenant: str,
        dashboard_id: str
    ) -> bool:
        """Delete a dashboard"""
        self._validate_tenant(tenant)
        
        try:
            deleted = await self.repository.delete(dashboard_id, tenant)
            
            if not deleted:
                raise DashboardNotFoundException(dashboard_id)
            
            logger.info(
                f"Dashboard deleted",
                extra={"dashboard_id": dashboard_id, "tenant": tenant}
            )
            
            return True
        
        except DashboardNotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to delete dashboard",
                original_error=e
            )
