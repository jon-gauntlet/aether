import json
import logging
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import gzip
import os
import psutil

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LogManager:
    def __init__(self):
        self.config_dir = Path("config")
        self.log_dir = Path("logs")
        self.load_config()
        self._setup_directories()

    def load_config(self):
        """Load log management configuration"""
        with open(self.config_dir / "log_config.json") as f:
            self.config = json.load(f)
        logger.info("Loaded log configuration")

    def _setup_directories(self):
        """Create necessary log directories"""
        for log_path in self.config["paths"].values():
            Path(log_path).mkdir(parents=True, exist_ok=True)
        logger.info("Created log directories")

    def rotate_logs(self):
        """Rotate logs based on configuration"""
        try:
            rotation_config = self.config["rotation"]
            max_size = rotation_config["max_size_mb"] * 1024 * 1024  # Convert to bytes
            
            for log_type, log_path in self.config["paths"].items():
                log_dir = Path(log_path)
                if not log_dir.exists():
                    continue

                for log_file in log_dir.glob("*.log"):
                    if log_file.stat().st_size > max_size:
                        # Create rotation timestamp
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        rotated_name = f"{log_file.stem}_{timestamp}{log_file.suffix}"
                        rotated_path = log_file.parent / rotated_name

                        # Rotate the log file
                        shutil.move(str(log_file), str(rotated_path))
                        
                        # Compress if configured
                        if rotation_config["compress_backups"]:
                            self._compress_log(rotated_path)
                            # Remove original after successful compression
                            rotated_path.unlink()

                        logger.info(f"Rotated log file: {log_file} -> {rotated_path}")

                # Clean up old rotated logs
                self._cleanup_old_logs(log_dir, rotation_config["backup_count"])

        except Exception as e:
            logger.error(f"Log rotation failed: {str(e)}")
            raise

    def archive_logs(self):
        """Archive old logs based on configuration"""
        try:
            if not self.config["archival"]["enabled"]:
                return

            archive_path = Path(self.config["archival"]["archive_location"])
            archive_path.mkdir(parents=True, exist_ok=True)

            for log_type, log_path in self.config["paths"].items():
                retention_days = self.config["retention"][f"{log_type}_days"]
                cutoff_date = datetime.now() - timedelta(days=retention_days)
                
                log_dir = Path(log_path)
                if not log_dir.exists():
                    continue

                # Create archive directory for this log type
                type_archive = archive_path / log_type
                type_archive.mkdir(exist_ok=True)

                # Find and archive old logs
                for log_file in log_dir.glob("*.log*"):
                    # Check file modification time
                    mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
                    if mtime < cutoff_date:
                        # Create archive name with timestamp
                        archive_name = f"{log_file.stem}_{mtime.strftime('%Y%m%d')}.gz"
                        archive_file = type_archive / archive_name

                        # Compress and move to archive
                        self._compress_log(log_file, archive_file)
                        
                        # Remove original after successful archival
                        log_file.unlink()
                        
                        logger.info(f"Archived log file: {log_file} -> {archive_file}")

        except Exception as e:
            logger.error(f"Log archival failed: {str(e)}")
            raise

    def check_disk_usage(self):
        """Check disk usage and alert if threshold exceeded"""
        try:
            threshold = self.config["monitoring"]["disk_usage_threshold_percent"]
            
            # Check each log directory
            for log_path in self.config["paths"].values():
                path = Path(log_path)
                if not path.exists():
                    continue

                # Get disk usage for the partition
                usage = psutil.disk_usage(str(path))
                usage_percent = usage.percent

                if usage_percent >= threshold:
                    alert_message = {
                        "path": str(path),
                        "usage_percent": usage_percent,
                        "threshold": threshold,
                        "free_space": usage.free,
                        "total_space": usage.total
                    }
                    self._send_alert("disk_space_low", alert_message)
                    logger.warning(f"Disk usage alert for {path}: {usage_percent}% used")

        except Exception as e:
            logger.error(f"Disk usage check failed: {str(e)}")
            raise

    def _compress_log(self, source_path: Path, dest_path: Path = None):
        """Compress a log file using gzip"""
        if dest_path is None:
            dest_path = source_path.with_suffix(source_path.suffix + '.gz')

        with open(source_path, 'rb') as f_in:
            with gzip.open(dest_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        return dest_path

    def _cleanup_old_logs(self, log_dir: Path, keep_count: int):
        """Remove old rotated logs keeping only the specified number"""
        # Get list of rotated logs sorted by modification time
        rotated_logs = []
        for ext in ['.log.*', '.log.*.gz']:
            rotated_logs.extend(log_dir.glob(ext))
        
        rotated_logs.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # Remove logs beyond the keep count
        if len(rotated_logs) > keep_count:
            for log_file in rotated_logs[keep_count:]:
                log_file.unlink()
                logger.info(f"Removed old log file: {log_file}")

    def _send_alert(self, alert_type: str, details: any):
        """Send alert based on configuration"""
        try:
            # Load alerts configuration
            with open(self.config_dir / "monitoring/alerts.yml") as f:
                alerts_config = yaml.safe_load(f)

            if "disk_space_low" in alerts_config["backup_alerts"]:
                alert_config = alerts_config["backup_alerts"]["disk_space_low"]
                
                # Log alert
                logger.error(f"Log management alert - {alert_type}: {details}")

        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")

def main():
    manager = LogManager()
    
    # Perform log management tasks
    manager.rotate_logs()
    manager.archive_logs()
    manager.check_disk_usage()
    
    logger.info("✅ Log management tasks completed successfully!")

if __name__ == "__main__":
    main() 