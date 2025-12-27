"""Custom application exceptions with structured error handling"""

from enum import Enum
from typing import Optional, Dict, Any


class ErrorCode(str, Enum):
    """Standard error codes for API responses"""
    
    # Authentication & Authorization
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INVALID_TOKEN = "INVALID_TOKEN"
    
    # Tenant
    INVALID_TENANT = "INVALID_TENANT"
    TENANT_NOT_FOUND = "TENANT_NOT_FOUND"
    
    # Resource
    NOT_FOUND = "NOT_FOUND"
    DASHBOARD_NOT_FOUND = "DASHBOARD_NOT_FOUND"
    CATALOG_NOT_FOUND = "CATALOG_NOT_FOUND"
    
    # Validation
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    
    # Database
    DATABASE_ERROR = "DATABASE_ERROR"
    CONNECTION_ERROR = "CONNECTION_ERROR"
    
    # External Services
    TRINO_ERROR = "TRINO_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    
    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # Server
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


class ApplicationException(Exception):
    """Base exception for all application errors"""
    
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500,
        original_error: Optional[Exception] = None,
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code
        self.original_error = original_error
        
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response"""
        return {
            "error": {
                "code": self.code.value,
                "message": self.message,
                "details": self.details,
            }
        }


class InvalidTenantException(ApplicationException):
    """Raised when tenant is invalid or not found"""
    
    def __init__(self, tenant: str):
        super().__init__(
            code=ErrorCode.INVALID_TENANT,
            message=f"Tenant '{tenant}' is invalid or not found",
            details={"tenant": tenant},
            status_code=403,
        )


class ResourceNotFoundException(ApplicationException):
    """Raised when a resource is not found"""
    
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            code=ErrorCode.NOT_FOUND,
            message=f"{resource_type} with id '{resource_id}' not found",
            details={"resource_type": resource_type, "resource_id": resource_id},
            status_code=404,
        )


class DashboardNotFoundException(ApplicationException):
    """Raised when a dashboard is not found"""
    
    def __init__(self, dashboard_id: str):
        super().__init__(
            code=ErrorCode.DASHBOARD_NOT_FOUND,
            message=f"Dashboard '{dashboard_id}' not found",
            details={"dashboard_id": dashboard_id},
            status_code=404,
        )


class ValidationException(ApplicationException):
    """Raised when validation fails"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            details=details or {},
            status_code=422,
        )


class DatabaseException(ApplicationException):
    """Raised when database operation fails"""
    
    def __init__(
        self,
        message: str,
        original_error: Optional[Exception] = None,
        operation: Optional[str] = None,
    ):
        super().__init__(
            code=ErrorCode.DATABASE_ERROR,
            message=message,
            details={"operation": operation} if operation else {},
            status_code=500,
            original_error=original_error,
        )


class TrinoException(ApplicationException):
    """Raised when Trino operation fails"""
    
    def __init__(
        self,
        message: str,
        original_error: Optional[Exception] = None,
        query: Optional[str] = None,
    ):
        super().__init__(
            code=ErrorCode.TRINO_ERROR,
            message=message,
            details={"query": query} if query else {},
            status_code=500,
            original_error=original_error,
        )


class RateLimitException(ApplicationException):
    """Raised when rate limit is exceeded"""
    
    def __init__(self, retry_after: int = 60):
        super().__init__(
            code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message="Rate limit exceeded. Please try again later.",
            details={"retry_after": retry_after},
            status_code=429,
        )


class UnauthorizedException(ApplicationException):
    """Raised when authentication fails"""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(
            code=ErrorCode.UNAUTHORIZED,
            message=message,
            status_code=401,
        )


class ForbiddenException(ApplicationException):
    """Raised when user doesn't have permission"""
    
    def __init__(self, message: str = "Forbidden"):
        super().__init__(
            code=ErrorCode.FORBIDDEN,
            message=message,
            status_code=403,
        )
