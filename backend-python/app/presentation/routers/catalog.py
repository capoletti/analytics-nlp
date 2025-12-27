"""Catalog API router - Data discovery endpoints"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.infrastructure.external.trino.client import get_trino_client

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/catalog",
    tags=["catalog"],
    responses={
        400: {"description": "Bad request"},
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    }
)


class CatalogResponse(BaseModel):
    """Response with catalog information"""
    tables: List[str]
    schemas: List[str] = []


@router.get("/{tenant}")
async def get_catalog(tenant: str) -> Dict[str, Any]:
    """
    Get catalog information for a tenant
    
    Args:
        tenant: Tenant ID (used as schema name in Trino)
    
    Returns:
        Catalog information with list of tables
    """
    try:
        trino_client = get_trino_client()
        
        # In Trino, tenant maps to schema
        tables = trino_client.get_tables(tenant)
        
        logger.info(f"Found {len(tables)} tables in tenant/schema: {tenant}")
        
        return {
            "tables": tables,
            "tenant": tenant,
            "schema": tenant
        }
    except Exception as e:
        logger.error(f"Error getting catalog for tenant {tenant}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get catalog: {str(e)}"
        )


@router.get("/{tenant}/table/{table_name}")
async def get_table_info(tenant: str, table_name: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific table
    
    Args:
        tenant: Tenant ID (used as schema name)
        table_name: Table name
    
    Returns:
        Table information with schema details
    """
    try:
        trino_client = get_trino_client()
        columns = trino_client.get_table_schema(table_name, tenant)
        
        return {
            "table": table_name,
            "schema": tenant,
            "columns": columns
        }
    except Exception as e:
        logger.error(f"Error getting table info for {table_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get table info: {str(e)}"
        )
