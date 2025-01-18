from typing import List, Dict
from ..models.message import Message

class MessageService:
    def __init__(self):
        # In-memory storage for now
        self._messages: Dict[str, List[Message]] = {}

    async def get_messages(self, channel: str) -> List[Message]:
        """Get all messages for a channel"""
        return self._messages.get(channel, [])

    async def send_message(self, channel: str, message: Message) -> Message:
        """Send a message to a channel"""
        if channel not in self._messages:
            self._messages[channel] = []
        
        message.channel = channel
        self._messages[channel].append(message)
        return message 