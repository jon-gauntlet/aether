import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
import yaml

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MaintenanceConfig:
    def __init__(self):
        self.config_dir = Path("config")
        self.backup_dir = Path("backups")
        self.log_dir = Path("logs")
        self._setup_directories()

    def _setup_directories(self):
        """Create necessary directories"""
        for directory in [self.config_dir, self.backup_dir, self.log_dir]:
            directory.mkdir(exist_ok=True)
            logger.info(f"Created directory: {directory}")

    def generate_backup_config(self):
        """Generate backup configuration"""
        backup_config = {
            "schedule": {
                "full_backup": {
                    "frequency": "daily",
                    "time": "01:00",
                    "retention_days": 30,
                    "verify_after_backup": True
                },
                "incremental_backup": {
                    "frequency": "hourly",
                    "retention_days": 7,
                    "verify_after_backup": True
                }
            },
            "paths": {
                "backup_root": str(self.backup_dir),
                "include": [
                    "src/",
                    "config/",
                    "data/",
                    "test_data/"
                ],
                "exclude": [
                    "*.pyc",
                    "__pycache__",
                    "*.log",
                    "*.tmp"
                ]
            },
            "verification": {
                "checksum_algorithm": "sha256",
                "verify_on_restore": True,
                "test_restore_monthly": True,
                "integrity_check_schedule": "daily"
            },
            "notifications": {
                "email": {
                    "success": ["admin@example.com"],
                    "failure": ["admin@example.com", "oncall@example.com"]
                },
                "slack": {
                    "webhook_url": "SLACK_WEBHOOK_URL",
                    "channel": "#system-backups"
                }
            },
            "performance": {
                "compression_level": 6,
                "max_concurrent_backups": 3,
                "bandwidth_limit_mbps": 100,
                "timeout_minutes": 120
            }
        }

        with open(self.config_dir / "backup_config.json", "w") as f:
            json.dump(backup_config, f, indent=2)
        logger.info("Generated backup configuration")

    def generate_log_config(self):
        """Generate log management configuration"""
        log_config = {
            "rotation": {
                "max_size_mb": 100,
                "backup_count": 10,
                "compress_backups": True
            },
            "retention": {
                "system_logs_days": 90,
                "access_logs_days": 365,
                "error_logs_days": 365,
                "debug_logs_days": 30
            },
            "paths": {
                "system_logs": str(self.log_dir / "system"),
                "access_logs": str(self.log_dir / "access"),
                "error_logs": str(self.log_dir / "error"),
                "debug_logs": str(self.log_dir / "debug")
            },
            "monitoring": {
                "disk_usage_threshold_percent": 80,
                "alert_on_threshold": True,
                "check_interval_minutes": 30
            },
            "archival": {
                "enabled": True,
                "archive_after_days": 30,
                "archive_location": str(self.backup_dir / "log_archives"),
                "compression_format": "gz"
            }
        }

        with open(self.config_dir / "log_config.json", "w") as f:
            json.dump(log_config, f, indent=2)
        logger.info("Generated log management configuration")

    def generate_security_config(self):
        """Generate security scanning configuration"""
        security_config = {
            "vulnerability_scan": {
                "schedule": "daily",
                "time": "02:00",
                "scan_types": ["dependency", "code", "container"],
                "severity_thresholds": {
                    "critical": 0,
                    "high": 2,
                    "medium": 5,
                    "low": 10
                }
            },
            "audit_logging": {
                "enabled": True,
                "events": [
                    "authentication",
                    "authorization",
                    "file_access",
                    "configuration_change",
                    "backup_operations"
                ],
                "retention_days": 365
            },
            "access_monitoring": {
                "track_failed_attempts": True,
                "max_failed_attempts": 5,
                "lockout_duration_minutes": 30,
                "notify_on_lockout": True
            },
            "metrics": {
                "collection_interval": "5m",
                "retention_period": "90d",
                "alert_thresholds": {
                    "failed_logins_per_hour": 10,
                    "unauthorized_access_attempts": 20,
                    "suspicious_ip_activity": 5
                }
            }
        }

        with open(self.config_dir / "security_config.json", "w") as f:
            json.dump(security_config, f, indent=2)
        logger.info("Generated security configuration")

    def generate_monitoring_alerts(self):
        """Generate monitoring alerts configuration"""
        alerts_config = {
            "backup_alerts": {
                "failed_backup": {
                    "severity": "critical",
                    "notification_channels": ["email", "slack"],
                    "retry_count": 3
                },
                "verification_failed": {
                    "severity": "critical",
                    "notification_channels": ["email", "slack"],
                    "immediate_action": "pause_backups"
                },
                "disk_space_low": {
                    "severity": "warning",
                    "threshold_percent": 80,
                    "notification_channels": ["email"]
                }
            },
            "security_alerts": {
                "vulnerability_found": {
                    "severity": "high",
                    "notification_channels": ["email", "slack"],
                    "include_details": True
                },
                "unauthorized_access": {
                    "severity": "critical",
                    "notification_channels": ["email", "slack", "pager"],
                    "immediate_action": "block_ip"
                }
            },
            "system_alerts": {
                "high_cpu_usage": {
                    "severity": "warning",
                    "threshold_percent": 90,
                    "duration_minutes": 5
                },
                "high_memory_usage": {
                    "severity": "warning",
                    "threshold_percent": 85,
                    "duration_minutes": 5
                },
                "service_down": {
                    "severity": "critical",
                    "notification_channels": ["email", "slack", "pager"],
                    "check_interval_seconds": 30
                }
            }
        }

        with open(self.config_dir / "monitoring/alerts.yml", "w") as f:
            yaml.dump(alerts_config, f, default_flow_style=False)
        logger.info("Generated monitoring alerts configuration")

def main():
    config = MaintenanceConfig()
    
    # Generate all configurations
    config.generate_backup_config()
    config.generate_log_config()
    config.generate_security_config()
    config.generate_monitoring_alerts()
    
    logger.info("✅ Maintenance configuration generation complete!")

if __name__ == "__main__":
    main() 