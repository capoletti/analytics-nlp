"""Dashboard repository interface (abstraction)"""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.dashboard.entities import Dashboard


class DashboardRepository(ABC):
    """Abstract repository for dashboard persistence"""
    
    @abstractmethod
    async def save(self, dashboard: Dashboard) -> Dashboard:
        """Save a new dashboard"""
        pass
    
    @abstractmethod
    async def update(self, dashboard: Dashboard) -> Dashboard:
        """Update an existing dashboard"""
        pass
    
    @abstractmethod
    async def find_by_id(self, dashboard_id: str, tenant: str) -> Optional[Dashboard]:
        """Find dashboard by ID"""
        pass
    
    @abstractmethod
    async def find_all_by_tenant(
        self,
        tenant: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Dashboard]:
        """Find all dashboards for a tenant with pagination"""
        pass
    
    @abstractmethod
    async def count_by_tenant(self, tenant: str) -> int:
        """Count total dashboards for a tenant"""
        pass
    
    @abstractmethod
    async def delete(self, dashboard_id: str, tenant: str) -> bool:
        """Delete a dashboard"""
        pass
