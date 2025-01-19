#!/usr/bin/env python3

import os
import sys
import json
import redis
import psutil
import logging
import requests
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('alerts.log'),
        logging.StreamHandler()
    ]
)

class AlertManager:
    def __init__(self):
        self.log_dir = Path('logs')
        self.log_dir.mkdir(exist_ok=True)
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "alerts": [],
            "metrics": {}
        }
        
        # Critical thresholds
        self.critical_thresholds = {
            "memory_usage": 85,  # >85%
            "error_rate": 5,     # >5%
            "processing_rate": 150000,  # <150K/sec
            "query_rate": 150000       # <150K/sec
        }
        
        # Warning thresholds
        self.warning_thresholds = {
            "query_latency": 800,  # >800ms
            "cache_hits": 70,      # <70%
            "cpu_usage": 90,       # >90%
            "io_wait": 20         # >20%
        }

    def check_redis_metrics(self) -> Dict[str, Any]:
        """Check Redis performance metrics"""
        try:
            redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                ssl=bool(os.getenv('REDIS_SSL', False)),
                ssl_cert_reqs=None if os.getenv('REDIS_SSL') else None,
                decode_responses=True
            )
            
            # Get Redis info
            info = redis_client.info()
            
            # Calculate metrics
            total_commands = int(info.get('total_commands_processed', 0))
            uptime = int(info.get('uptime_in_seconds', 1))
            processing_rate = total_commands / uptime if uptime > 0 else 0
            
            hits = int(info.get('keyspace_hits', 0))
            misses = int(info.get('keyspace_misses', 0))
            total_ops = hits + misses
            cache_hit_rate = (hits / total_ops * 100) if total_ops > 0 else 0
            
            metrics = {
                "processing_rate": processing_rate,
                "cache_hit_rate": cache_hit_rate,
                "connected_clients": info.get('connected_clients', 0),
                "used_memory_percent": (int(info.get('used_memory', 0)) / 
                                      int(info.get('maxmemory', 1)) * 100)
            }
            
            # Check for critical conditions
            if processing_rate < self.critical_thresholds["processing_rate"]:
                self.results["alerts"].append({
                    "level": "CRITICAL",
                    "message": f"Low processing rate: {processing_rate:.2f}/sec",
                    "timestamp": datetime.now().isoformat()
                })
            
            # Check for warning conditions
            if cache_hit_rate < self.warning_thresholds["cache_hits"]:
                self.results["alerts"].append({
                    "level": "WARNING",
                    "message": f"Low cache hit rate: {cache_hit_rate:.2f}%",
                    "timestamp": datetime.now().isoformat()
                })
            
            return metrics
            
        except Exception as e:
            self.results["alerts"].append({
                "level": "CRITICAL",
                "message": f"Redis metrics check failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            })
            return {}

    def check_system_metrics(self) -> Dict[str, Any]:
        """Check system performance metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_times = psutil.cpu_times_percent()
            io_wait = cpu_times.iowait
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            metrics = {
                "cpu_usage": cpu_percent,
                "io_wait": io_wait,
                "memory_usage": memory_percent
            }
            
            # Check for critical conditions
            if memory_percent > self.critical_thresholds["memory_usage"]:
                self.results["alerts"].append({
                    "level": "CRITICAL",
                    "message": f"High memory usage: {memory_percent:.2f}%",
                    "timestamp": datetime.now().isoformat()
                })
            
            # Check for warning conditions
            if cpu_percent > self.warning_thresholds["cpu_usage"]:
                self.results["alerts"].append({
                    "level": "WARNING",
                    "message": f"High CPU usage: {cpu_percent:.2f}%",
                    "timestamp": datetime.now().isoformat()
                })
            
            if io_wait > self.warning_thresholds["io_wait"]:
                self.results["alerts"].append({
                    "level": "WARNING",
                    "message": f"High IO wait: {io_wait:.2f}%",
                    "timestamp": datetime.now().isoformat()
                })
            
            return metrics
            
        except Exception as e:
            self.results["alerts"].append({
                "level": "CRITICAL",
                "message": f"System metrics check failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            })
            return {}

    def check_query_metrics(self) -> Dict[str, Any]:
        """Check query performance metrics"""
        try:
            # Get query metrics from Supabase
            metrics_url = f"{os.getenv('SUPABASE_URL')}/rest/v1/rpc/get_query_metrics"
            headers = {
                "apikey": os.getenv('SUPABASE_SERVICE_KEY'),
                "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}"
            }
            
            response = requests.get(metrics_url, headers=headers)
            data = response.json()
            
            metrics = {
                "query_rate": data.get('query_rate', 0),
                "error_rate": data.get('error_rate', 0),
                "avg_latency": data.get('avg_latency', 0)
            }
            
            # Check for critical conditions
            if metrics["query_rate"] < self.critical_thresholds["query_rate"]:
                self.results["alerts"].append({
                    "level": "CRITICAL",
                    "message": f"Low query rate: {metrics['query_rate']}/sec",
                    "timestamp": datetime.now().isoformat()
                })
            
            if metrics["error_rate"] > self.critical_thresholds["error_rate"]:
                self.results["alerts"].append({
                    "level": "CRITICAL",
                    "message": f"High error rate: {metrics['error_rate']}%",
                    "timestamp": datetime.now().isoformat()
                })
            
            # Check for warning conditions
            if metrics["avg_latency"] > self.warning_thresholds["query_latency"]:
                self.results["alerts"].append({
                    "level": "WARNING",
                    "message": f"High query latency: {metrics['avg_latency']}ms",
                    "timestamp": datetime.now().isoformat()
                })
            
            return metrics
            
        except Exception as e:
            self.results["alerts"].append({
                "level": "WARNING",
                "message": f"Query metrics check failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            })
            return {}

    def notify_alerts(self):
        """Send notifications for alerts"""
        if not self.results["alerts"]:
            return
        
        # Group alerts by level
        critical_alerts = [a for a in self.results["alerts"] if a["level"] == "CRITICAL"]
        warning_alerts = [a for a in self.results["alerts"] if a["level"] == "WARNING"]
        
        # Log alerts
        if critical_alerts:
            logging.error("\nCRITICAL Alerts:")
            for alert in critical_alerts:
                logging.error(f"❌ {alert['message']}")
        
        if warning_alerts:
            logging.warning("\nWarning Alerts:")
            for alert in warning_alerts:
                logging.warning(f"⚠️ {alert['message']}")
        
        # Save alert report
        report_path = self.log_dir / f"alert_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)

    def run_checks(self):
        """Run all alert checks"""
        logging.info("Starting alert checks...")
        
        # Check Redis metrics
        self.results["metrics"]["redis"] = self.check_redis_metrics()
        logging.info("Redis metrics check completed")
        
        # Check system metrics
        self.results["metrics"]["system"] = self.check_system_metrics()
        logging.info("System metrics check completed")
        
        # Check query metrics
        self.results["metrics"]["query"] = self.check_query_metrics()
        logging.info("Query metrics check completed")
        
        # Process and notify alerts
        self.notify_alerts()
        
        # Log summary
        total_alerts = len(self.results["alerts"])
        critical_alerts = len([a for a in self.results["alerts"] if a["level"] == "CRITICAL"])
        warning_alerts = len([a for a in self.results["alerts"] if a["level"] == "WARNING"])
        
        if total_alerts == 0:
            logging.info("\n✅ All systems operating normally")
        else:
            logging.warning(f"\nAlert Summary: {critical_alerts} critical, {warning_alerts} warnings")

def main():
    try:
        alert_manager = AlertManager()
        alert_manager.run_checks()
    except Exception as e:
        logging.error(f"Alert manager failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 