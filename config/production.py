"""
Production configuration for the Aether WebSocket System.

"""

from typing import Dict, Any
from pydantic import BaseSettings
import ssl
import logging

class ProductionConfig(BaseSettings):
    """Production configuration settings."""
    
    # WebSocket Settings
    WS_HOST: str = "0.0.0.0"
    WS_PORT: int = 8000
    WS_PATH: str = "/ws"
    
    # Security
    JWT_SECRET: str = ""  # Must be set in environment
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_S: int = 3600
    
    # SSL Configuration
    SSL_CERT_PATH: str = "/etc/ssl/certs/websocket.crt"
    SSL_KEY_PATH: str = "/etc/ssl/private/websocket.key"
    SSL_MIN_VERSION: int = ssl.TLSVersion.TLSv1_2
    
    # Rate Limiting
    RATE_LIMIT_CONNECTIONS: int = 100
    RATE_LIMIT_MESSAGES: int = 50
    RATE_LIMIT_WINDOW_S: int = 60
    
    # Channel Settings
    MAX_CHANNELS: int = 1000
    MAX_CONNECTIONS_PER_CHANNEL: int = 1000
    MESSAGE_BATCH_SIZE: int = 100
    
    # Recovery Settings
    MAX_RECOVERY_ATTEMPTS: int = 3
    RECOVERY_WINDOW_S: int = 300
    MESSAGE_RETENTION_S: int = 3600
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    METRICS_PATH: str = "/metrics"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    LOG_PATH: str = "/var/log/websocket"
    AUDIT_LOG_PATH: str = "/var/log/websocket/audit.log"
    
    # Performance
    WORKER_PROCESSES: int = 4
    WORKER_CONNECTIONS: int = 10000
    KEEPALIVE_TIMEOUT: int = 60
    
    # Cleanup
    CLEANUP_INTERVAL_S: int = 60
    SESSION_TIMEOUT_S: int = 3600
    
    class Config:
        """Pydantic configuration."""
        env_prefix = "AETHER_WS_"
        case_sensitive = True

def get_ssl_context() -> ssl.SSLContext:
    """Create SSL context for production."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ProductionConfig().SSL_MIN_VERSION
    context.load_cert_chain(
        ProductionConfig().SSL_CERT_PATH,
        ProductionConfig().SSL_KEY_PATH
    )
    context.verify_mode = ssl.CERT_REQUIRED
    context.load_verify_locations("/etc/ssl/certs/ca-certificates.crt")
    return context

def setup_logging() -> None:
    """Configure production logging."""
    config = ProductionConfig()
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        filename=f"{config.LOG_PATH}/websocket.log"
    )
    
    # Add JSON handler for structured logging
    if config.LOG_FORMAT == "json":
        import json_logging
        json_logging.init_fastapi()
        json_logging.init_request_instrument()

def get_production_settings() -> Dict[str, Any]:
    """Get all production settings as a dictionary."""
    config = ProductionConfig()
    return {
        "websocket": {
            "host": config.WS_HOST,
            "port": config.WS_PORT,
            "path": config.WS_PATH,
            "ssl": get_ssl_context(),
        },
        "security": {
            "jwt_secret": config.JWT_SECRET,
            "jwt_algorithm": config.JWT_ALGORITHM,
            "jwt_expires_s": config.JWT_EXPIRES_S,
        },
        "rate_limiting": {
            "connections": config.RATE_LIMIT_CONNECTIONS,
            "messages": config.RATE_LIMIT_MESSAGES,
            "window_s": config.RATE_LIMIT_WINDOW_S,
        },
        "channels": {
            "max_channels": config.MAX_CHANNELS,
            "max_connections": config.MAX_CONNECTIONS_PER_CHANNEL,
            "batch_size": config.MESSAGE_BATCH_SIZE,
        },
        "recovery": {
            "max_attempts": config.MAX_RECOVERY_ATTEMPTS,
            "window_s": config.RECOVERY_WINDOW_S,
            "message_retention_s": config.MESSAGE_RETENTION_S,
        },
        "monitoring": {
            "enabled": config.ENABLE_METRICS,
            "port": config.METRICS_PORT,
            "path": config.METRICS_PATH,
        },
        "performance": {
            "workers": config.WORKER_PROCESSES,
            "connections": config.WORKER_CONNECTIONS,
            "keepalive": config.KEEPALIVE_TIMEOUT,
        },
        "cleanup": {
            "interval_s": config.CLEANUP_INTERVAL_S,
            "session_timeout_s": config.SESSION_TIMEOUT_S,
        }
    } 