"""Deployment test suite for validating cloud infrastructure and deployment."""
import pytest
import asyncio
import boto3
import aiohttp
from typing import Dict, Any, List
import json
import logging
from pathlib import Path

from ..performance_system import PerformanceMonitor
from ..quality_system import QualitySystem

class DeploymentTests:
    """Tests for validating cloud deployment and infrastructure."""
    
    def __init__(self, 
                 aws_region: str = "us-west-2",
                 stage: str = "dev"):
        """Initialize deployment tests.
        
        Args:
            aws_region: AWS region for deployment
            stage: Deployment stage (dev/staging/prod)
        """
        self.region = aws_region
        self.stage = stage
        self.monitor = PerformanceMonitor()
        self.quality = QualitySystem()
        
        # AWS clients
        self.ec2 = boto3.client('ec2', region_name=aws_region)
        self.ecs = boto3.client('ecs', region_name=aws_region)
        self.logs = boto3.client('logs', region_name=aws_region)
        
    async def test_infrastructure(self):
        """Test AWS infrastructure deployment."""
        # Verify ECS cluster
        clusters = self.ecs.list_clusters()
        cluster_name = f"rag-cluster-{self.stage}"
        assert any(cluster_name in arn for arn in clusters['clusterArns']), \
            f"Cluster {cluster_name} not found"
            
        # Verify ECS services
        services = self.ecs.list_services(cluster=cluster_name)
        required_services = [
            f"rag-api-{self.stage}",
            f"rag-worker-{self.stage}"
        ]
        for service in required_services:
            assert any(service in arn for arn in services['serviceArns']), \
                f"Service {service} not found"
                
        # Verify EC2 instances
        instances = self.ec2.describe_instances(
            Filters=[{'Name': 'tag:Environment', 'Values': [self.stage]}]
        )
        assert len(instances['Reservations']) > 0, "No EC2 instances found"
        
    async def test_api_endpoints(self):
        """Test deployed API endpoints."""
        base_url = f"https://api-{self.stage}.rag-system.com"
        
        async with aiohttp.ClientSession() as session:
            # Test health endpoint
            async with session.get(f"{base_url}/health") as resp:
                assert resp.status == 200
                data = await resp.json()
                assert data['status'] == 'healthy'
            
            # Test chat endpoint
            message = "Test deployment message"
            async with session.post(
                f"{base_url}/chat",
                json={'message': message}
            ) as resp:
                assert resp.status == 200
                data = await resp.json()
                assert 'response' in data
                
                # Validate response quality
                quality_score = await self.quality.evaluate_response(
                    query=message,
                    response=data['response']
                )
                assert quality_score > 0.8, "Response quality below threshold"
                
    async def test_logging(self):
        """Test logging infrastructure."""
        log_group = f"/ecs/rag-system-{self.stage}"
        
        # Verify log group exists
        log_groups = self.logs.describe_log_groups(
            logGroupNamePrefix=log_group
        )
        assert len(log_groups['logGroups']) > 0, f"Log group {log_group} not found"
        
        # Verify recent logs
        streams = self.logs.describe_log_streams(
            logGroupName=log_group,
            orderBy='LastEventTime',
            descending=True,
            limit=1
        )
        
        if streams['logStreams']:
            stream = streams['logStreams'][0]
            logs = self.logs.get_log_events(
                logGroupName=log_group,
                logStreamName=stream['logStreamName'],
                limit=10
            )
            assert len(logs['events']) > 0, "No recent logs found"
            
    async def test_performance(self):
        """Test deployment performance."""
        base_url = f"https://api-{self.stage}.rag-system.com"
        
        async with aiohttp.ClientSession() as session:
            # Test latency
            start_time = asyncio.get_event_loop().time()
            async with session.get(f"{base_url}/health") as resp:
                latency = asyncio.get_event_loop().time() - start_time
                assert latency < 0.5, f"High latency: {latency}s"
            
            # Test concurrent requests
            async def make_request():
                async with session.post(
                    f"{base_url}/chat",
                    json={'message': 'Test concurrent requests'}
                ) as resp:
                    return resp.status
                    
            tasks = [make_request() for _ in range(10)]
            results = await asyncio.gather(*tasks)
            assert all(status == 200 for status in results), \
                "Failed concurrent requests"
                
            # Collect metrics
            metrics = await self.monitor.collect_deployment_metrics()
            assert metrics['cpu_utilization'] < 80, "High CPU utilization"
            assert metrics['memory_utilization'] < 80, "High memory utilization"
            
# Test fixtures
@pytest.fixture
async def deployment_tests():
    """Create deployment test instance."""
    return DeploymentTests()

# Test cases
@pytest.mark.asyncio
async def test_infrastructure(deployment_tests):
    """Test AWS infrastructure."""
    await deployment_tests.test_infrastructure()
    
@pytest.mark.asyncio
async def test_api(deployment_tests):
    """Test API endpoints."""
    await deployment_tests.test_api_endpoints()
    
@pytest.mark.asyncio
async def test_logging(deployment_tests):
    """Test logging infrastructure."""
    await deployment_tests.test_logging()
    
@pytest.mark.asyncio
async def test_performance(deployment_tests):
    """Test deployment performance."""
    await deployment_tests.test_performance() 