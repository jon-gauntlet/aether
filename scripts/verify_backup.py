#!/usr/bin/env python3
# Aether WebSocket Service Backup Verification
# 

import argparse
import datetime
import hashlib
import json
import logging
import os
import subprocess
import sys
import tarfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

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

class BackupVerifier:
    def __init__(self):
        # Configuration
        self.backup_root = Path(os.getenv('AETHER_WS_BACKUP_PATH', '/var/backups/websocket'))
        self.notify_email = os.getenv('AETHER_WS_BACKUP_NOTIFY_EMAIL', 'admin@example.com')
        self.slack_webhook = os.getenv('AETHER_WS_BACKUP_NOTIFY_SLACK_WEBHOOK')
        
        # S3 configuration
        self.s3_enabled = os.getenv('AETHER_WS_S3_BACKUP_ENABLED', 'false').lower() == 'true'
        if self.s3_enabled:
            self.s3_bucket = os.getenv('AETHER_WS_S3_BUCKET')
            self.s3_prefix = os.getenv('AETHER_WS_S3_PREFIX', 'websocket-backups')
            self.s3_client = boto3.client('s3')
            
    def verify_database_backup(self, backup_file: Path) -> Tuple[bool, str]:
        """Verify PostgreSQL database backup"""
        try:
            # Test restore to temporary database
            test_db = f"verify_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Create test database
            create_cmd = ['createdb', test_db]
            subprocess.run(create_cmd, check=True, capture_output=True)
            
            try:
                # Restore backup
                restore_cmd = [
                    'pg_restore',
                    '-d', test_db,
                    '-v',
                    str(backup_file)
                ]
                subprocess.run(restore_cmd, check=True, capture_output=True)
                
                # Run simple query to verify data
                verify_cmd = ['psql', '-d', test_db, '-c', 'SELECT COUNT(*) FROM information_schema.tables;']
                result = subprocess.run(verify_cmd, check=True, capture_output=True, text=True)
                
                return True, "Database backup verified successfully"
                
            finally:
                # Drop test database
                drop_cmd = ['dropdb', test_db]
                subprocess.run(drop_cmd, check=True, capture_output=True)
                
        except subprocess.CalledProcessError as e:
            return False, f"Database verification failed: {e.stderr}"
        except Exception as e:
            return False, f"Database verification error: {str(e)}"
            
    def verify_redis_backup(self, backup_file: Path) -> Tuple[bool, str]:
        """Verify Redis backup file"""
        try:
            # Check file integrity
            if not backup_file.exists():
                return False, "Backup file does not exist"
                
            # Check file size
            if backup_file.stat().st_size == 0:
                return False, "Backup file is empty"
                
            # Try to load the RDB file using redis-check-rdb
            check_cmd = ['redis-check-rdb', str(backup_file)]
            result = subprocess.run(check_cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                return True, "Redis backup verified successfully"
            else:
                return False, f"Redis backup verification failed: {result.stderr}"
                
        except Exception as e:
            return False, f"Redis backup verification error: {str(e)}"
            
    def verify_config_backup(self, backup_file: Path) -> Tuple[bool, str]:
        """Verify configuration backup"""
        try:
            if not tarfile.is_tarfile(backup_file):
                return False, "Not a valid tar file"
                
            with tarfile.open(backup_file, 'r:gz') as tar:
                # Check for required files
                required_files = [
                    'websocket.conf',
                    'supervisor.conf',
                    '.env'
                ]
                
                found_files = tar.getnames()
                missing_files = [f for f in required_files if not any(f in name for name in found_files)]
                
                if missing_files:
                    return False, f"Missing required files: {', '.join(missing_files)}"
                    
                # Verify file contents
                for member in tar.getmembers():
                    if member.size == 0:
                        return False, f"Empty file in archive: {member.name}"
                        
            return True, "Configuration backup verified successfully"
            
        except Exception as e:
            return False, f"Configuration backup verification error: {str(e)}"
            
    def verify_s3_backup(self, local_file: Path, backup_type: str) -> Tuple[bool, str]:
        """Verify backup file in S3"""
        if not self.s3_enabled:
            return True, "S3 backup not enabled"
            
        try:
            s3_key = f"{self.s3_prefix}/{backup_type}/{local_file.name}"
            
            # Check if file exists in S3
            try:
                s3_obj = self.s3_client.head_object(
                    Bucket=self.s3_bucket,
                    Key=s3_key
                )
            except Exception:
                return False, f"File not found in S3: {s3_key}"
                
            # Compare sizes
            local_size = local_file.stat().st_size
            s3_size = s3_obj['ContentLength']
            
            if local_size != s3_size:
                return False, f"Size mismatch - Local: {local_size}, S3: {s3_size}"
                
            # Compare checksums
            local_md5 = hashlib.md5(local_file.read_bytes()).hexdigest()
            s3_md5 = s3_obj['ETag'].strip('"')
            
            if local_md5 != s3_md5:
                return False, f"Checksum mismatch - Local: {local_md5}, S3: {s3_md5}"
                
            return True, "S3 backup verified successfully"
            
        except Exception as e:
            return False, f"S3 backup verification error: {str(e)}"
            
    def send_notification(self, success: bool, message: str):
        """Send notification about verification results"""
        status = "Success" if success else "Failure"
        subject = f"Backup Verification {status}"
        
        # Send email
        if self.notify_email:
            try:
                subprocess.run([
                    'mail',
                    '-s', subject,
                    self.notify_email
                ], input=message.encode(), check=True)
            except Exception as e:
                logger.error(f"Failed to send email notification: {e}")
                
        # Send Slack notification
        if self.slack_webhook:
            try:
                emoji = "✅" if success else "❌"
                slack_message = f"{emoji} *Backup Verification {status}*\n{message}"
                
                subprocess.run([
                    'curl',
                    '-X', 'POST',
                    '-H', 'Content-type: application/json',
                    '--data', json.dumps({"text": slack_message}),
                    self.slack_webhook
                ], check=True)
            except Exception as e:
                logger.error(f"Failed to send Slack notification: {e}")
                
    def verify_backups(self) -> bool:
        """Verify all backup files"""
        verification_results = []
        overall_success = True
        
        # Find and verify latest backups
        for backup_type in ['db', 'redis', 'config']:
            backup_dir = self.backup_root / backup_type
            if not backup_dir.exists():
                logger.warning(f"Backup directory not found: {backup_dir}")
                continue
                
            # Get latest backup file
            backup_files = sorted(backup_dir.glob('*'), key=lambda x: x.stat().st_mtime, reverse=True)
            if not backup_files:
                logger.warning(f"No backup files found in {backup_dir}")
                continue
                
            latest_backup = backup_files[0]
            logger.info(f"Verifying {backup_type} backup: {latest_backup}")
            
            # Verify based on type
            if backup_type == 'db':
                success, message = self.verify_database_backup(latest_backup)
            elif backup_type == 'redis':
                success, message = self.verify_redis_backup(latest_backup)
            elif backup_type == 'config':
                success, message = self.verify_config_backup(latest_backup)
                
            # Verify S3 backup if enabled
            if success and self.s3_enabled:
                s3_success, s3_message = self.verify_s3_backup(latest_backup, backup_type)
                success = success and s3_success
                message = f"{message}\nS3: {s3_message}"
                
            verification_results.append({
                'type': backup_type,
                'file': str(latest_backup),
                'success': success,
                'message': message
            })
            
            overall_success = overall_success and success
            
        # Generate report
        report = []
        for result in verification_results:
            status = "✓" if result['success'] else "✗"
            report.append(f"{status} {result['type']}: {result['message']}")
            
        report_message = "\n".join(report)
        logger.info("\nVerification Report:\n" + report_message)
        
        # Send notification
        self.send_notification(overall_success, report_message)
        
        return overall_success
        
def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Aether WebSocket Service Backup Verification")
    parser.add_argument('--quiet', action='store_true', help="Suppress output")
    args = parser.parse_args()
    
    if args.quiet:
        logging.getLogger().setLevel(logging.WARNING)
        
    verifier = BackupVerifier()
    success = verifier.verify_backups()
    
    sys.exit(0 if success else 1)
    
if __name__ == "__main__":
    main() 