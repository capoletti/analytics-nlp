"""Charts data API router"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from pydantic import BaseModel, Field

from app.infrastructure.external.trino.client import get_trino_client
from app.exceptions import TrinoException

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/charts",
    tags=["charts"],
    responses={
        400: {"description": "Bad request"},
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    }
)


class FilterItem(BaseModel):
    field: str
    op: str
    value: Any


class FilterGroup(BaseModel):
    logical: str = "AND"
    items: List[FilterItem] = Field(default_factory=list)


class Metric(BaseModel):
    column: str
    aggregation: str = "sum"


class ChartDataRequest(BaseModel):
    """Request body for fetching chart data"""
    table: Optional[str] = None
    sql: Optional[str] = None
    limit: int = 1000
    offset: int = 0
    filters: Optional[FilterGroup] = None
    dimensions: Optional[List[str]] = None
    metrics: Optional[List[Metric]] = None
    xAxis: Optional[str] = None
    yAxis: Optional[List[str]] = None


class ChartDataResponse(BaseModel):
    """Response with chart data"""
    data: List[Dict[str, Any]]
    total: int
    limit: int
    offset: int


@router.get("/tables")
async def get_tables(schema: str = Query("default", description="Schema name")) -> Dict[str, List[str]]:
    """
    Get list of available tables in a schema
    
    Args:
        schema: Schema name (default: "default")
    
    Returns:
        List of table names
    """
    try:
        trino_client = get_trino_client()
        tables = trino_client.get_tables(schema)
        logger.info(f"Found {len(tables)} tables in schema {schema}")
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Error getting tables: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get tables: {str(e)}")


@router.get("/table/{table_name}/schema")
async def get_table_schema(
    table_name: str,
    schema: str = Query("default", description="Schema name")
) -> Dict[str, Any]:
    """
    Get schema (columns) of a table
    
    Args:
        table_name: Table name
        schema: Schema name (default: "default")
    
    Returns:
        Table schema with column information
    """
    try:
        trino_client = get_trino_client()
        columns = trino_client.get_table_schema(table_name, schema)
        return {"table": table_name, "schema": schema, "columns": columns}
    except Exception as e:
        logger.error(f"Error getting table schema: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get table schema: {str(e)}")


@router.post("/data")
async def get_chart_data(
    request: ChartDataRequest,
    tenant: str = Query(..., description="Tenant ID")
) -> ChartDataResponse:
    """
    Get data for a chart from Trino
    
    Args:
        request: Chart data request with table or SQL
        tenant: Tenant ID
    
    Returns:
        Chart data with pagination info
    """
    if not request.table and not request.sql:
        raise HTTPException(
            status_code=400,
            detail="Either 'table' or 'sql' must be provided"
        )
    
    try:
        trino_client = get_trino_client()
        
        # Build query
        if request.sql:
            if request.filters and request.filters.items:
                # Filters only supported when using table-based queries
                raise HTTPException(status_code=400, detail="Filters are only supported when 'table' is used")
            query = request.sql
            if "LIMIT" not in query.upper():
                query += f" LIMIT {request.limit}"
        else:
            # Build aggregated query if dimensions/metrics are provided
            if (request.dimensions or request.xAxis) and (request.metrics or request.yAxis):
                query = build_aggregated_query(
                    tenant=tenant,
                    table=request.table,
                    dimensions=request.dimensions or ([request.xAxis] if request.xAxis else []),
                    metrics=request.metrics,
                    yAxis=request.yAxis,
                    filters=request.filters,
                    limit=request.limit
                )
            else:
                where_clause = build_where_clause(request.filters)
                query = f"SELECT * FROM {tenant}.{request.table}{where_clause} LIMIT {request.limit}"
        
        # Execute query
        data = trino_client.execute_query(query, tenant=tenant)
        
        # Get total count if using table
        total = len(data)
        if request.table and not request.sql:
            count_query = f"SELECT COUNT(*) as count FROM {tenant}.{request.table}{build_where_clause(request.filters)}"
            count_result = trino_client.execute_query(count_query, tenant=tenant)
            total = count_result[0]["count"] if count_result else 0
        
        return ChartDataResponse(
            data=data,
            total=total,
            limit=request.limit,
            offset=request.offset
        )
    
    except TrinoException as e:
        logger.error(f"Trino error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error querying Trino: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chart data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chart data: {str(e)}"
        )


def build_aggregated_query(
    tenant: str,
    table: str,
    dimensions: List[str],
    metrics: Optional[List[Metric]],
    yAxis: Optional[List[str]],
    filters: Optional[FilterGroup],
    limit: int
) -> str:
    """Build SQL query with aggregations based on dimensions and metrics"""
    select_parts = []
    group_by_parts = []
    
    # Add dimensions to SELECT and GROUP BY
    for dim in dimensions:
        safe_dim = sanitize_identifier(dim)
        select_parts.append(safe_dim)
        group_by_parts.append(safe_dim)
    
    # Add metrics to SELECT
    if metrics:
        for metric in metrics:
            safe_col = sanitize_identifier(metric.column)
            agg = metric.aggregation.upper()
            select_parts.append(f"{agg}({safe_col}) as {safe_col}")
    elif yAxis:
        # Fallback: if no metrics but yAxis is provided, use SUM
        for col in yAxis:
            safe_col = sanitize_identifier(col)
            select_parts.append(f"SUM({safe_col}) as {safe_col}")
    
    # Build query
    select_clause = ", ".join(select_parts)
    where_clause = build_where_clause(filters)
    group_clause = f" GROUP BY {', '.join(group_by_parts)}" if group_by_parts else ""
    
    query = f"SELECT {select_clause} FROM {tenant}.{table}{where_clause}{group_clause} LIMIT {limit}"
    logger.info(f"Generated aggregated query: {query}")
    return query


def build_where_clause(filters: Optional[FilterGroup]) -> str:
    if not filters or not filters.items:
        return ""
    logical = filters.logical.upper() if filters.logical else "AND"
    clauses = []
    for item in filters.items:
        clauses.append(render_condition(item))
    if not clauses:
        return ""
    return " WHERE " + f" {logical} ".join(clauses)


def render_condition(item: FilterItem) -> str:
    field = sanitize_identifier(item.field)
    op = item.op
    val = item.value

    if op == "eq":
        return f"{field} = {format_value(val)}"
    if op == "neq":
        return f"{field} <> {format_value(val)}"
    if op == "gt":
        return f"{field} > {format_value(val)}"
    if op == "gte":
        return f"{field} >= {format_value(val)}"
    if op == "lt":
        return f"{field} < {format_value(val)}"
    if op == "lte":
        return f"{field} <= {format_value(val)}"
    if op == "contains":
        pattern = f"%{str(val).lower()}%"
        return f"LOWER({field}) LIKE {format_value(pattern)}"
    if op in ("in", "not_in"):
        values = val if isinstance(val, list) else [val]
        formatted = ",".join(format_value(v) for v in values)
        operator = "IN" if op == "in" else "NOT IN"
        return f"{field} {operator} ({formatted})"
    if op == "between":
        if isinstance(val, list) and len(val) >= 2:
            return f"{field} BETWEEN {format_value(val[0])} AND {format_value(val[1])}"
        # Fallback to equals if malformed
        return f"{field} = {format_value(val)}"
    # Default fallback
    return f"{field} = {format_value(val)}"


def sanitize_identifier(identifier: str) -> str:
    if not identifier or not identifier.replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail=f"Invalid field name: {identifier}")
    if not identifier[0].isalpha() and identifier[0] != "_":
        raise HTTPException(status_code=400, detail=f"Invalid field name: {identifier}")
    return identifier


def format_value(value: Any) -> str:
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    # Fallback to string with escaping
    if value is None:
        return "NULL"
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


@router.post("/data/preview")
async def get_chart_data_preview(
    request: ChartDataRequest,
    tenant: str = Query(..., description="Tenant ID")
) -> ChartDataResponse:
    """
    Get preview data for a chart (limited rows for quick preview)
    
    Args:
        request: Chart data request with table or SQL
        tenant: Tenant ID
    
    Returns:
        Limited chart data for preview
    """
    # Override limit to smaller value for preview
    preview_request = ChartDataRequest(
        table=request.table,
        sql=request.sql,
        limit=100,  # Preview limited to 100 rows
        offset=0
    )
    
    return await get_chart_data(preview_request, tenant)
