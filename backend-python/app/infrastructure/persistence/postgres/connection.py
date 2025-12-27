"""PostgreSQL async connection management"""

import logging
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from app.config import get_settings

logger = logging.getLogger(__name__)


class PostgreSQLConnection:
    """Manages PostgreSQL connections with async support and pooling"""
    
    _instance: "PostgreSQLConnection" = None
    _engine: AsyncEngine = None
    _session_factory: async_sessionmaker = None
    
    @classmethod
    async def initialize(cls) -> None:
        """Initialize connection pool at application startup"""
        if cls._engine is not None:
            logger.debug("PostgreSQL already initialized, skipping")
            return
        
        settings = get_settings()
        
        # Build async database URL
        database_url = (
            f"postgresql+asyncpg://"
            f"{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@"
            f"{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/"
            f"{settings.POSTGRES_DB}"
        )
        
        # Create async engine with connection pooling
        cls._engine = create_async_engine(
            database_url,
            echo=settings.POSTGRES_ECHO,
            pool_size=settings.POSTGRES_POOL_SIZE,
            max_overflow=settings.POSTGRES_MAX_OVERFLOW,
            pool_pre_ping=True,        # Validate connections before using
            pool_recycle=3600,         # Recycle connections every hour
            connect_args={
                "timeout": 10,
                "command_timeout": 10,
            }
        )
        
        # Create session factory
        cls._session_factory = async_sessionmaker(
            cls._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        
        logger.info(
            "PostgreSQL connection pool initialized",
            extra={
                "pool_size": settings.POSTGRES_POOL_SIZE,
                "max_overflow": settings.POSTGRES_MAX_OVERFLOW,
            }
        )
    
    @classmethod
    async def close(cls) -> None:
        """Close all connections at application shutdown"""
        if cls._engine is None:
            return
        
        await cls._engine.dispose()
        cls._engine = None
        cls._session_factory = None
        logger.info("PostgreSQL connection pool closed")
    
    @classmethod
    async def get_session(cls) -> AsyncSession:
        """Get an async session for database operations"""
        if cls._session_factory is None:
            await cls.initialize()
        
        return cls._session_factory()
