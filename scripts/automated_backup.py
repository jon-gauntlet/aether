#!/usr/bin/env python3

import os
import sys
import json
import time
import shutil
import logging
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup.log'),
        logging.StreamHandler()
    ]
)

class BackupManager:
    def __init__(self):
        self.backup_dir = Path('backups')
        self.backup_dir.mkdir(exist_ok=True)
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "backups": {},
            "issues": []
        }

    def backup_redis(self) -> Dict[str, Any]:
        """Backup Redis data"""
        try:
            backup_path = self.backup_dir / f"redis_{self.timestamp}.rdb"
            
            # Trigger Redis SAVE
            subprocess.run(['redis-cli', 'SAVE'], check=True)
            
            # Copy dump.rdb to backup location
            shutil.copy2('/var/lib/redis/dump.rdb', backup_path)
            
            # Verify backup file
            if not backup_path.exists():
                raise Exception("Backup file not created")
            
            backup_size = backup_path.stat().st_size
            
            # Keep only last 7 Redis backups
            self._cleanup_old_backups('redis_*.rdb', keep=7)
            
            return {
                "status": "success",
                "path": str(backup_path),
                "size_bytes": backup_size
            }
        except Exception as e:
            self.results["issues"].append(f"Redis backup failed: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def backup_supabase(self) -> Dict[str, Any]:
        """Backup Supabase database"""
        try:
            backup_path = self.backup_dir / f"supabase_{self.timestamp}.sql"
            
            # Create Supabase backup
            subprocess.run(
                ['supabase', 'db', 'dump', '-f', str(backup_path)],
                check=True
            )
            
            # Verify backup file
            if not backup_path.exists():
                raise Exception("Backup file not created")
            
            backup_size = backup_path.stat().st_size
            
            # Keep only last 7 Supabase backups
            self._cleanup_old_backups('supabase_*.sql', keep=7)
            
            return {
                "status": "success",
                "path": str(backup_path),
                "size_bytes": backup_size
            }
        except Exception as e:
            self.results["issues"].append(f"Supabase backup failed: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def verify_backups(self) -> Dict[str, Any]:
        """Verify backup integrity"""
        try:
            verifications = {}
            
            # Verify Redis backup
            redis_backup = sorted(self.backup_dir.glob('redis_*.rdb'))[-1]
            redis_verify = subprocess.run(
                ['redis-check-rdb', str(redis_backup)],
                capture_output=True,
                text=True
            )
            verifications['redis'] = redis_verify.returncode == 0
            
            # Verify Supabase backup
            supabase_backup = sorted(self.backup_dir.glob('supabase_*.sql'))[-1]
            with open(supabase_backup, 'r') as f:
                # Check if file is readable and contains expected content
                first_line = f.readline()
                verifications['supabase'] = first_line.startswith('--')
            
            return {
                "status": "success",
                "verifications": verifications
            }
        except Exception as e:
            self.results["issues"].append(f"Backup verification failed: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def _cleanup_old_backups(self, pattern: str, keep: int = 7):
        """Clean up old backup files, keeping the specified number of recent ones"""
        backup_files = sorted(self.backup_dir.glob(pattern))
        if len(backup_files) > keep:
            for old_backup in backup_files[:-keep]:
                old_backup.unlink()
                logging.info(f"Cleaned up old backup: {old_backup}")

    def run_backup(self):
        """Run the complete backup process"""
        logging.info("Starting automated backup process...")
        
        # Create Redis backup
        self.results["backups"]["redis"] = self.backup_redis()
        logging.info("Redis backup completed")
        
        # Create Supabase backup
        self.results["backups"]["supabase"] = self.backup_supabase()
        logging.info("Supabase backup completed")
        
        # Verify backups
        self.results["backups"]["verification"] = self.verify_backups()
        logging.info("Backup verification completed")
        
        # Save backup report
        report_path = self.backup_dir / f"backup_report_{self.timestamp}.json"
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Log summary
        logging.info("\nBackup Summary:")
        for backup_name, result in self.results["backups"].items():
            status = "✅" if result["status"] == "success" else "❌"
            logging.info(f"{status} {backup_name}")
        
        if self.results["issues"]:
            logging.error("\nIssues Found:")
            for issue in self.results["issues"]:
                logging.error(f"❌ {issue}")
        else:
            logging.info("\n✅ All backups completed successfully!")

def main():
    try:
        backup_manager = BackupManager()
        backup_manager.run_backup()
    except Exception as e:
        logging.error(f"Backup process failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 