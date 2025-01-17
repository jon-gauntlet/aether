import redis
import sys
import os
from typing import Dict, Optional

def check_redis_connection(url: str) -> Dict[str, bool]:
    """Check Redis connection health."""
    try:
        r = redis.from_url(url)
        r.ping()
        return {"redis": True}
    except Exception as e:
        print(f"Redis connection failed: {e}", file=sys.stderr)
        return {"redis": False}

def check_backend_health(port: int = 3000) -> Dict[str, bool]:
    """Check backend service health."""
    try:
        import httpx
        response = httpx.get(f"http://localhost:{port}/health")
        return {"backend": response.status_code == 200}
    except Exception as e:
        print(f"Backend health check failed: {e}", file=sys.stderr)
        return {"backend": False}

def main():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    service_port = int(os.getenv("SERVICE_PORT", "3000"))
    
    health_status = {
        **check_redis_connection(redis_url),
        **check_backend_health(service_port)
    }
    
    # Print detailed status
    for service, status in health_status.items():
        print(f"{service}: {'✓' if status else '✗'}")
    
    if not all(health_status.values()):
        print("Health check failed!", file=sys.stderr)
        sys.exit(1)
    
    print("All systems operational")
    sys.exit(0)

if __name__ == "__main__":
    main() 