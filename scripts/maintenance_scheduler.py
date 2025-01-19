import schedule
import time
import logging
import subprocess
from pathlib import Path
from datetime import datetime
import json
import yaml

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MaintenanceScheduler:
    def __init__(self):
        self.config_dir = Path("config")
        self.scripts_dir = Path("scripts")
        self.load_configs()
        self._setup_logging()

    def load_configs(self):
        """Load all configuration files"""
        # Load backup config
        with open(self.config_dir / "backup_config.json") as f:
            self.backup_config = json.load(f)

        # Load log config
        with open(self.config_dir / "log_config.json") as f:
            self.log_config = json.load(f)

        # Load security config
        with open(self.config_dir / "security_config.json") as f:
            self.security_config = json.load(f)

        logger.info("Loaded all configuration files")

    def _setup_logging(self):
        """Setup logging for the scheduler"""
        log_dir = Path("logs/scheduler")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Add file handler for scheduler logs
        file_handler = logging.FileHandler(log_dir / "scheduler.log")
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(file_handler)

    def run_backup(self):
        """Run backup operations"""
        try:
            logger.info("Starting backup operations")
            result = subprocess.run(
                ["python", str(self.scripts_dir / "backup_manager.py")],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Backup completed: {result.stdout}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Backup failed: {e.stderr}")
            self._send_alert("failed_backup", str(e.stderr))

    def run_log_management(self):
        """Run log management tasks"""
        try:
            logger.info("Starting log management tasks")
            result = subprocess.run(
                ["python", str(self.scripts_dir / "log_manager.py")],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Log management completed: {result.stdout}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Log management failed: {e.stderr}")
            self._send_alert("log_management_failed", str(e.stderr))

    def run_security_scan(self):
        """Run security scanning tasks"""
        try:
            logger.info("Starting security scan")
            # Run dependency vulnerability scan
            self._run_dependency_scan()
            
            # Run code security scan
            self._run_code_scan()
            
            # Run container security scan if applicable
            self._run_container_scan()
            
            logger.info("Security scan completed")
        except Exception as e:
            logger.error(f"Security scan failed: {str(e)}")
            self._send_alert("security_scan_failed", str(e))

    def _run_dependency_scan(self):
        """Run dependency vulnerability scan"""
        try:
            # Run safety check for Python dependencies
            result = subprocess.run(
                ["safety", "check"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                self._send_alert("vulnerability_found", result.stdout)
        except Exception as e:
            logger.error(f"Dependency scan failed: {str(e)}")
            raise

    def _run_code_scan(self):
        """Run code security scan"""
        try:
            # Run bandit for Python code security
            result = subprocess.run(
                ["bandit", "-r", "src/"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                self._send_alert("vulnerability_found", result.stdout)
        except Exception as e:
            logger.error(f"Code scan failed: {str(e)}")
            raise

    def _run_container_scan(self):
        """Run container security scan if Docker is present"""
        try:
            # Check if Docker is available
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                # Run Trivy container scan
                result = subprocess.run(
                    ["trivy", "image", "your-image-name"],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    self._send_alert("vulnerability_found", result.stdout)
        except Exception as e:
            logger.error(f"Container scan failed: {str(e)}")
            raise

    def _send_alert(self, alert_type: str, details: any):
        """Send alert based on configuration"""
        try:
            # Load alerts configuration
            with open(self.config_dir / "monitoring/alerts.yml") as f:
                alerts_config = yaml.safe_load(f)

            if alert_type in alerts_config["system_alerts"]:
                alert_config = alerts_config["system_alerts"][alert_type]
                
                # Log alert
                logger.error(f"System alert - {alert_type}: {details}")

        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")

    def schedule_tasks(self):
        """Schedule all maintenance tasks"""
        # Schedule full backups
        schedule.every().day.at(self.backup_config["schedule"]["full_backup"]["time"]).do(
            self.run_backup
        )

        # Schedule incremental backups
        if self.backup_config["schedule"]["incremental_backup"]["frequency"] == "hourly":
            schedule.every().hour.do(
                lambda: self.run_backup(backup_type="incremental")
            )

        # Schedule log management
        schedule.every().hour.do(self.run_log_management)

        # Schedule security scans
        schedule.every().day.at(self.security_config["vulnerability_scan"]["time"]).do(
            self.run_security_scan
        )

        logger.info("Scheduled all maintenance tasks")

    def run(self):
        """Run the scheduler"""
        self.schedule_tasks()
        
        logger.info("Starting maintenance scheduler")
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Scheduler error: {str(e)}")
                self._send_alert("scheduler_error", str(e))
                time.sleep(300)  # Wait 5 minutes before retrying

def main():
    scheduler = MaintenanceScheduler()
    scheduler.run()

if __name__ == "__main__":
    main() 