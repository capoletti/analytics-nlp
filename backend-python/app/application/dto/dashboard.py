"""Dashboard DTOs for API requests/responses"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime


class DashboardElementDTO(BaseModel):
    """DTO for dashboard element"""
    
    id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(chart|table|kpi)$")
    config: Dict[str, Any]
    sql: Optional[str] = None

    # Allow constructing from domain entities via attribute access
    model_config = {
        "from_attributes": True
    }
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name is not just whitespace"""
        if not v.strip():
            raise ValueError("Name cannot be only whitespace")
        return v.strip()


class DashboardCreateDTO(BaseModel):
    """DTO for creating a dashboard"""
    
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    elements: List[DashboardElementDTO] = Field(..., min_length=1)
    filters: Dict[str, Any] = Field(default_factory=dict)
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name"""
        if not v.strip():
            raise ValueError("Name cannot be only whitespace")
        return v.strip()


class DashboardUpdateDTO(BaseModel):
    """DTO for updating a dashboard"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    elements: Optional[List[DashboardElementDTO]] = Field(None, min_length=1)
    filters: Optional[Dict[str, Any]] = None


class DashboardResponseDTO(BaseModel):
    """DTO for dashboard response"""
    
    id: str
    tenant: str
    name: str
    description: Optional[str]
    elements: List[DashboardElementDTO]
    filters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True  # SQLAlchemy compatibility
    }


class DashboardListResponseDTO(BaseModel):
    """DTO for paginated dashboard list"""
    
    dashboards: List[DashboardResponseDTO]
    total: int
    skip: int
    limit: int
