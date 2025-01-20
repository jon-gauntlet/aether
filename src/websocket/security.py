from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
import json
import re
from dataclasses import dataclass
import html

@dataclass
class SecurityConfig:
    """Security configuration for the WebSocket system"""
    max_message_size: int = 1024 * 1024  # 1MB
    allowed_message_types: set = None
    allowed_html_tags: set = None
    audit_log_path: str = "logs/audit.log"
    input_validation_rules: Dict[str, Dict] = None

class Validator:
    """Validates incoming messages and data"""
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)

    def validate_message(self, message: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate a message against security rules"""
        # Check message size
        message_size = len(json.dumps(message))
        if message_size > self.config.max_message_size:
            return False, "Message exceeds maximum size"

        # Check message type
        if self.config.allowed_message_types and message.get("type") not in self.config.allowed_message_types:
            return False, "Invalid message type"

        # Apply validation rules
        if self.config.input_validation_rules:
            rule = self.config.input_validation_rules.get(message.get("type"))
            if rule:
                try:
                    self._validate_against_rule(message, rule)
                except ValueError as e:
                    return False, str(e)

        return True, None

    def _validate_against_rule(self, data: Dict[str, Any], rule: Dict):
        """Validate data against a specific rule"""
        for field, constraints in rule.items():
            value = data.get(field)

            # Required field check
            if constraints.get("required", False) and value is None:
                raise ValueError(f"Missing required field: {field}")

            # Type check
            expected_type = constraints.get("type")
            if expected_type and value is not None:
                if not isinstance(value, eval(expected_type)):
                    raise ValueError(f"Invalid type for field {field}")

            # Pattern check
            pattern = constraints.get("pattern")
            if pattern and value is not None:
                if not re.match(pattern, str(value)):
                    raise ValueError(f"Invalid format for field {field}")

            # Range check
            min_val = constraints.get("min")
            max_val = constraints.get("max")
            if value is not None:
                if min_val is not None and value < min_val:
                    raise ValueError(f"Value too small for field {field}")
                if max_val is not None and value > max_val:
                    raise ValueError(f"Value too large for field {field}")

class Sanitizer:
    """Sanitizes output data"""
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)

    def sanitize_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize a message for output"""
        sanitized = {}
        for key, value in message.items():
            if isinstance(value, str):
                sanitized[key] = self._sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_message(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self.sanitize_message(item) if isinstance(item, dict)
                    else self._sanitize_string(item) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized

    def _sanitize_string(self, value: str) -> str:
        """Sanitize a string value"""
        # First escape all HTML
        escaped = html.escape(value)

        # If allowed HTML tags are specified, selectively unescape them
        if self.config.allowed_html_tags:
            for tag in self.config.allowed_html_tags:
                escaped = escaped.replace(f"&lt;{tag}&gt;", f"<{tag}>")
                escaped = escaped.replace(f"&lt;/{tag}&gt;", f"</{tag}>")

        return escaped

class AuditLogger:
    """Logs security-related events"""
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = logging.getLogger("audit")
        self._setup_logger()

    def _setup_logger(self):
        """Set up the audit logger"""
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler = logging.FileHandler(self.config.audit_log_path)
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_auth_attempt(self, user_id: str, success: bool, details: str):
        """Log an authentication attempt"""
        self.logger.info({
            "event": "auth_attempt",
            "user_id": user_id,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def log_message_validation(self, message_type: str, success: bool, details: str):
        """Log a message validation event"""
        self.logger.info({
            "event": "message_validation",
            "type": message_type,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def log_permission_check(self, user_id: str, permission: str, granted: bool):
        """Log a permission check"""
        self.logger.info({
            "event": "permission_check",
            "user_id": user_id,
            "permission": permission,
            "granted": granted,
            "timestamp": datetime.now().isoformat()
        })

    def log_rate_limit(self, user_id: str, limit_type: str, current: int, max_allowed: int):
        """Log a rate limit event"""
        self.logger.info({
            "event": "rate_limit",
            "user_id": user_id,
            "limit_type": limit_type,
            "current": current,
            "max_allowed": max_allowed,
            "timestamp": datetime.now().isoformat()
        })

    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log a general security event"""
        self.logger.info({
            "event": event_type,
            **details,
            "timestamp": datetime.now().isoformat()
        }) 