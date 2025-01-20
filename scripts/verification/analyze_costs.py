import os
import json
import psutil
import redis
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ResourceAnalyzer:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "metrics": {},
            "recommendations": []
        }
        
    def analyze_redis_usage(self) -> Dict[str, Any]:
        """Analyze Redis resource usage and performance"""
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
            
            # Calculate memory efficiency
            memory_usage = int(info.get('used_memory', 0))
            peak_memory = int(info.get('used_memory_peak', 0))
            memory_efficiency = (memory_usage / peak_memory) * 100 if peak_memory > 0 else 0
            
            # Analyze key space
            keyspace_info = {db: info[db] for db in info if db.startswith('db')}
            total_keys = sum(db_info['keys'] for db_info in keyspace_info.values())
            
            # Get hit/miss ratio
            hits = int(info.get('keyspace_hits', 0))
            misses = int(info.get('keyspace_misses', 0))
            hit_ratio = (hits / (hits + misses)) * 100 if (hits + misses) > 0 else 0
            
            metrics = {
                "memory_usage_bytes": memory_usage,
                "peak_memory_bytes": peak_memory,
                "memory_efficiency": memory_efficiency,
                "total_keys": total_keys,
                "hit_ratio": hit_ratio,
                "connected_clients": info.get('connected_clients', 0)
            }
            
            # Generate recommendations
            if memory_efficiency < 70:
                self.results["recommendations"].append(
                    "Redis memory usage is inefficient. Consider adjusting maxmemory and eviction policies."
                )
            if hit_ratio < 80:
                self.results["recommendations"].append(
                    "Redis cache hit ratio is low. Review caching strategy and TTL settings."
                )
            
            return metrics
            
        except Exception as e:
            self.results["recommendations"].append(f"Redis analysis failed: {str(e)}")
            return {"error": str(e)}

    def analyze_system_resources(self) -> Dict[str, Any]:
        """Analyze system resource usage"""
        try:
            # Get CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Get memory usage
            memory = psutil.virtual_memory()
            
            # Get disk usage
            disk = psutil.disk_usage('/')
            
            metrics = {
                "cpu": {
                    "percent": cpu_percent,
                    "cores": cpu_count,
                    "per_core_percent": psutil.cpu_percent(interval=1, percpu=True)
                },
                "memory": {
                    "total_gb": memory.total / (1024**3),
                    "used_gb": memory.used / (1024**3),
                    "percent": memory.percent
                },
                "disk": {
                    "total_gb": disk.total / (1024**3),
                    "used_gb": disk.used / (1024**3),
                    "percent": disk.percent
                }
            }
            
            # Generate recommendations
            if cpu_percent > 70:
                self.results["recommendations"].append(
                    "High CPU usage detected. Consider scaling or optimizing processing."
                )
            if memory.percent > 80:
                self.results["recommendations"].append(
                    "High memory usage detected. Review memory allocation and consider upgrading."
                )
            if disk.percent > 80:
                self.results["recommendations"].append(
                    "High disk usage detected. Implement cleanup procedures or increase storage."
                )
            
            return metrics
            
        except Exception as e:
            self.results["recommendations"].append(f"System analysis failed: {str(e)}")
            return {"error": str(e)}

    def analyze_monitoring_retention(self) -> Dict[str, Any]:
        """Analyze monitoring data retention and storage"""
        try:
            # Check Prometheus storage
            metrics = {
                "prometheus": {
                    "retention_days": 15,  # Default value
                    "storage_gb": 0
                },
                "grafana": {
                    "dashboard_count": 0,
                    "alert_count": 0
                }
            }
            
            # Try to get actual Prometheus metrics
            try:
                response = requests.get("http://localhost:9090/api/v1/status/config")
                if response.status_code == 200:
                    config = response.json()
                    metrics["prometheus"]["retention_days"] = config.get(
                        "storage.tsdb.retention.time", "15d"
                    ).replace("d", "")
            except:
                pass
            
            # Try to get Grafana metrics
            try:
                headers = {"Authorization": f"Bearer {os.getenv('GRAFANA_API_KEY', '')}"}
                dashboards = requests.get(
                    "http://localhost:3000/api/search",
                    headers=headers
                )
                if dashboards.status_code == 200:
                    metrics["grafana"]["dashboard_count"] = len(dashboards.json())
                
                alerts = requests.get(
                    "http://localhost:3000/api/alerts",
                    headers=headers
                )
                if alerts.status_code == 200:
                    metrics["grafana"]["alert_count"] = len(alerts.json())
            except:
                pass
            
            # Generate recommendations
            if int(metrics["prometheus"]["retention_days"]) > 30:
                self.results["recommendations"].append(
                    "Consider reducing Prometheus retention period to optimize storage."
                )
            
            return metrics
            
        except Exception as e:
            self.results["recommendations"].append(f"Monitoring analysis failed: {str(e)}")
            return {"error": str(e)}

    def run_analysis(self):
        """Run all resource analysis checks"""
        print("Starting Resource Analysis...")
        
        # Run all analyses
        self.results["metrics"]["redis"] = self.analyze_redis_usage()
        print("✓ Redis usage analysis completed")
        
        self.results["metrics"]["system"] = self.analyze_system_resources()
        print("✓ System resource analysis completed")
        
        self.results["metrics"]["monitoring"] = self.analyze_monitoring_retention()
        print("✓ Monitoring retention analysis completed")
        
        # Save results
        with open('resource_analysis.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Print summary
        print("\nResource Analysis Summary:")
        for metric_name, metrics in self.results["metrics"].items():
            if "error" not in metrics:
                print(f"✅ {metric_name} analyzed successfully")
            else:
                print(f"❌ {metric_name} analysis failed")
        
        if self.results["recommendations"]:
            print("\nOptimization Recommendations:")
            for recommendation in self.results["recommendations"]:
                print(f"💡 {recommendation}")
        else:
            print("\n✅ No optimization recommendations found!")

if __name__ == "__main__":
    analyzer = ResourceAnalyzer()
    analyzer.run_analysis() 