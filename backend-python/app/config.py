"""Application configuration with environment variables"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Dict, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App
    APP_NAME: str = "Analytics Platform Backend"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Database - PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "analytics"
    POSTGRES_POOL_SIZE: int = 20
    POSTGRES_MAX_OVERFLOW: int = 10
    POSTGRES_ECHO: bool = False
    
    # Trino
    TRINO_HOST: str = "localhost"
    TRINO_PORT: int = 8080
    TRINO_CATALOG: str = "iceberg"
    TRINO_SCHEMA_PREFIX: str = "default"
    
    # Redis - Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = True
    CACHE_TTL_SECONDS: int = 300
    
    # Security
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    # Per-tenant scrypt password hashes (see scripts/hash_password.py)
    TENANT_PASSWORD_HASHES: Dict[str, str] = {}
    
    # Tenants
    VALID_TENANTS: List[str] = ["empresa1", "empresa2", "empresa3"]
    
    # Fallback Storage
    FALLBACK_STORAGE_ENABLED: bool = True
    FALLBACK_STORAGE_PATH: str = "/tmp/dashboards.json"

    # AWS Bedrock
    AWS_BEDROCK_ACCESS_KEY_ID: str = ""
    AWS_BEDROCK_SECRET_ACCESS_KEY: str = ""
    AWS_BEDROCK_REGION: str = "us-east-1"
    AWS_BEDROCK_MODEL_ID: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    LLM_MAX_TABLES_FOR_PROMPT: int = 15
    LLM_MAX_COLUMNS_FOR_PROMPT: int = 12
    
    # Logging
    LOG_FORMAT: str = "json"  # "json" or "standard"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
