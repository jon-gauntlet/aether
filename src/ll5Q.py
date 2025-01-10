import asyncio
import logging
import signal
import sys
from typing import Optional

from systemd import journal

from .manager import AutonomicManager

# Configure logging
log = logging.getLogger("autonomic")
log.addHandler(journal.JournalHandler())
log.setLevel(logging.INFO)

# Global manager instance
manager: Optional[AutonomicManager] = None

def handle_signal(signum, frame):
    """Handle termination signals."""
    log.info(f"Received signal {signum}")
    if manager:
        asyncio.create_task(manager.stop())

async def main():
    """Main entry point."""
    global manager
    
    try:
        # Register signal handlers
        signal.signal(signal.SIGTERM, handle_signal)
        signal.signal(signal.SIGINT, handle_signal)
        
        # Create and start manager
        manager = AutonomicManager()
        await manager.start()
        
        # Run until interrupted
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        log.info("Keyboard interrupt received")
    except Exception as e:
        log.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        if manager:
            await manager.stop()

if __name__ == "__main__":
    asyncio.run(main()) 