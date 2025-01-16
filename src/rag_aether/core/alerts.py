"""Alert implementation for RAG system."""
from typing import Dict, Any, List, Optional, Callable, Awaitable, Union
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from rag_aether.core.logging import get_logger
from rag_aether.core.errors import AlertError
from rag_aether.core.performance import with_performance_monitoring

logger = get_logger("alerts")

class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertState(Enum):
    """Alert state."""
    ACTIVE = "active"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"

@dataclass
class AlertRule:
    """Alert rule configuration."""
    name: str
    description: str
    severity: AlertSeverity
    condition: Callable[[Dict[str, Any]], bool]
    labels: Dict[str, str] = field(default_factory=dict)
    cooldown: timedelta = field(default_factory=lambda: timedelta(minutes=5))
    auto_resolve: bool = True
    resolve_condition: Optional[Callable[[Dict[str, Any]], bool]] = None

@dataclass
class Alert:
    """Alert instance."""
    rule_name: str
    severity: AlertSeverity
    state: AlertState
    message: str
    labels: Dict[str, str]
    metrics: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolution_message: Optional[str] = None

@dataclass
class AlertMetrics:
    """Metrics for alert processing."""
    total_alerts: int = 0
    active_alerts: int = 0
    resolved_alerts: int = 0
    acknowledged_alerts: int = 0
    by_severity: Dict[str, int] = field(default_factory=lambda: {
        severity.value: 0 for severity in AlertSeverity
    })

class AlertProcessor:
    """Process and track alerts."""
    
    def __init__(
        self,
        rule: AlertRule
    ):
        """Initialize alert processor."""
        self.rule = rule
        self.alerts: Dict[str, Alert] = {}
        self.last_alert: Optional[datetime] = None
        self.metrics = AlertMetrics()
        logger.info(
            f"Initialized alert processor: {rule.name}",
            extra={"severity": rule.severity.value}
        )
        
    def _can_alert(self) -> bool:
        """Check if alerting is allowed based on cooldown."""
        if not self.last_alert:
            return True
        return datetime.now() - self.last_alert > self.rule.cooldown
        
    def _create_alert(
        self,
        message: str,
        metrics: Dict[str, Any]
    ) -> Alert:
        """Create new alert."""
        now = datetime.now()
        alert = Alert(
            rule_name=self.rule.name,
            severity=self.rule.severity,
            state=AlertState.ACTIVE,
            message=message,
            labels=self.rule.labels.copy(),
            metrics=metrics.copy(),
            created_at=now,
            updated_at=now
        )
        
        self.metrics.total_alerts += 1
        self.metrics.active_alerts += 1
        self.metrics.by_severity[self.rule.severity.value] += 1
        
        return alert
        
    def _update_metrics(self, alert: Alert) -> None:
        """Update metrics based on alert state change."""
        if alert.state == AlertState.ACTIVE:
            self.metrics.active_alerts += 1
        elif alert.state == AlertState.RESOLVED:
            self.metrics.active_alerts -= 1
            self.metrics.resolved_alerts += 1
        elif alert.state == AlertState.ACKNOWLEDGED:
            self.metrics.acknowledged_alerts += 1
            
    @with_performance_monitoring(operation="process", component="alerts")
    def process_metrics(
        self,
        metrics: Dict[str, Any]
    ) -> Optional[Alert]:
        """Process metrics and generate alert if needed."""
        try:
            # Check if alert should be generated
            if self.rule.condition(metrics):
                if not self._can_alert():
                    return None
                    
                # Create new alert
                alert = self._create_alert(
                    message=f"Alert condition triggered for {self.rule.name}",
                    metrics=metrics
                )
                
                alert_id = f"{alert.rule_name}_{alert.created_at.isoformat()}"
                self.alerts[alert_id] = alert
                self.last_alert = alert.created_at
                
                logger.warning(
                    f"Alert generated: {self.rule.name}",
                    extra={
                        "severity": alert.severity.value,
                        "metrics": metrics
                    }
                )
                
                return alert
                
            # Check if existing alerts should be resolved
            if self.rule.auto_resolve:
                resolve_condition = (
                    self.rule.resolve_condition
                    if self.rule.resolve_condition
                    else lambda m: not self.rule.condition(m)
                )
                
                for alert in self.alerts.values():
                    if (
                        alert.state == AlertState.ACTIVE and
                        resolve_condition(metrics)
                    ):
                        self._resolve_alert(
                            alert,
                            "Alert condition resolved automatically"
                        )
                        
            return None
            
        except Exception as e:
            logger.error(f"Error processing metrics for {self.rule.name}: {str(e)}")
            raise AlertError(
                f"Alert processing failed: {str(e)}",
                operation="process_metrics",
                component="alerts"
            )
            
    def acknowledge_alert(
        self,
        alert_id: str,
        acknowledged_by: str,
        message: Optional[str] = None
    ) -> None:
        """Acknowledge alert."""
        if alert_id not in self.alerts:
            raise ValueError(f"Alert not found: {alert_id}")
            
        alert = self.alerts[alert_id]
        if alert.state != AlertState.ACTIVE:
            raise ValueError(f"Alert cannot be acknowledged: {alert.state}")
            
        alert.state = AlertState.ACKNOWLEDGED
        alert.acknowledged_at = datetime.now()
        alert.acknowledged_by = acknowledged_by
        if message:
            alert.message = message
            
        self._update_metrics(alert)
        logger.info(
            f"Alert acknowledged: {alert_id}",
            extra={"acknowledged_by": acknowledged_by}
        )
        
    def resolve_alert(
        self,
        alert_id: str,
        message: Optional[str] = None
    ) -> None:
        """Resolve alert."""
        if alert_id not in self.alerts:
            raise ValueError(f"Alert not found: {alert_id}")
            
        alert = self.alerts[alert_id]
        if alert.state == AlertState.RESOLVED:
            return
            
        self._resolve_alert(alert, message)
        
    def _resolve_alert(
        self,
        alert: Alert,
        message: Optional[str] = None
    ) -> None:
        """Internal method to resolve alert."""
        alert.state = AlertState.RESOLVED
        alert.resolved_at = datetime.now()
        if message:
            alert.resolution_message = message
            
        self._update_metrics(alert)
        logger.info(
            f"Alert resolved: {alert.rule_name}",
            extra={"resolution": message or ""}
        )
        
    def get_metrics(self) -> Dict[str, Any]:
        """Get processor metrics."""
        return {
            "rule_name": self.rule.name,
            "total_alerts": self.metrics.total_alerts,
            "active_alerts": self.metrics.active_alerts,
            "resolved_alerts": self.metrics.resolved_alerts,
            "acknowledged_alerts": self.metrics.acknowledged_alerts,
            "by_severity": self.metrics.by_severity
        }

