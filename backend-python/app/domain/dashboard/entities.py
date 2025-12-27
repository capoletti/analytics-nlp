"""Dashboard domain entities and value objects"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID


@dataclass
class DashboardElement:
    """Value object representing a dashboard element"""
    
    id: str
    name: str
    type: str  # "chart", "table", "kpi"
    config: Dict[str, Any]
    sql: Optional[str] = None
    
    def validate(self) -> None:
        """Validate element data"""
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Element name cannot be empty")
        if self.type not in ["chart", "table", "kpi"]:
            raise ValueError(f"Invalid element type: {self.type}")


@dataclass
class Dashboard:
    """Domain entity representing a Dashboard"""
    
    id: str
    tenant: str
    name: str
    description: Optional[str]
    elements: List[DashboardElement] = field(default_factory=list)
    filters: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def validate(self) -> None:
        """Validate dashboard business rules"""
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Dashboard name cannot be empty")
        
        if len(self.name) > 255:
            raise ValueError("Dashboard name cannot exceed 255 characters")
        
        if self.description and len(self.description) > 1000:
            raise ValueError("Description cannot exceed 1000 characters")
        
        if len(self.elements) == 0:
            raise ValueError("Dashboard must have at least one element")
        
        # Validate all elements
        for element in self.elements:
            element.validate()
    
    def update(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        elements: Optional[List[DashboardElement]] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Update dashboard with business rule validation"""
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        if elements is not None:
            self.elements = elements
        if filters is not None:
            self.filters = filters
        
        self.updated_at = datetime.utcnow()
        self.validate()
    
    def add_element(self, element: DashboardElement) -> None:
        """Add element to dashboard"""
        element.validate()
        self.elements.append(element)
        self.updated_at = datetime.utcnow()
    
    def remove_element(self, element_id: str) -> bool:
        """Remove element by id"""
        initial_count = len(self.elements)
        self.elements = [e for e in self.elements if e.id != element_id]
        
        if len(self.elements) < initial_count:
            self.updated_at = datetime.utcnow()
            return True
        return False
