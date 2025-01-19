#!/usr/bin/env python3
import subprocess
import logging
import shutil
from pathlib import Path
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ServiceInstaller:
    def __init__(self):
        self.service_name = "aether-maintenance"
        self.workspace_dir = Path("/home/jon/git/aether-workspaces/backend")
        self.systemd_dir = Path("/etc/systemd/system")
        self.service_file = self.workspace_dir / "config/systemd" / f"{self.service_name}.service"

    def check_prerequisites(self):
        """Check if all prerequisites are met"""
        # Check if running as root
        if os.geteuid() != 0:
            raise PermissionError("This script must be run as root")

        # Check if systemd is available
        if not Path("/run/systemd/system").exists():
            raise RuntimeError("Systemd is not available on this system")

        # Check if service file exists
        if not self.service_file.exists():
            raise FileNotFoundError(f"Service file not found: {self.service_file}")

        # Check if Python is available
        try:
            subprocess.run(["python3", "--version"], check=True, capture_output=True)
        except subprocess.CalledProcessError:
            raise RuntimeError("Python 3 is not available")

        logger.info("All prerequisites met")

    def install_service(self):
        """Install the systemd service"""
        try:
            # Copy service file to systemd directory
            dest_path = self.systemd_dir / self.service_file.name
            shutil.copy2(self.service_file, dest_path)
            logger.info(f"Copied service file to {dest_path}")

            # Set correct permissions
            dest_path.chmod(0o644)
            logger.info("Set service file permissions")

            # Reload systemd daemon
            subprocess.run(["systemctl", "daemon-reload"], check=True)
            logger.info("Reloaded systemd daemon")

            # Enable and start service
            subprocess.run(["systemctl", "enable", self.service_name], check=True)
            logger.info("Enabled service")
            
            subprocess.run(["systemctl", "start", self.service_name], check=True)
            logger.info("Started service")

            # Check service status
            self.check_service_status()

        except Exception as e:
            logger.error(f"Failed to install service: {str(e)}")
            self.cleanup()
            raise

    def check_service_status(self):
        """Check the status of the service"""
        try:
            result = subprocess.run(
                ["systemctl", "status", self.service_name],
                capture_output=True,
                text=True
            )
            logger.info(f"Service status:\n{result.stdout}")
            
            # Check if service is active
            result = subprocess.run(
                ["systemctl", "is-active", self.service_name],
                capture_output=True,
                text=True
            )
            if result.stdout.strip() != "active":
                raise RuntimeError("Service is not active")
            
            logger.info("Service is running correctly")

        except subprocess.CalledProcessError as e:
            logger.error(f"Service status check failed: {e.stderr}")
            raise

    def cleanup(self):
        """Cleanup in case of failure"""
        try:
            # Stop service if running
            subprocess.run(["systemctl", "stop", self.service_name], 
                         check=False, capture_output=True)
            
            # Disable service
            subprocess.run(["systemctl", "disable", self.service_name], 
                         check=False, capture_output=True)
            
            # Remove service file
            service_path = self.systemd_dir / f"{self.service_name}.service"
            if service_path.exists():
                service_path.unlink()
            
            # Reload daemon
            subprocess.run(["systemctl", "daemon-reload"], 
                         check=False, capture_output=True)
            
            logger.info("Cleanup completed")

        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")

    def create_log_directories(self):
        """Create necessary log directories"""
        try:
            log_dirs = [
                self.workspace_dir / "logs/system",
                self.workspace_dir / "logs/error"
            ]
            
            for log_dir in log_dirs:
                log_dir.mkdir(parents=True, exist_ok=True)
                # Set appropriate permissions
                log_dir.chmod(0o755)
                # Set ownership to service user
                shutil.chown(log_dir, user="jon", group="jon")
                
            logger.info("Created log directories")

        except Exception as e:
            logger.error(f"Failed to create log directories: {str(e)}")
            raise

def main():
    installer = ServiceInstaller()
    
    try:
        # Check prerequisites
        installer.check_prerequisites()
        
        # Create log directories
        installer.create_log_directories()
        
        # Install service
        installer.install_service()
        
        logger.info("✅ Service installation completed successfully!")
        
    except Exception as e:
        logger.error(f"Service installation failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 