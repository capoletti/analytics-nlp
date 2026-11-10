"""FastAPI application factory"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.utils import setup_logging, get_logger
from app.infrastructure.persistence.postgres.connection import PostgreSQLConnection
from app.infrastructure.persistence.postgres.models import Base
from app.presentation.routers import auth, dashboard, health, charts, catalog, llm
from app.presentation.middleware.logging import LoggingMiddleware
from app.presentation.middleware.error_handler import register_exception_handlers

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up application")
    await PostgreSQLConnection.initialize()
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    await PostgreSQLConnection.close()


def create_app() -> FastAPI:
    """Factory function to create FastAPI application"""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Analytics Platform Backend - Clean Architecture with FastAPI",
        lifespan=lifespan,
        debug=settings.DEBUG,
    )
    
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Custom Logging Middleware
    app.add_middleware(LoggingMiddleware)
    
    # Exception handlers
    register_exception_handlers(app)
    
    # Include routers
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(dashboard.router)
    app.include_router(charts.router)
    app.include_router(catalog.router)
    app.include_router(llm.router)
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        workers=4 if not settings.DEBUG else 1,
        log_config=None,  # Use custom logging
        reload=settings.DEBUG,
    )
