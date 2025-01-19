#!/usr/bin/env python3
import subprocess
import logging
import shutil
from pathlib import Path
import json
import yaml
import time
from datetime import datetime
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RecoveryTester:
    def __init__(self):
        self.workspace_dir = Path("/home/jon/git/aether-workspaces/backend")
        self.backup_dir = self.workspace_dir / "backups"
        self.test_dir = self.workspace_dir / "test_recovery"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "success": True
        }

    def setup(self):
        """Setup test environment"""
        try:
            # Clean up old test directory
            if self.test_dir.exists():
                shutil.rmtree(self.test_dir)
            
            # Create fresh test directory
            self.test_dir.mkdir(parents=True)
            logger.info("Created test environment")

        except Exception as e:
            logger.error(f"Setup failed: {str(e)}")
            raise

    def test_backup_integrity(self):
        """Test backup integrity"""
        try:
            test_result = {
                "name": "backup_integrity",
                "status": "running",
                "details": []
            }

            # Find latest backup
            backups = list(self.backup_dir.glob("full_*"))
            if not backups:
                raise FileNotFoundError("No backups found")
            
            latest_backup = max(backups, key=lambda p: p.stat().st_mtime)
            test_result["details"].append(f"Testing backup: {latest_backup}")

            # Check manifest
            manifest_file = latest_backup / "manifest.json"
            if not manifest_file.exists():
                raise FileNotFoundError("Manifest file not found")

            with open(manifest_file) as f:
                manifest = json.load(f)
            
            # Verify each file in backup
            for file_path in manifest["files"]:
                backup_file = latest_backup / Path(file_path).relative_to(Path(file_path).anchor)
                if not backup_file.exists():
                    raise FileNotFoundError(f"Backup file missing: {file_path}")
                
                # Verify checksum
                current_checksum = self._calculate_checksum(backup_file)
                original_checksum = manifest["checksums"][file_path]
                
                if current_checksum != original_checksum:
                    raise ValueError(f"Checksum mismatch for {file_path}")
                
                test_result["details"].append(f"Verified: {file_path}")

            test_result["status"] = "passed"
            logger.info("Backup integrity test passed")

        except Exception as e:
            test_result["status"] = "failed"
            test_result["error"] = str(e)
            logger.error(f"Backup integrity test failed: {str(e)}")
            self.results["success"] = False

        finally:
            self.results["tests"].append(test_result)

    def test_restore_procedure(self):
        """Test restore procedure"""
        try:
            test_result = {
                "name": "restore_procedure",
                "status": "running",
                "details": []
            }

            # Find latest backup
            backups = list(self.backup_dir.glob("full_*"))
            latest_backup = max(backups, key=lambda p: p.stat().st_mtime)
            
            # Run restore
            restore_path = self.test_dir / "restore_test"
            result = subprocess.run(
                [
                    "python", 
                    str(self.workspace_dir / "scripts/backup_manager.py"),
                    "restore",
                    "--backup-path", str(latest_backup),
                    "--restore-path", str(restore_path)
                ],
                capture_output=True,
                text=True,
                check=True
            )
            test_result["details"].append("Restore completed")

            # Verify restored files
            with open(latest_backup / "manifest.json") as f:
                manifest = json.load(f)

            for file_path in manifest["files"]:
                restored_file = restore_path / Path(file_path).name
                if not restored_file.exists():
                    raise FileNotFoundError(f"Restored file missing: {file_path}")
                
                # Verify checksum
                current_checksum = self._calculate_checksum(restored_file)
                original_checksum = manifest["checksums"][file_path]
                
                if current_checksum != original_checksum:
                    raise ValueError(f"Restored file checksum mismatch: {file_path}")
                
                test_result["details"].append(f"Verified restored: {file_path}")

            test_result["status"] = "passed"
            logger.info("Restore procedure test passed")

        except Exception as e:
            test_result["status"] = "failed"
            test_result["error"] = str(e)
            logger.error(f"Restore procedure test failed: {str(e)}")
            self.results["success"] = False

        finally:
            self.results["tests"].append(test_result)

    def test_service_recovery(self):
        """Test service recovery"""
        try:
            test_result = {
                "name": "service_recovery",
                "status": "running",
                "details": []
            }

            # Stop service
            subprocess.run(
                ["sudo", "systemctl", "stop", "aether-maintenance"],
                check=True
            )
            test_result["details"].append("Service stopped")
            time.sleep(2)  # Wait for service to stop

            # Verify service is stopped
            result = subprocess.run(
                ["systemctl", "is-active", "aether-maintenance"],
                capture_output=True,
                text=True
            )
            if result.stdout.strip() == "active":
                raise RuntimeError("Service failed to stop")

            # Start service
            subprocess.run(
                ["sudo", "systemctl", "start", "aether-maintenance"],
                check=True
            )
            test_result["details"].append("Service started")
            time.sleep(2)  # Wait for service to start

            # Verify service is running
            result = subprocess.run(
                ["systemctl", "is-active", "aether-maintenance"],
                capture_output=True,
                text=True
            )
            if result.stdout.strip() != "active":
                raise RuntimeError("Service failed to start")

            test_result["status"] = "passed"
            logger.info("Service recovery test passed")

        except Exception as e:
            test_result["status"] = "failed"
            test_result["error"] = str(e)
            logger.error(f"Service recovery test failed: {str(e)}")
            self.results["success"] = False

        finally:
            self.results["tests"].append(test_result)

    def test_log_recovery(self):
        """Test log management recovery"""
        try:
            test_result = {
                "name": "log_recovery",
                "status": "running",
                "details": []
            }

            # Test log rotation
            result = subprocess.run(
                ["python", str(self.workspace_dir / "scripts/log_manager.py")],
                capture_output=True,
                text=True,
                check=True
            )
            test_result["details"].append("Log rotation completed")

            # Verify log directories
            log_dirs = [
                self.workspace_dir / "logs/system",
                self.workspace_dir / "logs/error",
                self.workspace_dir / "logs/access",
                self.workspace_dir / "logs/debug"
            ]
            
            for log_dir in log_dirs:
                if not log_dir.exists():
                    raise FileNotFoundError(f"Log directory missing: {log_dir}")
                test_result["details"].append(f"Verified directory: {log_dir}")

            test_result["status"] = "passed"
            logger.info("Log recovery test passed")

        except Exception as e:
            test_result["status"] = "failed"
            test_result["error"] = str(e)
            logger.error(f"Log recovery test failed: {str(e)}")
            self.results["success"] = False

        finally:
            self.results["tests"].append(test_result)

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file"""
        import hashlib
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def cleanup(self):
        """Clean up test environment"""
        try:
            if self.test_dir.exists():
                shutil.rmtree(self.test_dir)
            logger.info("Cleaned up test environment")

        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")

    def save_results(self):
        """Save test results"""
        try:
            results_file = self.workspace_dir / "logs/system/recovery_test_results.json"
            with open(results_file, "w") as f:
                json.dump(self.results, f, indent=2)
            logger.info(f"Saved test results to {results_file}")

        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")

def main():
    tester = RecoveryTester()
    
    try:
        # Setup test environment
        tester.setup()
        
        # Run tests
        tester.test_backup_integrity()
        tester.test_restore_procedure()
        tester.test_service_recovery()
        tester.test_log_recovery()
        
        # Save results
        tester.save_results()
        
        # Cleanup
        tester.cleanup()
        
        if not tester.results["success"]:
            logger.error("❌ Some recovery tests failed!")
            sys.exit(1)
        
        logger.info("✅ All recovery tests passed!")
        
    except Exception as e:
        logger.error(f"Recovery testing failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 