"""Async repository implementation for PostgreSQL"""

import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.domain.dashboard.entities import Dashboard
from app.domain.dashboard.repositories import DashboardRepository
from app.infrastructure.persistence.postgres.models import DashboardModel
from app.application.mappers.dashboard_mapper import DashboardMapper
from app.exceptions import DatabaseException

logger = logging.getLogger(__name__)


class PostgreSQLDashboardRepository(DashboardRepository):
    """Async PostgreSQL implementation of DashboardRepository"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def save(self, dashboard: Dashboard) -> Dashboard:
        """Save a new dashboard"""
        try:
            model = DashboardMapper.to_model(dashboard)
            self.session.add(model)
            await self.session.commit()
            await self.session.refresh(model)
            
            logger.info(f"Dashboard saved: {dashboard.id} for tenant {dashboard.tenant}")
            return DashboardMapper.to_entity(model)
        
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error saving dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to save dashboard",
                original_error=e,
                operation="save"
            )
    
    async def update(self, dashboard: Dashboard) -> Dashboard:
        """Update an existing dashboard"""
        try:
            stmt = select(DashboardModel).where(
                DashboardModel.id == dashboard.id
            )
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()
            
            if not model:
                return None
            
            # Update fields
            updated_model = DashboardMapper.to_model(dashboard)
            model.name = updated_model.name
            model.description = updated_model.description
            model.elements = updated_model.elements
            model.filters = updated_model.filters
            model.updated_at = updated_model.updated_at
            
            await self.session.commit()
            await self.session.refresh(model)
            
            logger.info(f"Dashboard updated: {dashboard.id}")
            return DashboardMapper.to_entity(model)
        
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error updating dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to update dashboard",
                original_error=e,
                operation="update"
            )
    
    async def find_by_id(
        self,
        dashboard_id: str,
        tenant: str
    ) -> Optional[Dashboard]:
        """Find dashboard by ID"""
        try:
            stmt = select(DashboardModel).where(
                (DashboardModel.id == dashboard_id) &
                (DashboardModel.tenant == tenant)
            )
            result = await self.session.execute(stmt)
            model = result.scalar_one_or_none()
            
            if not model:
                logger.debug(f"Dashboard not found: {dashboard_id}")
                return None
            
            return DashboardMapper.to_entity(model)
        
        except Exception as e:
            logger.error(f"Error finding dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to find dashboard",
                original_error=e,
                operation="find_by_id"
            )
    
    async def find_all_by_tenant(
        self,
        tenant: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Dashboard]:
        """Find all dashboards for a tenant with pagination"""
        try:
            stmt = (
                select(DashboardModel)
                .where(DashboardModel.tenant == tenant)
                .offset(skip)
                .limit(limit)
                .order_by(DashboardModel.created_at.desc())
            )
            result = await self.session.execute(stmt)
            models = result.scalars().all()
            
            logger.debug(f"Found {len(models)} dashboards for tenant {tenant}")
            return [DashboardMapper.to_entity(m) for m in models]
        
        except Exception as e:
            logger.error(f"Error listing dashboards: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to list dashboards",
                original_error=e,
                operation="find_all_by_tenant"
            )
    
    async def count_by_tenant(self, tenant: str) -> int:
        """Count total dashboards for a tenant"""
        try:
            stmt = select(func.count()).select_from(DashboardModel).where(
                DashboardModel.tenant == tenant
            )
            result = await self.session.execute(stmt)
            count = result.scalar()
            
            logger.debug(f"Dashboard count for tenant {tenant}: {count}")
            return count or 0
        
        except Exception as e:
            logger.error(f"Error counting dashboards: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to count dashboards",
                original_error=e,
                operation="count_by_tenant"
            )
    
    async def delete(self, dashboard_id: str, tenant: str) -> bool:
        """Delete a dashboard"""
        try:
            stmt = delete(DashboardModel).where(
                (DashboardModel.id == dashboard_id) &
                (DashboardModel.tenant == tenant)
            )
            result = await self.session.execute(stmt)
            await self.session.commit()
            
            deleted = result.rowcount > 0
            if deleted:
                logger.info(f"Dashboard deleted: {dashboard_id}")
            else:
                logger.debug(f"Dashboard not found for deletion: {dashboard_id}")
            
            return deleted
        
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error deleting dashboard: {str(e)}", exc_info=True)
            raise DatabaseException(
                message="Failed to delete dashboard",
                original_error=e,
                operation="delete"
            )
