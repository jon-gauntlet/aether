"""Alert system for monitoring metrics and errors."""
import asyncio
from typing import Dict, Any, List, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from rag_aether.core.logging import get_logger

logger = get_logger("alerts")

@dataclass
class AlertRule:
    """Rule for triggering alerts."""
    name: str
    description: str
    metric_path: str  # Dot-separated path to metric (e.g. "metrics.cpu_percent")
    condition: str  # One of: "gt", "lt", "eq", "ne"
    threshold: float
    window_minutes: int = 5
    cooldown_minutes: int = 15
    severity: str = "warning"  # One of: "info", "warning", "error", "critical"
    last_triggered: Optional[datetime] = None

@dataclass
class Alert:
    """Alert instance."""
    rule: AlertRule
    timestamp: datetime
    value: float
    context: Dict[str, Any] = field(default_factory=dict)

class AlertManager:
    """Manager for alert rules and notifications."""
    
    def __init__(
        self,
        config_path: Optional[Path] = None,
        alert_dir: Optional[Path] = None
    ):
        self.alert_dir = alert_dir or Path("alerts")
        self.alert_dir.mkdir(exist_ok=True)
        self.rules: List[AlertRule] = []
        self.handlers: Dict[str, List[Callable[[Alert], Awaitable[None]]]] = {
            "info": [],
            "warning": [],
            "error": [],
            "critical": []
        }
        
        # Load config if provided
        if config_path and config_path.exists():
            self.load_config(config_path)
            
        # Set up default email handler if configured
        if all(k in os.environ for k in ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"]):
            self.setup_email_handler()
    
    def load_config(self, config_path: Path):
        """Load alert rules from config file."""
        try:
            with open(config_path) as f:
                config = json.load(f)
            
            for rule in config.get("rules", []):
                self.add_rule(AlertRule(**rule))
                
        except Exception as e:
            logger.error(f"Failed to load alert config: {str(e)}")
    
    def add_rule(self, rule: AlertRule):
        """Add alert rule."""
        self.rules.append(rule)
        logger.info(f"Added alert rule: {rule.name}")
    
    def add_handler(
        self,
        severity: str,
        handler: Callable[[Alert], Awaitable[None]]
    ):
        """Add alert handler for severity level."""
        if severity in self.handlers:
            self.handlers[severity].append(handler)
            logger.info(f"Added {severity} alert handler")
    
    def setup_email_handler(self):
        """Set up email alert handler."""
        async def email_handler(alert: Alert):
            try:
                msg = MIMEMultipart()
                msg["Subject"] = f"[{alert.rule.severity.upper()}] {alert.rule.name}"
                msg["From"] = os.environ["SMTP_USER"]
                msg["To"] = os.environ.get("ALERT_EMAIL", os.environ["SMTP_USER"])
                
                body = f"""
                Alert: {alert.rule.name}
                Severity: {alert.rule.severity}
                Time: {alert.timestamp}
                Description: {alert.rule.description}
                Value: {alert.value} (threshold: {alert.rule.threshold})
                
                Context:
                {json.dumps(alert.context, indent=2)}
                """
                
                msg.attach(MIMEText(body, "plain"))
                
                with smtplib.SMTP(
                    os.environ["SMTP_HOST"],
                    int(os.environ["SMTP_PORT"])
                ) as server:
                    server.starttls()
                    server.login(
                        os.environ["SMTP_USER"],
                        os.environ["SMTP_PASS"]
                    )
                    server.send_message(msg)
                    
                logger.info(f"Sent email alert: {alert.rule.name}")
                
            except Exception as e:
                logger.error(f"Failed to send email alert: {str(e)}")
        
        # Add email handler for warning and above
        for severity in ["warning", "error", "critical"]:
            self.add_handler(severity, email_handler)
    
    def setup_slack_handler(self, webhook_url: str):
        """Set up Slack alert handler."""
        async def slack_handler(alert: Alert):
            try:
                import aiohttp
                
                message = {
                    "text": f"*[{alert.rule.severity.upper()}] {alert.rule.name}*\n"
                           f"Time: {alert.timestamp}\n"
                           f"Description: {alert.rule.description}\n"
                           f"Value: {alert.value} (threshold: {alert.rule.threshold})\n\n"
                           f"Context:\n```{json.dumps(alert.context, indent=2)}```"
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(webhook_url, json=message) as resp:
                        if resp.status != 200:
                            raise Exception(f"Slack API error: {resp.status}")
                
                logger.info(f"Sent Slack alert: {alert.rule.name}")
                
            except Exception as e:
                logger.error(f"Failed to send Slack alert: {str(e)}")
        
        # Add Slack handler for warning and above
        for severity in ["warning", "error", "critical"]:
            self.add_handler(severity, slack_handler)
    
    async def check_value(
        self,
        rule: AlertRule,
        value: float,
        context: Dict[str, Any]
    ) -> Optional[Alert]:
        """Check if value triggers alert rule."""
        triggered = False
        
        if rule.condition == "gt":
            triggered = value > rule.threshold
        elif rule.condition == "lt":
            triggered = value < rule.threshold
        elif rule.condition == "eq":
            triggered = abs(value - rule.threshold) < 1e-6
        elif rule.condition == "ne":
            triggered = abs(value - rule.threshold) >= 1e-6
            
        if triggered:
            # Check cooldown
            if rule.last_triggered:
                cooldown = timedelta(minutes=rule.cooldown_minutes)
                if datetime.now() - rule.last_triggered < cooldown:
                    return None
            
            # Create alert
            alert = Alert(
                rule=rule,
                timestamp=datetime.now(),
                value=value,
                context=context
            )
            
            # Update last triggered
            rule.last_triggered = alert.timestamp
            
            return alert
            
        return None
    
    async def process_metrics(self, metrics: Dict[str, Any]):
        """Process metrics and trigger alerts."""
        for rule in self.rules:
            try:
                # Get metric value using path
                value = metrics
                for key in rule.metric_path.split("."):
                    value = value[key]
                
                if not isinstance(value, (int, float)):
                    continue
                
                # Check alert condition
                alert = await self.check_value(rule, float(value), metrics)
                
                if alert:
                    # Save alert
                    await self._save_alert(alert)
                    
                    # Trigger handlers
                    for handler in self.handlers[rule.severity]:
                        try:
                            await handler(alert)
                        except Exception as e:
                            logger.error(f"Alert handler error: {str(e)}")
                    
            except Exception as e:
                logger.error(f"Error processing rule {rule.name}: {str(e)}")
    
    async def _save_alert(self, alert: Alert):
        """Save alert to file."""
        try:
            data = {
                "timestamp": alert.timestamp.isoformat(),
                "rule": alert.rule.name,
                "severity": alert.rule.severity,
                "value": alert.value,
                "threshold": alert.rule.threshold,
                "context": alert.context
            }
            
            file_path = self.alert_dir / f"alerts_{alert.timestamp.strftime('%Y%m%d')}.jsonl"
            with open(file_path, "a") as f:
                f.write(json.dumps(data) + "\n")
                
        except Exception as e:
            logger.error(f"Error saving alert: {str(e)}")

# Global alert manager instance
manager = AlertManager() 