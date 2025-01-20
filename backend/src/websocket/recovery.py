from typing import Dict, Set, Optional, List
import asyncio
import logging
from datetime import datetime, timedelta
from fastapi import WebSocket
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class RecoveryConfig(BaseModel):
    """Configuration for connection recovery."""
    session_timeout: int = 300  # 5 minutes
    max_missed_heartbeats: int = 3
    heartbeat_interval: int = 30  # seconds
    recovery_buffer_size: int = 100
    max_recovery_attempts: int = 3

class SessionState(BaseModel):
    """State information for a client session."""
    client_id: str
    user_id: str
    channel: str
    last_sequence: int = 0
    last_heartbeat: datetime = datetime.utcnow()
    missed_heartbeats: int = 0
    recovery_attempts: int = 0
    message_buffer: List[dict] = []

class RecoveryManager:
    """Manages WebSocket connection recovery and session state."""
    def __init__(self, config: Optional[RecoveryConfig] = None):
        self.config = config or RecoveryConfig()
        self.sessions: Dict[str, SessionState] = {}
        self.sequence_numbers: Dict[str, int] = {}

    async def start(self):
        """Start the cleanup loop."""
        asyncio.create_task(self._cleanup_loop())

    async def register_session(
        self,
        client_id: str,
        user_id: str,
        channel: str
    ) -> SessionState:
        """Register a new client session."""
        session = SessionState(
            client_id=client_id,
            user_id=user_id,
            channel=channel
        )
        self.sessions[client_id] = session
        self.sequence_numbers[client_id] = 0
        return session

    async def update_heartbeat(self, client_id: str):
        """Update the last heartbeat time for a session."""
        if client_id in self.sessions:
            self.sessions[client_id].last_heartbeat = datetime.utcnow()
            self.sessions[client_id].missed_heartbeats = 0

    async def record_message(self, client_id: str, message: dict):
        """Record a message in the session buffer."""
        if client_id not in self.sessions:
            return
            
        session = self.sessions[client_id]
        
        # Add sequence number
        self.sequence_numbers[client_id] += 1
        message["sequence"] = self.sequence_numbers[client_id]
        session.last_sequence = self.sequence_numbers[client_id]
        
        # Add to buffer
        session.message_buffer.append(message)
        if len(session.message_buffer) > self.config.recovery_buffer_size:
            session.message_buffer.pop(0)

    async def can_recover(self, client_id: str) -> bool:
        """Check if a session can be recovered."""
        if client_id not in self.sessions:
            return False
            
        session = self.sessions[client_id]
        now = datetime.utcnow()
        
        # Check session timeout
        if (now - session.last_heartbeat).total_seconds() > self.config.session_timeout:
            return False
            
        # Check recovery attempts
        if session.recovery_attempts >= self.config.max_recovery_attempts:
            return False
            
        return True

    async def get_missed_messages(
        self,
        client_id: str,
        last_sequence: int
    ) -> List[dict]:
        """Get messages missed since last sequence number."""
        if client_id not in self.sessions:
            return []
            
        session = self.sessions[client_id]
        return [
            msg for msg in session.message_buffer
            if msg["sequence"] > last_sequence
        ]

    async def recover_session(
        self,
        client_id: str,
        last_sequence: int
    ) -> Optional[SessionState]:
        """Attempt to recover a session."""
        if not await self.can_recover(client_id):
            return None
            
        session = self.sessions[client_id]
        session.recovery_attempts += 1
        
        # Reset heartbeat
        session.last_heartbeat = datetime.utcnow()
        session.missed_heartbeats = 0
        
        return session

    async def check_heartbeats(self):
        """Check for missed heartbeats and mark sessions as disconnected."""
        now = datetime.utcnow()
        for session in self.sessions.values():
            time_since_heartbeat = (now - session.last_heartbeat).total_seconds()
            
            if time_since_heartbeat > self.config.heartbeat_interval:
                missed = int(time_since_heartbeat / self.config.heartbeat_interval)
                session.missed_heartbeats = missed
                
                if missed >= self.config.max_missed_heartbeats:
                    logger.warning(
                        f"Session {session.client_id} missed "
                        f"{missed} heartbeats"
                    )

    async def _cleanup_loop(self):
        """Periodically clean up expired sessions."""
        while True:
            try:
                now = datetime.utcnow()
                timeout = timedelta(seconds=self.config.session_timeout)
                
                # Remove expired sessions
                expired = [
                    client_id
                    for client_id, session in self.sessions.items()
                    if now - session.last_heartbeat > timeout
                ]
                
                for client_id in expired:
                    del self.sessions[client_id]
                    if client_id in self.sequence_numbers:
                        del self.sequence_numbers[client_id]
                        
                # Check heartbeats
                await self.check_heartbeats()
                
                await asyncio.sleep(self.config.heartbeat_interval)
                
            except Exception as e:
                logger.error(f"Error in recovery cleanup loop: {e}")

    def get_metrics(self) -> dict:
        """Get recovery system metrics."""
        now = datetime.utcnow()
        return {
            "active_sessions": len(self.sessions),
            "sessions": {
                session.client_id: {
                    "user_id": session.user_id,
                    "channel": session.channel,
                    "last_sequence": session.last_sequence,
                    "buffer_size": len(session.message_buffer),
                    "recovery_attempts": session.recovery_attempts,
                    "missed_heartbeats": session.missed_heartbeats,
                    "last_heartbeat": session.last_heartbeat.isoformat(),
                    "time_since_heartbeat": (
                        now - session.last_heartbeat
                    ).total_seconds()
                }
                for session in self.sessions.values()
            }
        } 