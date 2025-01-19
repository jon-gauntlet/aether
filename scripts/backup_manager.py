import json
import logging
import shutil
import hashlib
from pathlib import Path
from datetime import datetime
import subprocess
import yaml

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackupManager:
    def __init__(self):
        self.config_dir = Path("config")
        self.backup_dir = Path("backups")
        self.load_config()

    def load_config(self):
        """Load backup configuration"""
        with open(self.config_dir / "backup_config.json") as f:
            self.config = json.load(f)
        logger.info("Loaded backup configuration")

    def create_backup(self, backup_type="full"):
        """Create a backup of the specified type"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = Path(self.config["paths"]["backup_root"]) / f"{backup_type}_{timestamp}"
        backup_path.mkdir(parents=True, exist_ok=True)

        try:
            # Create backup manifest
            manifest = {
                "backup_type": backup_type,
                "timestamp": timestamp,
                "files": [],
                "checksums": {},
                "metadata": {
                    "version": "1.0",
                    "created_by": "backup_manager",
                    "compression_level": self.config["performance"]["compression_level"]
                }
            }

            # Process each included path
            for include_path in self.config["paths"]["include"]:
                src_path = Path(include_path)
                if src_path.exists():
                    # Create relative backup path
                    dest_path = backup_path / src_path.name
                    
                    # Copy files
                    if src_path.is_file():
                        shutil.copy2(src_path, dest_path)
                        checksum = self._calculate_checksum(src_path)
                        manifest["files"].append(str(src_path))
                        manifest["checksums"][str(src_path)] = checksum
                    else:
                        shutil.copytree(src_path, dest_path, dirs_exist_ok=True)
                        # Calculate checksums for all files in directory
                        for file_path in src_path.rglob("*"):
                            if file_path.is_file():
                                checksum = self._calculate_checksum(file_path)
                                manifest["files"].append(str(file_path))
                                manifest["checksums"][str(file_path)] = checksum

            # Save manifest
            with open(backup_path / "manifest.json", "w") as f:
                json.dump(manifest, f, indent=2)

            logger.info(f"Created {backup_type} backup at {backup_path}")
            
            # Verify backup if configured
            if self.config["verification"]["verify_after_backup"]:
                self.verify_backup(backup_path)
                
            return backup_path

        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")
            self._send_alert("failed_backup", str(e))
            raise

    def verify_backup(self, backup_path: Path):
        """Verify backup integrity"""
        try:
            # Load backup manifest
            with open(backup_path / "manifest.json") as f:
                manifest = json.load(f)

            verification_results = {
                "verified_at": datetime.now().isoformat(),
                "total_files": len(manifest["files"]),
                "verified_files": 0,
                "failed_files": [],
                "success": True
            }

            # Verify each file
            for file_path in manifest["files"]:
                backup_file = backup_path / Path(file_path).relative_to(Path(file_path).anchor)
                if backup_file.exists():
                    current_checksum = self._calculate_checksum(backup_file)
                    original_checksum = manifest["checksums"][file_path]
                    
                    if current_checksum == original_checksum:
                        verification_results["verified_files"] += 1
                    else:
                        verification_results["failed_files"].append(file_path)
                        verification_results["success"] = False
                else:
                    verification_results["failed_files"].append(file_path)
                    verification_results["success"] = False

            # Save verification results
            with open(backup_path / "verification_results.json", "w") as f:
                json.dump(verification_results, f, indent=2)

            if not verification_results["success"]:
                self._send_alert("verification_failed", verification_results)
                raise Exception("Backup verification failed")

            logger.info(f"Backup verification completed: {verification_results['verified_files']} files verified")
            return verification_results

        except Exception as e:
            logger.error(f"Backup verification failed: {str(e)}")
            raise

    def test_restore(self, backup_path: Path, restore_path: Path):
        """Test restore procedure"""
        try:
            restore_path.mkdir(parents=True, exist_ok=True)
            
            # Load backup manifest
            with open(backup_path / "manifest.json") as f:
                manifest = json.load(f)

            restore_results = {
                "restored_at": datetime.now().isoformat(),
                "total_files": len(manifest["files"]),
                "restored_files": 0,
                "failed_files": [],
                "success": True
            }

            # Restore each file
            for file_path in manifest["files"]:
                src_file = backup_path / Path(file_path).relative_to(Path(file_path).anchor)
                dest_file = restore_path / Path(file_path).name
                
                if src_file.exists():
                    if src_file.is_file():
                        shutil.copy2(src_file, dest_file)
                    else:
                        shutil.copytree(src_file, dest_file, dirs_exist_ok=True)
                    restore_results["restored_files"] += 1
                else:
                    restore_results["failed_files"].append(file_path)
                    restore_results["success"] = False

            # Verify restored files
            if self.config["verification"]["verify_on_restore"]:
                for file_path in manifest["files"]:
                    restored_file = restore_path / Path(file_path).name
                    if restored_file.exists():
                        current_checksum = self._calculate_checksum(restored_file)
                        original_checksum = manifest["checksums"][file_path]
                        
                        if current_checksum != original_checksum:
                            restore_results["failed_files"].append(file_path)
                            restore_results["success"] = False

            # Save restore results
            with open(restore_path / "restore_results.json", "w") as f:
                json.dump(restore_results, f, indent=2)

            if not restore_results["success"]:
                raise Exception("Restore test failed")

            logger.info(f"Restore test completed: {restore_results['restored_files']} files restored")
            return restore_results

        except Exception as e:
            logger.error(f"Restore test failed: {str(e)}")
            raise

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate file checksum"""
        hash_algo = getattr(hashlib, self.config["verification"]["checksum_algorithm"])()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_algo.update(chunk)
        return hash_algo.hexdigest()

    def _send_alert(self, alert_type: str, details: any):
        """Send alert based on configuration"""
        try:
            # Load alerts configuration
            with open(self.config_dir / "monitoring/alerts.yml") as f:
                alerts_config = yaml.safe_load(f)

            if alert_type in alerts_config["backup_alerts"]:
                alert_config = alerts_config["backup_alerts"][alert_type]
                
                # Log alert
                logger.error(f"Backup alert - {alert_type}: {details}")
                
                # Handle immediate actions
                if "immediate_action" in alert_config:
                    action = alert_config["immediate_action"]
                    if action == "pause_backups":
                        # Create a flag file to indicate backups should be paused
                        Path(self.backup_dir / ".pause_backups").touch()

        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")

def main():
    manager = BackupManager()
    
    # Create full backup
    backup_path = manager.create_backup(backup_type="full")
    
    # Test restore to temporary location
    test_restore_path = Path("test_restore")
    manager.test_restore(backup_path, test_restore_path)
    
    # Cleanup test restore
    if test_restore_path.exists():
        shutil.rmtree(test_restore_path)
    
    logger.info("✅ Backup operations completed successfully!")

if __name__ == "__main__":
    main() 