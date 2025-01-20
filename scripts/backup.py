#!/usr/bin/env python3
# Aether WebSocket Service Backup Script
# Christ is King! ☦

import argparse
import datetime
import json
import logging
import os
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path
from typing import Dict, List, Optional

import boto3
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class BackupManager:
    def __init__(self):
        # Configuration
        self.backup_root = Path(os.getenv('AETHER_WS_BACKUP_PATH', '/var/backups/websocket'))
        self.app_root = Path(os.getenv('AETHER_WS_APP_PATH', '/opt/aether/websocket'))
        self.retention_days = int(os.getenv('AETHER_WS_BACKUP_RETENTION_DAYS', '30'))
        
        # AWS S3 configuration (optional)
        self.s3_enabled = os.getenv('AETHER_WS_S3_BACKUP_ENABLED', 'false').lower() == 'true'
        if self.s3_enabled:
            self.s3_bucket = os.getenv('AETHER_WS_S3_BUCKET')
            self.s3_prefix = os.getenv('AETHER_WS_S3_PREFIX', 'websocket-backups')
            self.s3_client = boto3.client('s3')
            
        # Database configuration
        self.db_host = os.getenv('AETHER_WS_DB_HOST', 'localhost')
        self.db_port = os.getenv('AETHER_WS_DB_PORT', '5432')
        self.db_name = os.getenv('AETHER_WS_DB_NAME', 'websocket')
        self.db_user = os.getenv('AETHER_WS_DB_USER', 'websocket')
        
        # Redis configuration
        self.redis_host = os.getenv('AETHER_WS_REDIS_HOST', 'localhost')
        self.redis_port = os.getenv('AETHER_WS_REDIS_PORT', '6379')
        self.redis_db = os.getenv('AETHER_WS_REDIS_DB', '0')
        
    def create_backup_directories(self):
        """Create necessary backup directories"""
        directories = [
            self.backup_root,
            self.backup_root / 'db',
            self.backup_root / 'redis',
            self.backup_root / 'config',
            self.backup_root / 'logs'
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {directory}")
            
    def backup_database(self) -> Optional[Path]:
        """Backup PostgreSQL database"""
        try:
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_root / 'db' / f'websocket_db_{timestamp}.sql'
            
            cmd = [
                'pg_dump',
                '-h', self.db_host,
                '-p', self.db_port,
                '-U', self.db_user,
                '-F', 'c',  # Custom format
                '-b',  # Include large objects
                '-v',  # Verbose
                '-f', str(backup_file),
                self.db_name
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"Database backup created: {backup_file}")
                return backup_file
            else:
                logger.error(f"Database backup failed: {result.stderr}")
                return None
        except Exception as e:
            logger.error(f"Database backup error: {str(e)}")
            return None
            
    def backup_redis(self) -> Optional[Path]:
        """Backup Redis data"""
        try:
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_root / 'redis' / f'websocket_redis_{timestamp}.rdb'
            
            # Trigger Redis save
            redis_save_cmd = [
                'redis-cli',
                '-h', self.redis_host,
                '-p', self.redis_port,
                'SAVE'
            ]
            
            result = subprocess.run(redis_save_cmd, capture_output=True, text=True)
            if result.returncode == 0:
                # Copy Redis dump file
                redis_dump = Path(f'/var/lib/redis/dump.rdb')
                if redis_dump.exists():
                    shutil.copy2(redis_dump, backup_file)
                    logger.info(f"Redis backup created: {backup_file}")
                    return backup_file
                else:
                    logger.error("Redis dump file not found")
                    return None
            else:
                logger.error(f"Redis save failed: {result.stderr}")
                return None
        except Exception as e:
            logger.error(f"Redis backup error: {str(e)}")
            return None
            
    def backup_config(self) -> Optional[Path]:
        """Backup configuration files"""
        try:
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_root / 'config' / f'websocket_config_{timestamp}.tar.gz'
            
            with tarfile.open(backup_file, 'w:gz') as tar:
                # Add configuration files
                config_files = [
                    self.app_root / 'config',
                    Path('/etc/nginx/sites-available/websocket.conf'),
                    Path('/etc/supervisor/conf.d/websocket.conf'),
                    self.app_root / '.env'
                ]
                
                for file_path in config_files:
                    if file_path.exists():
                        tar.add(file_path, arcname=file_path.name)
                        
            logger.info(f"Configuration backup created: {backup_file}")
            return backup_file
        except Exception as e:
            logger.error(f"Configuration backup error: {str(e)}")
            return None
            
    def backup_logs(self) -> Optional[Path]:
        """Backup log files"""
        try:
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_root / 'logs' / f'websocket_logs_{timestamp}.tar.gz'
            
            with tarfile.open(backup_file, 'w:gz') as tar:
                # Add log files
                log_files = [
                    Path('/var/log/websocket'),
                    Path('/var/log/nginx/websocket*'),
                    Path('/var/log/supervisor/websocket*')
                ]
                
                for log_path in log_files:
                    if log_path.exists():
                        tar.add(log_path, arcname=log_path.name)
                        
            logger.info(f"Log backup created: {backup_file}")
            return backup_file
        except Exception as e:
            logger.error(f"Log backup error: {str(e)}")
            return None
            
    def upload_to_s3(self, file_path: Path) -> bool:
        """Upload backup file to S3"""
        if not self.s3_enabled:
            return False
            
        try:
            s3_key = f"{self.s3_prefix}/{file_path.parent.name}/{file_path.name}"
            self.s3_client.upload_file(
                str(file_path),
                self.s3_bucket,
                s3_key
            )
            logger.info(f"Uploaded to S3: {s3_key}")
            return True
        except Exception as e:
            logger.error(f"S3 upload error: {str(e)}")
            return False
            
    def cleanup_old_backups(self):
        """Remove backups older than retention period"""
        try:
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=self.retention_days)
            
            for backup_type in ['db', 'redis', 'config', 'logs']:
                backup_dir = self.backup_root / backup_type
                if not backup_dir.exists():
                    continue
                    
                for backup_file in backup_dir.glob('*'):
                    if backup_file.stat().st_mtime < cutoff_date.timestamp():
                        backup_file.unlink()
                        logger.info(f"Removed old backup: {backup_file}")
                        
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")
            
    def create_backup_report(self, backup_files: Dict[str, Optional[Path]]) -> Dict:
        """Create a backup report"""
        timestamp = datetime.datetime.now().isoformat()
        
        report = {
            "timestamp": timestamp,
            "success": all(backup_files.values()),
            "backups": {
                backup_type: {
                    "file": str(backup_path) if backup_path else None,
                    "size": backup_path.stat().st_size if backup_path else 0,
                    "success": bool(backup_path)
                }
                for backup_type, backup_path in backup_files.items()
            }
        }
        
        # Save report
        report_file = self.backup_root / f"backup_report_{timestamp}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        return report
        
    def run_backup(self) -> bool:
        """Run the complete backup process"""
        try:
            logger.info("Starting backup process")
            
            # Create backup directories
            self.create_backup_directories()
            
            # Perform backups
            backup_files = {
                "database": self.backup_database(),
                "redis": self.backup_redis(),
                "config": self.backup_config(),
                "logs": self.backup_logs()
            }
            
            # Upload to S3 if enabled
            if self.s3_enabled:
                for backup_file in backup_files.values():
                    if backup_file:
                        self.upload_to_s3(backup_file)
                        
            # Create backup report
            report = self.create_backup_report(backup_files)
            
            # Cleanup old backups
            self.cleanup_old_backups()
            
            success = all(backup_files.values())
            if success:
                logger.info("Backup process completed successfully")
            else:
                logger.error("Backup process completed with errors")
                
            return success
            
        except Exception as e:
            logger.error(f"Backup process failed: {str(e)}")
            return False
            
def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Aether WebSocket Service Backup")
    parser.add_argument('--no-db', action='store_true', help="Skip database backup")
    parser.add_argument('--no-redis', action='store_true', help="Skip Redis backup")
    parser.add_argument('--no-config', action='store_true', help="Skip config backup")
    parser.add_argument('--no-logs', action='store_true', help="Skip logs backup")
    args = parser.parse_args()
    
    backup_manager = BackupManager()
    success = backup_manager.run_backup()
    
    sys.exit(0 if success else 1)
    
if __name__ == "__main__":
    main() 