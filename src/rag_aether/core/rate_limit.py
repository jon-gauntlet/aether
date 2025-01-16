"""Rate limiting implementation for RAG system."""
from typing import Dict, Any, Optional
import time
import asyncio
from dataclasses import dataclass
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import RateLimitError
from rag_aether.core.performance import with_performance_monitoring

logger = get_logger("rate_limit")

@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    requests_per_second: float = 10.0
    burst_size: int = 50
    max_delay: float = 5.0
    min_delay: float = 0.1

class TokenBucket:
    """Token bucket rate limiter implementation."""
    
    def __init__(
        self,
        rate: float,
        capacity: int,
        initial_tokens: Optional[int] = None
    ):
        """Initialize token bucket."""
        self.rate = rate
        self.capacity = capacity
        self.tokens = initial_tokens if initial_tokens is not None else capacity
        self.last_update = time.monotonic()
        self.total_requests = 0
        self.delayed_requests = 0
        
    def update(self) -> None:
        """Update token count based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self.last_update
        self.tokens = min(
            self.capacity,
            self.tokens + elapsed * self.rate
        )
        self.last_update = now
        
    async def acquire(self, tokens: int = 1) -> float:
        """Acquire tokens and return delay if needed."""
        self.update()
        
        if tokens > self.capacity:
            raise ValueError(
                f"Requested tokens ({tokens}) exceeds capacity ({self.capacity})"
            )
            
        delay = 0.0
        if tokens > self.tokens:
            # Calculate required delay
            delay = (tokens - self.tokens) / self.rate
            self.delayed_requests += 1
            await asyncio.sleep(delay)
            self.update()
            
        self.tokens -= tokens
        self.total_requests += 1
        return delay

class RateLimiter:
    """Rate limiter with configuration and metrics."""
    
    def __init__(
        self,
        config: Optional[RateLimitConfig] = None,
        name: str = "default"
    ):
        """Initialize rate limiter."""
        self.config = config or RateLimitConfig()
        self.name = name
        self.bucket = TokenBucket(
            rate=self.config.requests_per_second,
            capacity=self.config.burst_size
        )
        logger.info(
            f"Initialized rate limiter: {name}",
            extra={
                "rate": self.config.requests_per_second,
                "burst_size": self.config.burst_size
            }
        )
        
    @with_performance_monitoring(operation="check", component="rate_limit")
    async def check_rate_limit(self, tokens: int = 1) -> None:
        """Check rate limit and delay if needed."""
        try:
            delay = await self.bucket.acquire(tokens)
            
            if delay > self.config.max_delay:
                raise RateLimitError(
                    f"Rate limit exceeded for {self.name}",
                    operation="check",
                    component="rate_limit",
                    retry_after=delay
                )
                
            if delay > 0:
                logger.warning(
                    f"Rate limited {self.name}",
                    extra={
                        "delay": delay,
                        "tokens": tokens
                    }
                )
                
        except Exception as e:
            if not isinstance(e, RateLimitError):
                logger.error(f"Rate limit check failed: {str(e)}")
            raise
            
    def get_metrics(self) -> Dict[str, Any]:
        """Get rate limiter metrics."""
        return {
            "name": self.name,
            "total_requests": self.bucket.total_requests,
            "delayed_requests": self.bucket.delayed_requests,
            "current_tokens": self.bucket.tokens,
            "rate": self.config.requests_per_second,
            "burst_size": self.config.burst_size
        }

class RateLimitManager:
    """Manage multiple rate limiters."""
    
    def __init__(self):
        """Initialize rate limit manager."""
        self.limiters: Dict[str, RateLimiter] = {}
        logger.info("Initialized rate limit manager")
        
    def get_limiter(
        self,
        name: str,
        config: Optional[RateLimitConfig] = None
    ) -> RateLimiter:
        """Get or create rate limiter."""
        if name not in self.limiters:
            self.limiters[name] = RateLimiter(
                config=config,
                name=name
            )
        return self.limiters[name]
        
    async def check_rate_limits(
        self,
        limits: Dict[str, int]
    ) -> None:
        """Check multiple rate limits."""
        for name, tokens in limits.items():
            await self.get_limiter(name).check_rate_limit(tokens)
            
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all rate limiters."""
        return {
            name: limiter.get_metrics()
            for name, limiter in self.limiters.items()
        } 