class AlertManager:
    """Manage system alerts."""
    
    def __init__(self):
        """Initialize alert manager."""
        self.processors: Dict[str, AlertProcessor] = {}
        self.handlers: List[Callable[[Alert], Awaitable[None]]] = []
        logger.info("Initialized alert manager")
        
    def register_rule(
        self,
        rule: AlertRule
    ) -> AlertProcessor:
        """Register alert rule."""
        if rule.name in self.processors:
            raise ValueError(f"Alert rule already exists: {rule.name}")
            
        processor = AlertProcessor(rule)
        self.processors[rule.name] = processor
        return processor
        
    def register_handler(
        self,
        handler: Callable[[Alert], Awaitable[None]]
    ) -> None:
        """Register alert handler."""
        self.handlers.append(handler)
        
    @with_performance_monitoring(operation="process", component="alerts")
    async def process_metrics(
        self,
        metrics: Dict[str, Any]
    ) -> List[Alert]:
        """Process metrics for all rules."""
        alerts = []
        
        for processor in self.processors.values():
            try:
                alert = processor.process_metrics(metrics)
                if alert:
                    alerts.append(alert)
                    # Call handlers
                    for handler in self.handlers:
                        try:
                            await handler(alert)
                        except Exception as e:
                            logger.error(
                                f"Error in alert handler: {str(e)}",
                                extra={"alert": alert.rule_name}
                            )
                            
            except Exception as e:
                logger.error(f"Error processing metrics: {str(e)}")
                
        return alerts
        
    def acknowledge_alert(
        self,
        rule_name: str,
        alert_id: str,
        acknowledged_by: str,
        message: Optional[str] = None
    ) -> None:
        """Acknowledge alert."""
        if rule_name not in self.processors:
            raise ValueError(f"Alert rule not found: {rule_name}")
            
        self.processors[rule_name].acknowledge_alert(
            alert_id,
            acknowledged_by,
            message
        )
        
    def resolve_alert(
        self,
        rule_name: str,
        alert_id: str,
        message: Optional[str] = None
    ) -> None:
        """Resolve alert."""
        if rule_name not in self.processors:
            raise ValueError(f"Alert rule not found: {rule_name}")
            
        self.processors[rule_name].resolve_alert(alert_id, message)
        
    def get_active_alerts(
        self,
        severity: Optional[AlertSeverity] = None
    ) -> List[Alert]:
        """Get active alerts."""
        alerts = []
        for processor in self.processors.values():
            for alert in processor.alerts.values():
                if alert.state == AlertState.ACTIVE:
                    if not severity or alert.severity == severity:
                        alerts.append(alert)
        return alerts
        
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all processors."""
        return {
            name: processor.get_metrics()
            for name, processor in self.processors.items()
        } 