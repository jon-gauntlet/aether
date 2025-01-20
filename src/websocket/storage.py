"""SQLite storage for WebSocket chat."""
import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, relationship, selectinload

logger = logging.getLogger(__name__)

Base = declarative_base()

class Message(Base):
    """Message model."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    parent_id = Column(Integer, ForeignKey("messages.id"), nullable=True)

    reactions = relationship(
        "Reaction",
        back_populates="message",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    replies = relationship(
        "Message",
        backref="parent",
        remote_side=[id],
        foreign_keys=[parent_id],
        lazy="selectin",
        order_by=desc(timestamp)
    )

    async def to_dict(self):
        """Convert message to dictionary format."""
        return {
            "id": self.id,
            "content": self.content,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "parent_id": self.parent_id,
            "reactions": [{"user_id": r.user_id, "emoji": r.emoji} for r in (self.reactions or [])],
            "reply_count": len(self.replies) if self.replies is not None else 0
        }

class Reaction(Base):
    """Reaction model."""

    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    user_id = Column(String, nullable=False)
    emoji = Column(String, nullable=False)

    message = relationship("Message", back_populates="reactions")

class Storage:
    """Storage for WebSocket chat."""

    def __init__(self, database_url: str = "sqlite+aiosqlite:///chat.db"):
        """Initialize storage."""
        self.engine = create_async_engine(database_url, echo=True)
        self.async_session = lambda: AsyncSession(self.engine)

    async def create_tables(self):
        """Create database tables."""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close(self):
        """Close database connection."""
        await self.engine.dispose()

    async def save_message(self, session: AsyncSession, content: str, user_id: str, parent_id: Optional[int] = None) -> Message:
        """Save a new message."""
        message = Message(content=content, user_id=user_id, parent_id=parent_id)
        session.add(message)
        await session.flush()
        # First refresh just the message itself
        await session.refresh(message)
        # Then load the relationships
        stmt = (
            select(Message)
            .where(Message.id == message.id)
            .options(
                selectinload(Message.reactions),
                selectinload(Message.replies)
            )
        )
        result = await session.execute(stmt)
        message = result.scalar_one()
        return message

    async def get_message(self, session: AsyncSession, message_id: int) -> Optional[Message]:
        """Get a message by ID."""
        stmt = (
            select(Message)
            .where(Message.id == message_id)
            .options(
                selectinload(Message.reactions),
                selectinload(Message.replies)
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_thread_messages(self, session: AsyncSession, message_id: int) -> List[Message]:
        """Get messages in a thread."""
        stmt = (
            select(Message)
            .where(Message.parent_id == message_id)
            .options(
                selectinload(Message.reactions),
                selectinload(Message.replies)
            )
            .order_by(desc(Message.timestamp))
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_recent_messages(self, session: AsyncSession, limit: int = 50, offset: int = 0) -> List[Message]:
        """Get recent messages."""
        stmt = (
            select(Message)
            .where(Message.parent_id.is_(None))
            .options(
                selectinload(Message.reactions),
                selectinload(Message.replies)
            )
            .order_by(desc(Message.timestamp))
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    async def add_reaction(self, session: AsyncSession, message_id: int, user_id: str, emoji: str) -> bool:
        """Add a reaction to a message."""
        # Check if reaction already exists
        stmt = (
            select(Reaction)
            .where(
                Reaction.message_id == message_id,
                Reaction.user_id == user_id,
                Reaction.emoji == emoji
            )
        )
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            return False

        reaction = Reaction(message_id=message_id, user_id=user_id, emoji=emoji)
        session.add(reaction)
        await session.flush()
        return True

    async def remove_reaction(self, session: AsyncSession, message_id: int, user_id: str, emoji: str) -> bool:
        """Remove a reaction from a message."""
        stmt = (
            select(Reaction)
            .where(
                Reaction.message_id == message_id,
                Reaction.user_id == user_id,
                Reaction.emoji == emoji
            )
        )
        result = await session.execute(stmt)
        reaction = result.scalar_one_or_none()
        if reaction:
            await session.delete(reaction)
            await session.flush()
            return True
        return False 