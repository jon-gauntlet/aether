#!/usr/bin/env python3
import subprocess
import logging
import json
from pathlib import Path
from datetime import datetime, timedelta
import psutil
import time
import yaml
import statistics

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackupVerifier:
    def __init__(self):
        self.workspace_dir = Path("/home/jon/git/aether-workspaces/backend")
        self.backup_dir = self.workspace_dir / "backups"
        self.config_dir = self.workspace_dir / "config"
        self.load_config()

    def load_config(self):
        """Load backup configuration"""
        with open(self.config_dir / "backup_config.json") as f:
            self.config = json.load(f)
        logger.info("Loaded backup configuration")

    def verify_all_backups(self):
        """Verify all backups and collect performance metrics"""
        try:
            verification_results = {
                "timestamp": datetime.now().isoformat(),
                "backups": [],
                "performance_metrics": {},
                "success_rate": 0,
                "total_size": 0,
                "verification_times": []
            }

            # Find all backups
            full_backups = list(self.backup_dir.glob("full_*"))
            incremental_backups = list(self.backup_dir.glob("incremental_*"))
            all_backups = full_backups + incremental_backups

            if not all_backups:
                raise FileNotFoundError("No backups found")

            # Track performance metrics
            start_time = time.time()
            cpu_usage = []
            memory_usage = []
            disk_io = []

            # Verify each backup
            success_count = 0
            for backup_path in all_backups:
                logger.info(f"Verifying backup: {backup_path}")
                
                # Collect system metrics
                cpu_usage.append(psutil.cpu_percent())
                memory_usage.append(psutil.virtual_memory().percent)
                disk_io.append(psutil.disk_io_counters().read_bytes + 
                             psutil.disk_io_counters().write_bytes)

                backup_result = self._verify_backup(backup_path)
                verification_results["backups"].append(backup_result)
                
                if backup_result["status"] == "verified":
                    success_count += 1
                    verification_results["total_size"] += backup_result["size"]
                    verification_results["verification_times"].append(
                        backup_result["verification_time"]
                    )

            # Calculate performance metrics
            total_time = time.time() - start_time
            verification_results["performance_metrics"] = {
                "total_verification_time": total_time,
                "average_verification_time": statistics.mean(verification_results["verification_times"]),
                "cpu_usage": {
                    "average": statistics.mean(cpu_usage),
                    "max": max(cpu_usage)
                },
                "memory_usage": {
                    "average": statistics.mean(memory_usage),
                    "max": max(memory_usage)
                },
                "disk_io": {
                    "total_bytes": max(disk_io) - min(disk_io),
                    "average_throughput": (max(disk_io) - min(disk_io)) / total_time
                }
            }

            # Calculate success rate
            verification_results["success_rate"] = (success_count / len(all_backups)) * 100

            # Save verification results
            self._save_results(verification_results)
            
            # Check against thresholds
            self._check_thresholds(verification_results)

            logger.info(f"Backup verification completed. Success rate: {verification_results['success_rate']}%")
            return verification_results

        except Exception as e:
            logger.error(f"Backup verification failed: {str(e)}")
            self._send_alert("verification_failed", str(e))
            raise

    def _verify_backup(self, backup_path: Path):
        """Verify a single backup"""
        try:
            start_time = time.time()
            result = {
                "path": str(backup_path),
                "type": "full" if "full_" in backup_path.name else "incremental",
                "timestamp": datetime.fromtimestamp(backup_path.stat().st_mtime).isoformat(),
                "size": 0,
                "files_verified": 0,
                "verification_time": 0,
                "status": "failed",
                "errors": []
            }

            # Check manifest
            manifest_file = backup_path / "manifest.json"
            if not manifest_file.exists():
                result["errors"].append("Manifest file missing")
                return result

            with open(manifest_file) as f:
                manifest = json.load(f)

            # Verify each file
            for file_path in manifest["files"]:
                backup_file = backup_path / Path(file_path).relative_to(Path(file_path).anchor)
                if not backup_file.exists():
                    result["errors"].append(f"File missing: {file_path}")
                    continue

                # Verify checksum
                current_checksum = self._calculate_checksum(backup_file)
                original_checksum = manifest["checksums"][file_path]

                if current_checksum != original_checksum:
                    result["errors"].append(f"Checksum mismatch: {file_path}")
                    continue

                result["size"] += backup_file.stat().st_size
                result["files_verified"] += 1

            # Update result status
            result["verification_time"] = time.time() - start_time
            if not result["errors"]:
                result["status"] = "verified"

            return result

        except Exception as e:
            logger.error(f"Failed to verify backup {backup_path}: {str(e)}")
            result["errors"].append(str(e))
            return result

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file"""
        import hashlib
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def _save_results(self, results: dict):
        """Save verification results"""
        try:
            # Save detailed results
            results_file = self.workspace_dir / "logs/system/backup_verification.json"
            with open(results_file, "w") as f:
                json.dump(results, f, indent=2)

            # Save performance metrics
            metrics_file = self.workspace_dir / "logs/system/backup_metrics.json"
            with open(metrics_file, "w") as f:
                json.dump(results["performance_metrics"], f, indent=2)

            logger.info(f"Saved verification results to {results_file}")

        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")
            raise

    def _check_thresholds(self, results: dict):
        """Check results against configured thresholds"""
        try:
            # Load monitoring configuration
            with open(self.config_dir / "monitoring/alerts.yml") as f:
                alerts_config = yaml.safe_load(f)

            # Check success rate
            if results["success_rate"] < 100:
                self._send_alert(
                    "backup_verification_failed",
                    f"Backup verification success rate: {results['success_rate']}%"
                )

            # Check performance metrics
            metrics = results["performance_metrics"]
            
            # CPU usage threshold
            if metrics["cpu_usage"]["max"] > alerts_config["system_alerts"]["high_cpu_usage"]["threshold_percent"]:
                self._send_alert(
                    "high_cpu_usage",
                    f"CPU usage during verification: {metrics['cpu_usage']['max']}%"
                )

            # Memory usage threshold
            if metrics["memory_usage"]["max"] > alerts_config["system_alerts"]["high_memory_usage"]["threshold_percent"]:
                self._send_alert(
                    "high_memory_usage",
                    f"Memory usage during verification: {metrics['memory_usage']['max']}%"
                )

        except Exception as e:
            logger.error(f"Failed to check thresholds: {str(e)}")
            raise

    def _send_alert(self, alert_type: str, details: str):
        """Send alert based on configuration"""
        try:
            # Load alerts configuration
            with open(self.config_dir / "monitoring/alerts.yml") as f:
                alerts_config = yaml.safe_load(f)

            if alert_type in alerts_config["backup_alerts"]:
                alert_config = alerts_config["backup_alerts"][alert_type]
                
                # Log alert
                logger.error(f"Backup alert - {alert_type}: {details}")

        except Exception as e:
            logger.error(f"Failed to send alert: {str(e)}")

def main():
    verifier = BackupVerifier()
    
    try:
        # Verify all backups and collect metrics
        results = verifier.verify_all_backups()
        
        # Exit with error if verification failed
        if results["success_rate"] < 100:
            logger.error("❌ Backup verification failed!")
            sys.exit(1)
        
        logger.info("✅ All backups verified successfully!")
        
    except Exception as e:
        logger.error(f"Backup verification failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 