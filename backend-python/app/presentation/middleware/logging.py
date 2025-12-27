"""Logging middleware for structured request/response logging"""

import logging
import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured logging of HTTP requests and responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request and response"""
        start_time = time.time()
        
        # Log request
        logger.info(
            "HTTP request started",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query),
                "client_host": request.client.host if request.client else None,
            }
        )
        
        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"HTTP request failed: {type(e).__name__}",
                exc_info=True,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "process_time": process_time,
                }
            )
            raise
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            "HTTP request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time": process_time,
            }
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
