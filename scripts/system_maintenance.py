#!/usr/bin/env python3

import os
import sys
import json
import glob
import shutil
import psutil
import logging
import subprocess
from datetime import datetime, timedelta
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
        logging.FileHandler('maintenance.log'),
        logging.StreamHandler()
    ]
)

class SystemMaintenance:
    def __init__(self):
        self.log_dir = Path('logs')
        self.log_dir.mkdir(exist_ok=True)
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tasks": {},
            "issues": []
        }

    def rotate_logs(self) -> Dict[str, Any]:
        """Rotate and compress old log files"""
        try:
            rotated = []
            # Find log files older than 7 days
            for log_file in self.log_dir.glob('*.log'):
                if datetime.fromtimestamp(log_file.stat().st_mtime) < datetime.now() - timedelta(days=7):
                    # Compress old log
                    archive_name = f"{log_file.stem}_{datetime.now().strftime('%Y%m%d')}.gz"
                    subprocess.run(['gzip', '-c', str(log_file)], 
                                stdout=open(self.log_dir / archive_name, 'wb'))
                    # Truncate original log
                    log_file.write_text('')
                    rotated.append(str(log_file))
            
            # Clean up archives older than 30 days
            for archive in self.log_dir.glob('*.gz'):
                if datetime.fromtimestamp(archive.stat().st_mtime) < datetime.now() - timedelta(days=30):
                    archive.unlink()
            
            return {
                "status": "success",
                "rotated_logs": rotated
            }
        except Exception as e:
            self.results["issues"].append(f"Log rotation failed: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def security_scan(self) -> Dict[str, Any]:
        """Run security scans and checks"""
        try:
            results = {}
            
            # Check system updates
            apt_check = subprocess.run(['apt-get', '-s', 'upgrade'],
                                    capture_output=True, text=True)
            results['updates_available'] = 'upgraded' in apt_check.stdout
            
            # Check open ports
            netstat = subprocess.run(['netstat', '-tuln'],
                                  capture_output=True, text=True)
            results['open_ports'] = [
                line.split()[3].split(':')[-1]
                for line in netstat.stdout.splitlines()
                if ':' in line
            ]
            
            # Check failed login attempts
            auth_log = subprocess.run(['grep', 'Failed password', '/var/log/auth.log'],
                                   capture_output=True, text=True)
            results['failed_logins'] = len(auth_log.stdout.splitlines())
            
            # Check file permissions
            critical_paths = ['/etc/passwd', '/etc/shadow', '/etc/sudoers']
            results['permissions'] = {}
            for path in critical_paths:
                stat = os.stat(path)
                results['permissions'][path] = {
                    'mode': oct(stat.st_mode)[-3:],
                    'uid': stat.st_uid,
                    'gid': stat.st_gid
                }
            
            return {
                "status": "success",
                "scan_results": results
            }
        except Exception as e:
            self.results["issues"].append(f"Security scan failed: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def check_system_health(self) -> Dict[str, Any]:
        """Monitor system health metrics"""
        try:
            metrics = {}
            
            # CPU metrics
            cpu_metrics = {
                'usage_percent': psutil.cpu_percent(interval=1),
                'load_avg': os.getloadavg(),
                'core_count': psutil.cpu_count()
            }
            metrics['cpu'] = cpu_metrics
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_metrics = {
                'total_gb': memory.total / (1024**3),
                'used_gb': memory.used / (1024**3),
                'percent': memory.percent
            }
            metrics['memory'] = memory_metrics
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_metrics = {
                'total_gb': disk.total / (1024**3),
                'used_gb': disk.used / (1024**3),
                'percent': disk.percent
            }
            metrics['disk'] = disk_metrics
            
            # Process metrics
            process_metrics = {
                'total_processes': len(psutil.pids()),
                'zombie_processes': len([p for p in psutil.process_iter(['status']) 
                                      if p.info['status'] == 'zombie'])
            }
            metrics['processes'] = process_metrics
            
            # Generate alerts
            alerts = []
            if memory_metrics['percent'] > 85:
                alerts.append("Critical: High memory usage")
            if disk_metrics['percent'] > 90:
                alerts.append("Critical: High disk usage")
            if cpu_metrics['usage_percent'] > 90:
                alerts.append("Warning: High CPU usage")
            
            return {
                "status": "success",
                "metrics": metrics,
                "alerts": alerts
            }
        except Exception as e:
            self.results["issues"].append(f"Health check failed: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def run_maintenance(self):
        """Run all maintenance tasks"""
        logging.info("Starting system maintenance tasks...")
        
        # Rotate logs
        self.results["tasks"]["log_rotation"] = self.rotate_logs()
        logging.info("Log rotation completed")
        
        # Run security scan
        self.results["tasks"]["security_scan"] = self.security_scan()
        logging.info("Security scan completed")
        
        # Check system health
        self.results["tasks"]["health_check"] = self.check_system_health()
        logging.info("System health check completed")
        
        # Save maintenance report
        report_path = self.log_dir / f"maintenance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Log summary
        logging.info("\nMaintenance Summary:")
        for task_name, result in self.results["tasks"].items():
            status = "✅" if result["status"] == "success" else "❌"
            logging.info(f"{status} {task_name}")
        
        if self.results["issues"]:
            logging.error("\nIssues Found:")
            for issue in self.results["issues"]:
                logging.error(f"❌ {issue}")
        else:
            logging.info("\n✅ All maintenance tasks completed successfully!")

def main():
    try:
        maintenance = SystemMaintenance()
        maintenance.run_maintenance()
    except Exception as e:
        logging.error(f"Maintenance process failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 