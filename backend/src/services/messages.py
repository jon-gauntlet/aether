from typing import List, Dict
from ..models.message import Message
from datetime import datetime

class MessageService:
    def __init__(self):
        # In-memory storage for now
        self.messages: Dict[str, List[Message]] = {}
        self.max_messages_per_channel = 1000

    async def get_messages(self, channel: str) -> List[Message]:
        """Get all messages for a channel."""
        return self.messages.get(channel, [])

    async def add_message(self, channel: str, message: Message) -> Message:
        """Add a message to a channel."""
        if channel not in self.messages:
            self.messages[channel] = []
        
        # Add timestamp if not present
        if not message.timestamp:
            message.timestamp = datetime.now()
        
        self.messages[channel].append(message)
        
        # Keep only the last max_messages_per_channel messages
        if len(self.messages[channel]) > self.max_messages_per_channel:
            self.messages[channel] = self.messages[channel][-self.max_messages_per_channel:]
        
        return message 