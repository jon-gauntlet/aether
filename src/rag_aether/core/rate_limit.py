"""Rate limiting implementation for RAG system."""
from typing import Dict, Any, Optional, List, Tuple
import time
import asyncio
from dataclasses import dataclass
from collections import deque
from rag_aether.core.logging import get_logger
from rag_aether.core.performance import with_performance_monitoring, performance_section
from rag_aether.core.errors import RAGError

logger = get_logger("rate_limit")

@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    requests_per_second: float
    burst_size: int
    window_size: float = 60.0  # Window size in seconds
    max_delay: float = 5.0     # Maximum delay before rejection

class TokenBucket:
    """Token bucket rate limiter."""
    
    def __init__(
        self,
        rate: float,
        capacity: int
    ):
        """Initialize token bucket."""
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.time()
        logger.info(
            "Initialized token bucket",
            extra={
                "rate": rate,
                "capacity": capacity
            }
        )
    
    def _add_tokens(self) -> None:
        """Add tokens based on elapsed time."""
        now = time.time()
        elapsed = now - self.last_update
        new_tokens = elapsed * self.rate
        
        self.tokens = min(self.capacity, self.tokens + new_tokens)
        self.last_update = now
    
    async def acquire(self, tokens: int = 1) -> Tuple[bool, float]:
        """Try to acquire tokens."""
        self._add_tokens()
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True, 0.0
        else:
            # Calculate wait time
            missing_tokens = tokens - self.tokens
            wait_time = missing_tokens / self.rate
            return False, wait_time

class SlidingWindow:
    """Sliding window rate limiter."""
    
    def __init__(
        self,
        window_size: float,
        max_requests: int
    ):
        """Initialize sliding window."""
        self.window_size = window_size
        self.max_requests = max_requests
        self.requests: deque[float] = deque()
        logger.info(
            "Initialized sliding window",
            extra={
                "window_size": window_size,
                "max_requests": max_requests
            }
        )
    
    def _cleanup(self) -> None:
        """Remove expired timestamps."""
        now = time.time()
        while self.requests and now - self.requests[0] > self.window_size:
            self.requests.popleft()
    
    async def check_rate_limit(self) -> Tuple[bool, float]:
        """Check if request is allowed."""
        self._cleanup()
        
        if len(self.requests) < self.max_requests:
            self.requests.append(time.time())
            return True, 0.0
        else:
            # Calculate wait time
            wait_time = self.window_size - (time.time() - self.requests[0])
            return False, max(0, wait_time)

class RateLimiter:
    """Combined rate limiter using token bucket and sliding window."""
    
    def __init__(
        self,
        config: RateLimitConfig,
        component: str = "default"
    ):
        """Initialize rate limiter."""
        self.config = config
        self.component = component
        
        # Initialize limiters
        self.token_bucket = TokenBucket(
            rate=config.requests_per_second,
            capacity=config.burst_size
        )
        self.sliding_window = SlidingWindow(
            window_size=config.window_size,
            max_requests=int(config.requests_per_second * config.window_size)
        )
        
        # Track metrics
        self.total_requests = 0
        self.rejected_requests = 0
        self.delayed_requests = 0
        self.total_delay = 0.0
        
        logger.info(
            "Initialized rate limiter",
            extra={
                "component": component,
                "config": vars(config)
            }
        )
    
    @with_performance_monitoring(operation="check", component="rate_limiter")
    async def check_rate_limit(self) -> None:
        """Check rate limit and wait if needed."""
        try:
            self.total_requests += 1
            
            # Check token bucket first
            allowed, wait_time = await self.token_bucket.acquire()
            if not allowed:
                # Check sliding window as backup
                allowed, window_wait = await self.sliding_window.check_rate_limit()
                wait_time = max(wait_time, window_wait)
            
            if wait_time > 0:
                if wait_time > self.config.max_delay:
                    self.rejected_requests += 1
                    raise RAGError(
                        "Rate limit exceeded",
                        operation="check_rate_limit",
                        component=self.component,
                        details={
                            "wait_time": wait_time,
                            "max_delay": self.config.max_delay
                        }
                    )
                
                self.delayed_requests += 1
                self.total_delay += wait_time
                
                logger.warning(
                    "Rate limit delay",
                    extra={
                        "wait_time": wait_time,
                        "component": self.component
                    }
                )
                
                await asyncio.sleep(wait_time)
            
        except Exception as e:
            if not isinstance(e, RAGError):
                logger.error(f"Rate limit check failed: {str(e)}")
                raise RAGError(
                    f"Rate limit check failed: {str(e)}",
                    operation="check_rate_limit",
                    component=self.component
                )
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get rate limiter metrics."""
        return {
            "total_requests": self.total_requests,
            "rejected_requests": self.rejected_requests,
            "delayed_requests": self.delayed_requests,
            "avg_delay": (
                self.total_delay / self.delayed_requests
                if self.delayed_requests > 0
                else 0.0
            ),
            "rejection_rate": (
                self.rejected_requests / self.total_requests
                if self.total_requests > 0
                else 0.0
            )
        }

class RateLimitManager:
    """Manage rate limiters for different components."""
    
    def __init__(self):
        """Initialize rate limit manager."""
        self.limiters: Dict[str, RateLimiter] = {}
        self.default_configs = {
            "embedding": RateLimitConfig(
                requests_per_second=10.0,
                burst_size=20,
                window_size=60.0
            ),
            "retrieval": RateLimitConfig(
                requests_per_second=5.0,
                burst_size=10,
                window_size=60.0
            ),
            "ingestion": RateLimitConfig(
                requests_per_second=2.0,
                burst_size=5,
                window_size=60.0
            ),
            "default": RateLimitConfig(
                requests_per_second=20.0,
                burst_size=40,
                window_size=60.0
            )
        }
        logger.info("Initialized rate limit manager")
    
    def get_limiter(
        self,
        component: str,
        config: Optional[RateLimitConfig] = None
    ) -> RateLimiter:
        """Get or create rate limiter for component."""
        if component not in self.limiters:
            limiter_config = config or self.default_configs.get(
                component,
                self.default_configs["default"]
            )
            self.limiters[component] = RateLimiter(
                config=limiter_config,
                component=component
            )
        return self.limiters[component]
    
    def get_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all rate limiters."""
        return {
            component: limiter.get_metrics()
            for component, limiter in self.limiters.items()
        } 