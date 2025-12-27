"""Trino database client"""

import logging
from typing import Any, Dict, List, Optional

try:
    import trino
    from trino.dbapi import connect
except ImportError:
    trino = None
    connect = None

from app.config import get_settings
from app.exceptions import TrinoException

logger = logging.getLogger(__name__)


class TrinoClient:
    """Client for executing queries in Trino"""
    
    _instance = None
    _connection = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._connection is None:
            self._initialize_connection()
    
    def _initialize_connection(self):
        """Initialize Trino connection"""
        if not connect:
            raise TrinoException(
                message="Trino library not installed. Install with: pip install trino",
                query=None
            )
        
        settings = get_settings()
        
        try:
            self._connection = connect(
                host=settings.TRINO_HOST,
                port=settings.TRINO_PORT,
                user="root",
                catalog=settings.TRINO_CATALOG,
                http_scheme="http",
                verify=False,
            )
            logger.info(f"Connected to Trino at {settings.TRINO_HOST}:{settings.TRINO_PORT}")
        except Exception as e:
            logger.error(f"Failed to connect to Trino: {e}")
            self._connection = None
            raise TrinoException(
                message=f"Failed to connect to Trino: {str(e)}",
                query=None
            )
    
    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Execute a query in Trino and return results
        
        Args:
            query: SQL query to execute
            params: Query parameters (not used in basic implementation)
        
        Returns:
            List of dictionaries representing rows
        """
        if not self._connection:
            self._initialize_connection()
        
        try:
            cursor = self._connection.cursor()
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
    
    def get_tables(self, schema: str = "default") -> List[str]:
        """
        Get list of tables in a schema
        
        Args:
            schema: Schema name (default: "default")
        
        Returns:
            List of table names
        """
        try:
            # Use SHOW TABLES instead of information_schema for better compatibility
            query = f"SHOW TABLES FROM {schema}"
            results = self.execute_query(query)
            return [row.get("Table") or row.get("table") for row in results]
        except Exception as e:
            logger.error(f"Error getting tables from schema {schema}: {e}")
            return []
    
    def get_table_schema(self, table: str, schema: str = "default") -> List[Dict[str, str]]:
        """
        Get schema (columns) of a table
        
        Args:
            table: Table name
            schema: Schema name (default: "default")
        
        Returns:
            List of dictionaries with column information
        """
        try:
            query = f"DESCRIBE {schema}.{table}"
            results = self.execute_query(query)
            
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
        """Close the connection"""
        if self._connection:
            try:
                self._connection.close()
                self._connection = None
                logger.info("Closed Trino connection")
            except Exception as e:
                logger.error(f"Error closing connection: {e}")


# Singleton instance
_trino_client = None


def get_trino_client() -> TrinoClient:
    """Get or create Trino client singleton"""
    global _trino_client
    if _trino_client is None:
        _trino_client = TrinoClient()
    return _trino_client
