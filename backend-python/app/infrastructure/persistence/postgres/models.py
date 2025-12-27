"""SQLAlchemy database models for PostgreSQL"""

from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json

Base = declarative_base()


class DashboardModel(Base):
    """SQLAlchemy model for Dashboard"""
    
    __tablename__ = "dashboards"
    
    id = Column(String(36), primary_key=True, nullable=False)
    tenant = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    elements = Column(Text, nullable=False, default="[]")  # JSON stored as text
    filters = Column(Text, nullable=False, default="{}")   # JSON stored as text
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes for query optimization
    __table_args__ = (
        Index("idx_tenant_created", "tenant", "created_at"),
        Index("idx_tenant_name", "tenant", "name"),
    )
    
    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "tenant": self.tenant,
            "name": self.name,
            "description": self.description,
            "elements": json.loads(self.elements) if self.elements else [],
            "filters": json.loads(self.filters) if self.filters else {},
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
