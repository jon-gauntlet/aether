#!/usr/bin/env python3
# Aether WebSocket Service Health Check
# 

import asyncio
import json
import logging
import os
import sys
import time
from typing import Dict, List, Optional

import aiohttp
import websockets
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
WS_HOST = os.getenv('AETHER_WS_HOST', '127.0.0.1')
WS_PORT = int(os.getenv('AETHER_WS_PORT', '8000'))
WS_PATH = os.getenv('AETHER_WS_PATH', '/ws')
HEALTH_ENDPOINT = f'http://{WS_HOST}:{WS_PORT}/health'
METRICS_ENDPOINT = f'http://{WS_HOST}:{WS_PORT}/metrics'

class HealthCheck:
    def __init__(self):
        self.session = None
        self.ws = None
        self.connected = False
        self.errors: List[str] = []
        
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Clean up resources"""
        if self.ws:
            await self.ws.close()
        if self.session:
            await self.session.close()
            
    async def check_http_endpoint(self, url: str) -> bool:
        """Check if an HTTP endpoint is responding"""
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Endpoint {url} check passed: {data}")
                    return True
                else:
                    self.errors.append(f"Endpoint {url} returned status {response.status}")
                    return False
        except Exception as e:
            self.errors.append(f"Failed to connect to {url}: {str(e)}")
            return False
            
    async def check_websocket_connection(self) -> bool:
        """Test WebSocket connection and basic functionality"""
        ws_url = f"ws://{WS_HOST}:{WS_PORT}{WS_PATH}"
        try:
            self.ws = await websockets.connect(ws_url)
            self.connected = True
            
            # Send test message
            test_message = json.dumps({"type": "ping", "data": {"timestamp": time.time()}})
            await self.ws.send(test_message)
            
            # Wait for response
            response = await asyncio.wait_for(self.ws.recv(), timeout=5.0)
            response_data = json.loads(response)
            
            if response_data.get("type") == "pong":
                logger.info("WebSocket connection test passed")
                return True
            else:
                self.errors.append("WebSocket response type mismatch")
                return False
                
        except Exception as e:
            self.errors.append(f"WebSocket connection failed: {str(e)}")
            return False
            
    async def check_metrics(self) -> bool:
        """Verify metrics endpoint and check key metrics"""
        try:
            async with self.session.get(METRICS_ENDPOINT) as response:
                if response.status == 200:
                    metrics = await response.json()
                    
                    # Check required metrics
                    required_metrics = [
                        "active_connections",
                        "messages_sent",
                        "messages_received",
                        "errors",
                        "system_memory",
                        "system_cpu"
                    ]
                    
                    missing_metrics = [m for m in required_metrics if m not in metrics]
                    
                    if not missing_metrics:
                        logger.info("Metrics check passed")
                        return True
                    else:
                        self.errors.append(f"Missing metrics: {', '.join(missing_metrics)}")
                        return False
                else:
                    self.errors.append(f"Metrics endpoint returned status {response.status}")
                    return False
        except Exception as e:
            self.errors.append(f"Failed to check metrics: {str(e)}")
            return False
            
    async def run_checks(self) -> bool:
        """Run all health checks"""
        try:
            await self.setup()
            
            # Run checks
            health_check = await self.check_http_endpoint(HEALTH_ENDPOINT)
            websocket_check = await self.check_websocket_connection()
            metrics_check = await self.check_metrics()
            
            # Log results
            logger.info("Health Check Results:")
            logger.info(f"- Health Endpoint: {'✓' if health_check else '✗'}")
            logger.info(f"- WebSocket Connection: {'✓' if websocket_check else '✗'}")
            logger.info(f"- Metrics: {'✓' if metrics_check else '✗'}")
            
            if self.errors:
                logger.error("Errors encountered:")
                for error in self.errors:
                    logger.error(f"- {error}")
                    
            return all([health_check, websocket_check, metrics_check])
            
        finally:
            await self.cleanup()
            
def main():
    """Main entry point"""
    health_check = HealthCheck()
    success = asyncio.run(health_check.run_checks())
    
    if success:
        logger.info("All health checks passed")
        sys.exit(0)
    else:
        logger.error("Health checks failed")
        sys.exit(1)
        
if __name__ == "__main__":
    main() 