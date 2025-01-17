#!/usr/bin/env python3
import time
import sys
from health_check import main as health_check

def monitor(interval: int = 60):
    """Monitor services continuously."""
    while True:
        try:
            health_check()
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nMonitoring stopped")
            sys.exit(0)
        except Exception as e:
            print(f"Monitor error: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    interval = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    monitor(interval) 