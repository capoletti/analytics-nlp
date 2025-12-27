"""Mapper for converting between entities and models"""

import json
from app.domain.dashboard.entities import Dashboard, DashboardElement
from app.infrastructure.persistence.postgres.models import DashboardModel


class DashboardMapper:
    """Maps Dashboard entity to/from SQLAlchemy model"""
    
    @staticmethod
    def to_model(dashboard: Dashboard) -> DashboardModel:
        """Convert domain entity to SQLAlchemy model"""
        return DashboardModel(
            id=dashboard.id,
            tenant=dashboard.tenant,
            name=dashboard.name,
            description=dashboard.description,
            elements=json.dumps([
                {
                    "id": elem.id,
                    "name": elem.name,
                    "type": elem.type,
                    "config": elem.config,
                    "sql": elem.sql,
                }
                for elem in dashboard.elements
            ]),
            filters=json.dumps(dashboard.filters),
            created_at=dashboard.created_at,
            updated_at=dashboard.updated_at,
        )
    
    @staticmethod
    def to_entity(model: DashboardModel) -> Dashboard:
        """Convert SQLAlchemy model to domain entity"""
        elements_data = json.loads(model.elements) if model.elements else []
        filters_data = json.loads(model.filters) if model.filters else {}
        
        elements = [
            DashboardElement(
                id=e["id"],
                name=e["name"],
                type=e["type"],
                config=e["config"],
                sql=e.get("sql"),
            )
            for e in elements_data
        ]
        
        return Dashboard(
            id=model.id,
            tenant=model.tenant,
            name=model.name,
            description=model.description,
            elements=elements,
            filters=filters_data,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
