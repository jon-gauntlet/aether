"""Logging configuration for RAG system."""
import logging
import logging.handlers
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import os
import sys

def setup_logging(
    log_level: str = "INFO",
    log_dir: Optional[Path] = None,
    service_name: str = "rag_aether"
) -> None:
    """Configure structured logging for the RAG system."""
    if log_dir is None:
        log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Create formatters
    json_formatter = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
        '"service": "' + service_name + '", '
        '"component": "%(name)s", "operation": "%(funcName)s", '
        '"message": %(message)s}'
    )
    
    console_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Console handler (human-readable)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handlers (JSON format)
    handlers = {
        "error": logging.handlers.RotatingFileHandler(
            log_dir / "error.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        ),
        "info": logging.handlers.RotatingFileHandler(
            log_dir / "info.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        ),
        "debug": logging.handlers.RotatingFileHandler(
            log_dir / "debug.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
    }
    
    # Set levels and formatters
    handlers["error"].setLevel(logging.ERROR)
    handlers["info"].setLevel(logging.INFO)
    handlers["debug"].setLevel(logging.DEBUG)
    
    for handler in handlers.values():
        handler.setFormatter(json_formatter)
        root_logger.addHandler(handler)

class StructuredLogger:
    """Logger that adds structured context to log messages."""
    
    def __init__(self, name: str, context: Optional[Dict[str, Any]] = None):
        self.logger = logging.getLogger(name)
        self.context = context or {}
    
    def _format_message(self, message: str, extra: Optional[Dict[str, Any]] = None) -> str:
        """Format message with context as JSON."""
        data = {
            "message": message,
            **self.context
        }
        if extra:
            data.update(extra)
        return json.dumps(data)
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message with context."""
        self.logger.debug(self._format_message(message, extra))
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log info message with context."""
        self.logger.info(self._format_message(message, extra))
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log warning message with context."""
        self.logger.warning(self._format_message(message, extra))
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log error message with context."""
        self.logger.error(self._format_message(message, extra))
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log critical message with context."""
        self.logger.critical(self._format_message(message, extra))
    
    def with_context(self, **kwargs) -> 'StructuredLogger':
        """Create a new logger with additional context."""
        new_context = {**self.context, **kwargs}
        return StructuredLogger(self.logger.name, new_context)

def get_logger(name: str, context: Optional[Dict[str, Any]] = None) -> StructuredLogger:
    """Get a structured logger with context."""
    return StructuredLogger(name, context) 