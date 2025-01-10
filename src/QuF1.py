import os
import sys
import asyncio
import logging
from typing import Dict, Optional, List, Any
import json
import psutil
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime, timedelta

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from lib.llm.manager import LLMManager
from lib.autonomic.manager import AutonomicManager

# Configure logging
log_dir = Path('/home/jon/.local/share/cursor/logs')
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'llm_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('llm_service')

@dataclass
class ModelConfig:
    name: str
    version: str
    memory_requirements_gb: float
    capabilities: List[str]
    parameters: Dict[str, Any]
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ModelConfig':
        required_fields = {'name', 'version', 'memory_requirements_gb', 'capabilities'}
        missing_fields = required_fields - set(data.keys())
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
            
        return cls(
            name=data['name'],
            version=data['version'],
            memory_requirements_gb=float(data['memory_requirements_gb']),
            capabilities=data.get('capabilities', []),
            parameters=data.get('parameters', {})
        )

@dataclass
class ResourceLimits:
    max_memory_gb: float = 4.0
    max_cpu_percent: float = 30.0
    max_models_loaded: int = 2
    # Extended work period support
    min_memory_reserve: float = 1.0  # Keep buffer for stability
    cpu_throttle_threshold: float = 25.0  # Throttle before max
    performance_degradation_threshold: float = 0.7  # Acceptable performance floor
    # Dynamic resource management
    memory_scale_factor: float = 1.2  # Allow temporary memory scaling
    cpu_scale_factor: float = 1.5  # Allow temporary CPU scaling
    scale_duration: timedelta = timedelta(minutes=30)  # How long to maintain scaled limits
    cooldown_period: timedelta = timedelta(hours=1)  # Time between scaling events
    
@dataclass
class ResourceState:
    """Tracks current resource state and scaling."""
    current_memory_limit: float
    current_cpu_limit: float
    last_scale_time: Optional[datetime] = None
    scale_expiry: Optional[datetime] = None
    is_scaled: bool = False
    
    @property
    def can_scale(self) -> bool:
        """Check if scaling is allowed."""
        if not self.last_scale_time:
            return True
        return datetime.now() - self.last_scale_time > self.cooldown_period
        
    def update_limits(self, memory_gb: float, cpu_percent: float):
        """Update current resource limits."""
        self.current_memory_limit = memory_gb
        self.current_cpu_limit = cpu_percent
        
class ModelUsagePredictor:
    """Predicts model usage patterns for preemptive loading."""
    
    def __init__(self):
        self.usage_history: List[Dict] = []
        self.prediction_window: timedelta = timedelta(hours=24)
        self.min_confidence: float = 0.7
        
    def record_usage(self, model_name: str, timestamp: datetime):
        """Record model usage for pattern detection."""
        self.usage_history.append({
            'model': model_name,
            'time': timestamp
        })
        
        # Cleanup old history
        cutoff = datetime.now() - self.prediction_window
        self.usage_history = [
            h for h in self.usage_history
            if h['time'] > cutoff
        ]
        
    def predict_next_model(self) -> Optional[str]:
        """Predict next model likely to be needed."""
        if len(self.usage_history) < 5:  # Need minimum history
            return None
            
        # Group by model
        model_patterns = {}
        for i in range(len(self.usage_history) - 1):
            current = self.usage_history[i]
            next_model = self.usage_history[i + 1]['model']
            
            if current['model'] not in model_patterns:
                model_patterns[current['model']] = {}
            
            patterns = model_patterns[current['model']]
            patterns[next_model] = patterns.get(next_model, 0) + 1
            
        # Find most likely next model
        if not self.usage_history:
            return None
            
        current_model = self.usage_history[-1]['model']
        if current_model not in model_patterns:
            return None
            
        patterns = model_patterns[current_model]
        if not patterns:
            return None
            
        total = sum(patterns.values())
        most_likely = max(patterns.items(), key=lambda x: x[1])
        confidence = most_likely[1] / total
        
        if confidence >= self.min_confidence:
            return most_likely[0]
        return None

