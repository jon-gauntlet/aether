from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

Base = declarative_base()
engine = create_engine('sqlite:///chat.db')
Session = sessionmaker(bind=engine)

class StoredMessage(Base):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    client_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    message_type = Column(String, default='message')
    parent_id = Column(Integer, ForeignKey('messages.id'), nullable=True)
    is_thread_starter = Column(Boolean, default=False)
    
    reactions = relationship("MessageReaction", back_populates="message")
    replies = relationship("StoredMessage", 
                         backref=relationship("StoredMessage", remote_side=[id]),
                         cascade="all, delete-orphan")

class MessageReaction(Base):
    __tablename__ = 'reactions'
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id'))
    user_id = Column(String, nullable=False)
    reaction = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    message = relationship("StoredMessage", back_populates="reactions")

# Create tables
Base.metadata.create_all(engine)

class MessageStorage:
    def __init__(self):
        self.session = Session()
    
    async def save_message(self, message: dict) -> StoredMessage:
        """Save a new message to the database."""
        try:
            stored_message = StoredMessage(
                content=message['content'],
                user_id=message['user_id'],
                client_id=message['client_id'],
                timestamp=datetime.fromisoformat(message['timestamp']),
                message_type=message.get('type', 'message')
            )
            self.session.add(stored_message)
            self.session.commit()
            return stored_message
        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")
            self.session.rollback()
            raise
    
    async def create_thread(self, parent_message_id: int, reply: dict) -> StoredMessage:
        """Create a thread reply."""
        try:
            # Mark parent as thread starter if it's not already
            parent = self.session.query(StoredMessage).get(parent_message_id)
            if parent:
                parent.is_thread_starter = True
            
            # Create reply
            stored_reply = StoredMessage(
                content=reply['content'],
                user_id=reply['user_id'],
                client_id=reply['client_id'],
                timestamp=datetime.fromisoformat(reply['timestamp']),
                message_type=reply.get('type', 'message'),
                parent_id=parent_message_id
            )
            self.session.add(stored_reply)
            self.session.commit()
            return stored_reply
        except Exception as e:
            logger.error(f"Failed to create thread: {str(e)}")
            self.session.rollback()
            raise
    
    async def get_thread_replies(self, parent_id: int, limit: int = 50) -> List[dict]:
        """Get replies in a thread."""
        try:
            replies = (
                self.session.query(StoredMessage)
                .filter(StoredMessage.parent_id == parent_id)
                .order_by(StoredMessage.timestamp.asc())
                .limit(limit)
                .all()
            )
            return [
                {
                    'id': reply.id,
                    'content': reply.content,
                    'user_id': reply.user_id,
                    'client_id': reply.client_id,
                    'timestamp': reply.timestamp.isoformat(),
                    'type': reply.message_type,
                    'parent_id': reply.parent_id,
                    'reactions': [
                        {
                            'user_id': r.user_id,
                            'reaction': r.reaction,
                            'timestamp': r.timestamp.isoformat()
                        }
                        for r in reply.reactions
                    ]
                }
                for reply in replies
            ]
        except Exception as e:
            logger.error(f"Failed to get thread replies: {str(e)}")
            raise
    
    async def get_recent_messages(self, limit: int = 100) -> List[dict]:
        """Get recent messages from the database."""
        try:
            messages = (
                self.session.query(StoredMessage)
                .filter(StoredMessage.parent_id.is_(None))  # Only get top-level messages
                .order_by(StoredMessage.timestamp.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    'id': msg.id,
                    'content': msg.content,
                    'user_id': msg.user_id,
                    'client_id': msg.client_id,
                    'timestamp': msg.timestamp.isoformat(),
                    'type': msg.message_type,
                    'is_thread_starter': msg.is_thread_starter,
                    'reply_count': len(msg.replies),
                    'reactions': [
                        {
                            'user_id': r.user_id,
                            'reaction': r.reaction,
                            'timestamp': r.timestamp.isoformat()
                        }
                        for r in msg.reactions
                    ]
                }
                for msg in messages
            ]
        except Exception as e:
            logger.error(f"Failed to get messages: {str(e)}")
            raise
    
    async def add_reaction(self, message_id: int, user_id: str, reaction: str) -> MessageReaction:
        """Add a reaction to a message."""
        try:
            reaction = MessageReaction(
                message_id=message_id,
                user_id=user_id,
                reaction=reaction
            )
            self.session.add(reaction)
            self.session.commit()
            return reaction
        except Exception as e:
            logger.error(f"Failed to add reaction: {str(e)}")
            self.session.rollback()
            raise
    
    async def remove_reaction(self, message_id: int, user_id: str, reaction: str) -> bool:
        """Remove a reaction from a message."""
        try:
            result = (
                self.session.query(MessageReaction)
                .filter_by(
                    message_id=message_id,
                    user_id=user_id,
                    reaction=reaction
                )
                .delete()
            )
            self.session.commit()
            return result > 0
        except Exception as e:
            logger.error(f"Failed to remove reaction: {str(e)}")
            self.session.rollback()
            raise
    
    def close(self):
        """Close the database session."""
        self.session.close() 