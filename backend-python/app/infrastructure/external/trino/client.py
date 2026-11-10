"""Trino database client"""

import logging
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import trino
    from trino.auth import BasicAuthentication
    from trino.dbapi import connect
except ImportError:
    trino = None
    BasicAuthentication = None
    connect = None

from app.config import get_settings
from app.exceptions import TrinoException

logger = logging.getLogger(__name__)


class TrinoClient:
    """Client for executing queries in Trino as the tenant's own Trino user"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connections = {}
            cls._instance._lock = threading.Lock()
        return cls._instance
    
    def __init__(self):
        if not connect:
            raise TrinoException(
                message="Trino library not installed. Install with: pip install trino",
                query=None
            )
    
    @staticmethod
    def _tenant_user(tenant: str) -> str:
        settings = get_settings()
        if tenant not in settings.VALID_TENANTS:
            raise TrinoException(message=f"Invalid tenant: {tenant}", query=None)
        return f"{settings.TRINO_TENANT_USER_PREFIX}{tenant}"
    
    @staticmethod
    def _read_password(user: str) -> str:
        settings = get_settings()
        password_file = Path(settings.TRINO_PASSWORDS_DIR) / user
        try:
            password = password_file.read_text(encoding="utf-8").strip()
        except OSError as e:
            raise TrinoException(
                message=f"Trino credentials not found for user {user}: {e.strerror}",
                query=None
            )
        if not password:
            raise TrinoException(message=f"Empty Trino password for user {user}", query=None)
        return password
    
    def _get_connection(self, tenant: str):
        """Get (or open) the connection authenticated as the tenant's Trino user"""
        user = self._tenant_user(tenant)
        with self._lock:
            connection = self._connections.get(user)
            if connection is not None:
                return connection
            
            settings = get_settings()
            try:
                connection = connect(
                    host=settings.TRINO_HOST,
                    port=settings.TRINO_PORT,
                    user=user,
                    auth=BasicAuthentication(user, self._read_password(user)),
                    catalog=settings.TRINO_CATALOG,
                    http_scheme=settings.TRINO_HTTP_SCHEME,
                    verify=settings.TRINO_CA_CERT_PATH or True,
                )
            except TrinoException:
                raise
            except Exception as e:
                logger.error(f"Failed to connect to Trino as {user}: {e}")
                raise TrinoException(
                    message=f"Failed to connect to Trino: {str(e)}",
                    query=None
                )
            self._connections[user] = connection
            logger.info(f"Connected to Trino at {settings.TRINO_HOST}:{settings.TRINO_PORT} as {user}")
            return connection
    
    def execute_query(
        self, query: str, tenant: str, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a query in Trino as the tenant's Trino user and return results
        
        Args:
            query: SQL query to execute
            tenant: Tenant whose Trino user runs the query
            params: Query parameters (not used in basic implementation)
        
        Returns:
            List of dictionaries representing rows
        """
        connection = self._get_connection(tenant)
        
        try:
            cursor = connection.cursor()
            cursor.execute(query)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Fetch all results
            rows = cursor.fetchall()
            
            # Convert rows to list of dictionaries
            results = []
            for row in rows:
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            return results
        
        except Exception as e:
            logger.error(f"Error executing query: {e}\nQuery: {query}")
            raise TrinoException(
                message=f"Error executing query: {str(e)}",
                query=query
            )
    
    def get_tables(self, schema: str) -> List[str]:
        """
        Get list of tables in a tenant schema
        
        Args:
            schema: Tenant schema name (queried as that tenant's Trino user)
        
        Returns:
            List of table names
        """
        try:
            # Use SHOW TABLES instead of information_schema for better compatibility
            query = f"SHOW TABLES FROM {schema}"
            results = self.execute_query(query, tenant=schema)
            return [row.get("Table") or row.get("table") for row in results]
        except Exception as e:
            logger.error(f"Error getting tables from schema {schema}: {e}")
            return []
    
    def get_table_schema(self, table: str, schema: str) -> List[Dict[str, str]]:
        """
        Get schema (columns) of a table
        
        Args:
            table: Table name
            schema: Tenant schema name (queried as that tenant's Trino user)
        
        Returns:
            List of dictionaries with column information
        """
        try:
            query = f"DESCRIBE {schema}.{table}"
            results = self.execute_query(query, tenant=schema)
            
            # DESCRIBE returns columns with: Name, Type, Extra, Comment
            # Normalize to match our expected format
            columns = []
            for row in results:
                column_name = (
                    row.get("Column")
                    or row.get("column")
                    or row.get("Column Name")
                    or row.get("column_name")
                    or row.get("Name")
                    or row.get("name")
                )
                if not column_name:
                    # Skip rows without a column name to avoid showing types as labels
                    continue
                columns.append({
                    "column_name": column_name,
                    "data_type": row.get("Type") or row.get("type"),
                    "is_nullable": "YES",  # Default, DESCRIBE doesn't show this clearly
                    "column_default": row.get("Comment") or row.get("comment")
                })
            return columns
        except Exception as e:
            logger.error(f"Error getting table schema: {e}")
            return []
    
    def close(self):
        """Close all tenant connections"""
        with self._lock:
            for user, connection in list(self._connections.items()):
                try:
                    connection.close()
                    logger.info(f"Closed Trino connection for {user}")
                except Exception as e:
                    logger.error(f"Error closing connection for {user}: {e}")
            self._connections.clear()


# Singleton instance
_trino_client = None


def get_trino_client() -> TrinoClient:
    """Get or create Trino client singleton"""
    global _trino_client
    if _trino_client is None:
        _trino_client = TrinoClient()
    return _trino_client