@dataclass
class WorkloadMetrics:
    start_time: datetime
    total_requests: int = 0
    error_count: int = 0
    avg_response_time: float = 0.0
    quality_score: float = 1.0
    fatigue_indicator: float = 0.0
    
    def update_metrics(self, response_time: float, had_error: bool, quality: float):
        self.total_requests += 1
        if had_error:
            self.error_count += 1
        
        # Exponential moving average for response time
        alpha = 0.1
        self.avg_response_time = (alpha * response_time + 
                                (1 - alpha) * self.avg_response_time)
        
        # Update quality score with decay
        self.quality_score = min(1.0, 0.95 * self.quality_score + 0.05 * quality)
        
        # Calculate fatigue based on time and error rate
        hours_running = (datetime.now() - self.start_time).total_seconds() / 3600
        error_rate = self.error_count / max(1, self.total_requests)
        self.fatigue_indicator = min(1.0, (hours_running * error_rate) / 24)

class ModelLoadError(Exception):
    """Raised when model loading fails."""
    pass

class ConfigurationError(Exception):
    """Raised when model configuration is invalid."""
    pass

class LLMService:
    def __init__(self, model_path: str = "/home/jon/ai_system_evolution/data/models"):
        self.model_path = model_path
        self.models: Dict[str, Any] = {}
        self.active_model: Optional[str] = None
        self.limits = ResourceLimits()
        self._load_lock = asyncio.Lock()
        self.manager = LLMManager()
        self.autonomic = AutonomicManager()
        self.workload_metrics = WorkloadMetrics(start_time=datetime.now())
        self.autonomic_manager = AutonomicManager()
        self.resource_state = ResourceState(
            current_memory_limit=self.limits.max_memory_gb,
            current_cpu_limit=self.limits.max_cpu_percent
        )
        self.usage_predictor = ModelUsagePredictor()
        
    async def initialize(self) -> None:
        """Initialize service during system idle time."""
        try:
            await self.manager.initialize()
            await self.autonomic_manager.initialize()
            if await self._is_system_idle():
                async with self._load_lock:
                    await self._load_models()
        except Exception as e:
            logger.error(f"Failed to initialize service: {e}")
            raise

    async def shutdown(self) -> None:
        """Gracefully shutdown the service."""
        try:
            async with self._load_lock:
                for model_name in list(self.models.keys()):
                    await self._unload_model(model_name)
            await self.manager.shutdown()
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
            raise

    async def _unload_model(self, model_name: str) -> None:
        """Properly unload and cleanup a model."""
        if model_name not in self.models:
            return
            
        try:
            model = self.models[model_name]
            await self.manager.unload_model(model)
            del self.models[model_name]
            if self.active_model == model_name:
                self.active_model = None
            logger.info(f"Successfully unloaded model {model_name}")
        except Exception as e:
            logger.error(f"Error unloading model {model_name}: {e}")
            raise

    async def _is_system_idle(self) -> bool:
        """Check if system is idle enough for model loading."""
        cpu_percent = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        mem_available_gb = mem.available / (1024 * 1024 * 1024)
        
        return (cpu_percent < self.limits.max_cpu_percent and 
                mem_available_gb > self.limits.max_memory_gb)
    
    async def _load_models(self) -> None:
        """Load models while respecting resource constraints."""
        for model in os.listdir(self.model_path):
            if len(self.models) >= self.limits.max_models_loaded:
                break
                
            if await self._can_load_model(model):
                try:
                    model_config = self._load_model_config(model)
                    if await self._validate_model_requirements(model_config):
                        self.models[model] = await self._load_model(model)
                except Exception as e:
                    print(f"Failed to load model {model}: {e}")
                    continue
    
    def _load_model_config(self, model_name: str) -> ModelConfig:
        """Load and validate model configuration."""
        config_path = Path(self.model_path) / model_name / "config.json"
        if not config_path.exists():
            raise ConfigurationError(f"No config found for model {model_name}")
            
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            return ModelConfig.from_dict(config_data)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in config for {model_name}: {e}")
        except ValueError as e:
            raise ConfigurationError(f"Invalid config for {model_name}: {e}")
    
    async def _validate_model_requirements(self, config: ModelConfig) -> bool:
        """Validate model requirements with fatigue consideration."""
        base_valid = await super()._validate_model_requirements(config)
        if not base_valid:
            return False
            
        # Check if we have enough reserve capacity
        system = psutil.Process()
        current_memory = system.memory_info().rss / (1024 * 1024 * 1024)
        memory_headroom = self.resource_limits.max_memory_gb - current_memory
        
        if memory_headroom < self.resource_limits.min_memory_reserve:
            logger.warning("Insufficient memory reserve for safe operation")
            return False
            
        # Adjust based on fatigue
        if self.workload_metrics.fatigue_indicator > 0.5:
            logger.info("Applying conservative resource checks due to fatigue")
            return (memory_headroom > 2 * self.resource_limits.min_memory_reserve and
                    system.cpu_percent() < self.resource_limits.cpu_throttle_threshold)
                    
        return True
        
    async def maintain_quality(self) -> None:
        """Maintain quality through extended operation."""
        if self.workload_metrics.quality_score < self.resource_limits.performance_degradation_threshold:
            logger.warning("Quality degradation detected - initiating recovery")
            await self._initiate_quality_recovery()
            
    async def _initiate_quality_recovery(self) -> None:
        """Recover from quality degradation."""
        # Unload non-essential models
        loaded_models = await self.get_model_info()
        for model in loaded_models:
            if not model.get('is_active', False):
                await self._unload_model(model['name'])
                
        # Force garbage collection
        import gc
        gc.collect()
        
        # Reset quality metrics
        self.workload_metrics = WorkloadMetrics(start_time=datetime.now())
        
        logger.info("Quality recovery complete - monitoring for stability")
    
    async def _can_load_model(self, model_name: str) -> bool:
        """Check if it's safe to load a model."""
        if model_name in self.models:
            return False
            
        mem = psutil.virtual_memory()
        mem_available_gb = mem.available / (1024 * 1024 * 1024)
        
        return mem_available_gb > self.limits.max_memory_gb
    
    async def _load_model(self, model_name: str) -> Any:
        """Load model implementation with proper error handling."""
        try:
            config = self._load_model_config(model_name)
            
            # Load model through manager
            model = await self.manager.load_model(
                model_path=str(Path(self.model_path) / model_name),
                config=config
            )
            
            logger.info(f"Successfully loaded model {model_name} v{config.version}")
            return model
            
        except Exception as e:
            raise ModelLoadError(f"Failed to load model {model_name}: {e}")
    
    async def get_model(self, model_name: str) -> Optional[any]:
        """Get a loaded model, loading it if necessary and possible."""
        # Record usage for prediction
        self.usage_predictor.record_usage(model_name, datetime.now())
        
        if model_name in self.models:
            self.active_model = model_name
            # Trigger preloading of next predicted model
            asyncio.create_task(self._preload_predicted_model())
            return self.models[model_name]
            
        async with self._load_lock:
            # Adjust resource limits before loading
            await self._adjust_resource_limits()
            
            if await self._can_load_model(model_name):
                try:
                    model_config = self._load_model_config(model_name)
                    if await self._validate_model_requirements(model_config):
                        self.models[model_name] = await self._load_model(model_name)
                        self.active_model = model_name
                        # Trigger preloading of next predicted model
                        asyncio.create_task(self._preload_predicted_model())
                        return self.models[model_name]
                except Exception as e:
                    logger.error(f"Failed to load model {model_name}: {e}")
                    return None
        return None
    
    async def unload_inactive_models(self) -> None:
        """Unload models that haven't been used recently to free resources."""
        if not self.active_model:
            return
            
        async with self._load_lock:
            for model_name in list(self.models.keys()):
                if model_name != self.active_model:
                    try:
                        await self._unload_model(model_name)
                    except Exception as e:
                        logger.error(f"Failed to unload model {model_name}: {e}")
    
    async def get_model_info(self) -> List[dict]:
        """Get information about all available models."""
        model_info = []
        for model_name in os.listdir(self.model_path):
            try:
                config = self._load_model_config(model_name)
                info = {
                    "name": model_name,
                    "loaded": model_name in self.models,
                    "active": model_name == self.active_model,
                    "requirements": config.get("memory_requirements_gb", 0),
                    "capabilities": config.get("capabilities", [])
                }
                model_info.append(info)
            except Exception as e:
                logger.error(f"Failed to get info for model {model_name}: {e}")
                continue
        return model_info

    async def _collect_metrics(self) -> Dict[str, float]:
        """Collect resource usage metrics."""
        process = psutil.Process()
        
        # Get model performance metrics
        model_metrics = await self._get_model_metrics()
        
        metrics = {
            "cpu_percent": process.cpu_percent(),
            "memory_gb": process.memory_info().rss / (1024 * 1024 * 1024),
            "models_loaded": len(self.models),
            "error_rate": model_metrics.get("error_rate", 0.0),
            "response_time": model_metrics.get("response_time", 0.0)
        }
        
        # Record metrics with autonomic manager
        await self.autonomic.record_metrics(metrics)
        
        return metrics
        
    async def _get_model_metrics(self) -> Dict[str, float]:
        """Get performance metrics for loaded models."""
        if not self.models:
            return {"error_rate": 0.0, "response_time": 0.0}
            
        total_errors = 0
        total_response_time = 0.0
        total_requests = 0
        
        for model in self.models.values():
            status = await model.get_status()
            if status:
                total_errors += status.get("error_count", 0)
                total_response_time += status.get("response_time", 0.0)
                total_requests += status.get("request_count", 0)
                
        if total_requests > 0:
            return {
                "error_rate": total_errors / total_requests,
                "response_time": total_response_time / total_requests
            }
        return {"error_rate": 0.0, "response_time": 0.0}

    async def _adjust_resource_limits(self) -> None:
        """Dynamically adjust resource limits based on workload."""
        # Check if we're in a high-demand period
        is_hyperfocus = await self.autonomic_manager.detect_hyperfocus_state(
            self.workload_metrics.__dict__
        )
        
        if is_hyperfocus and self.resource_state.can_scale:
            # Scale up resources temporarily
            self.resource_state.update_limits(
                memory_gb=self.limits.max_memory_gb * self.limits.memory_scale_factor,
                cpu_percent=self.limits.max_cpu_percent * self.limits.cpu_scale_factor
            )
            self.resource_state.last_scale_time = datetime.now()
            self.resource_state.scale_expiry = datetime.now() + self.limits.scale_duration
            self.resource_state.is_scaled = True
            
        elif self.resource_state.is_scaled:
            # Check if scaling should be reverted
            if datetime.now() >= self.resource_state.scale_expiry:
                self.resource_state.update_limits(
                    memory_gb=self.limits.max_memory_gb,
                    cpu_percent=self.limits.max_cpu_percent
                )
                self.resource_state.is_scaled = False
                
    async def _preload_predicted_model(self) -> None:
        """Preemptively load the next predicted model."""
        predicted_model = self.usage_predictor.predict_next_model()
        if not predicted_model:
            return
            
        # Only preload if we have capacity
        if len(self.models) >= self.limits.max_models_loaded:
            return
            
        # Check if prediction is already loaded
        if predicted_model in self.models:
            return
            
        try:
            if await self._can_load_model(predicted_model):
                await self._load_model(predicted_model)
                logger.info(f"Preloaded predicted model: {predicted_model}")
        except Exception as e:
            logger.error(f"Failed to preload model {predicted_model}: {e}")
            
async def main():
    """Service entry point."""
    service = LLMService()
    try:
        await service.initialize()
        
        while True:
            if service.models:
                metrics = await service._collect_metrics()
                logger.info(f"Service metrics: {metrics}")
                
                # Check evolution status
                if await service.autonomic.should_evolve():
                    logger.info("Evolution criteria met - optimizing system")
                    if metrics["memory_gb"] > service.limits.max_memory_gb:
                        await service.unload_inactive_models()
                    await service.autonomic.record_evolution()
                    
            await asyncio.sleep(60)  # Check every minute
            
    except Exception as e:
        logger.error(f"Service error: {e}")
        raise
    finally:
        await service.shutdown()

if __name__ == "__main__":
    asyncio.run(main()) 