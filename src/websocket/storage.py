"""SQLite storage for the WebSocket chat application."""
import logging
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, selectinload
from typing import List, Optional

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
    
    # One-to-many relationship for reactions with eager loading
    reactions = relationship(
        "Reaction",
        back_populates="message",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    # Self-referential relationship for replies with eager loading
    replies = relationship(
        "Message",
        backref="parent",
        remote_side=[id],
        cascade="all, delete",
        lazy="selectin",
        order_by=timestamp.desc(),  # Most recent first
        foreign_keys=[parent_id],
        overlaps="parent"
    )

class Reaction(Base):
    """Reaction model."""
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    user_id = Column(String, nullable=False)
    emoji = Column(String, nullable=False)
    
    message = relationship("Message", back_populates="reactions")

class Storage:
    """Storage for messages and reactions."""
    def __init__(self, database_url: str = "sqlite+aiosqlite:///chat.db"):
        """Initialize storage with database URL."""
        self.engine = create_async_engine(database_url, echo=False)
        self.async_session = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True
        )

    async def create_tables(self):
        """Create database tables."""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    async def save_message(self, content: str, user_id: str, parent_id: Optional[int] = None) -> Message:
        """Save a new message."""
        async with self.async_session() as session:
            async with session.begin():
                message = Message(content=content, user_id=user_id, parent_id=parent_id)
                session.add(message)
                await session.flush()
                # Refresh to get the generated ID and timestamp
                await session.refresh(message)
                return message

    async def get_message(self, message_id: int) -> Optional[Message]:
        """Get a message by ID."""
        async with self.async_session() as session:
            async with session.begin():
                stmt = (
                    select(Message)
                    .where(Message.id == message_id)
                    .options(
                        selectinload(Message.reactions),
                        selectinload(Message.replies)
                    )
                )
                result = await session.execute(stmt)
                message = result.scalar_one_or_none()
                if message:
                    await session.refresh(message)
                return message

    async def get_thread_messages(self, parent_id: int) -> List[Message]:
        """Get all messages in a thread."""
        async with self.async_session() as session:
            async with session.begin():
                stmt = (
                    select(Message)
                    .where(Message.parent_id == parent_id)
                    .options(selectinload(Message.reactions))
                    .order_by(Message.timestamp.desc())  # Most recent first
                )
                result = await session.execute(stmt)
                messages = result.scalars().all()
                for message in messages:
                    await session.refresh(message)
                return messages

    async def get_recent_messages(self, limit: int = 50, offset: int = 0) -> List[Message]:
        """Get recent messages."""
        async with self.async_session() as session:
            async with session.begin():
                stmt = (
                    select(Message)
                    .where(Message.parent_id.is_(None))  # Only top-level messages
                    .options(
                        selectinload(Message.reactions),
                        selectinload(Message.replies)
                    )
                    .order_by(Message.timestamp.desc())  # Most recent first
                    .limit(limit)
                    .offset(offset)
                )
                result = await session.execute(stmt)
                messages = result.scalars().all()
                for message in messages:
                    await session.refresh(message)
                return messages

    async def add_reaction(self, message_id: int, user_id: str, emoji: str) -> Optional[Reaction]:
        """Add a reaction to a message."""
        async with self.async_session() as session:
            async with session.begin():
                # Check if reaction already exists
                stmt = select(Reaction).where(
                    Reaction.message_id == message_id,
                    Reaction.user_id == user_id,
                    Reaction.emoji == emoji
                )
                result = await session.execute(stmt)
                existing = result.scalar_one_or_none()
                if existing:
                    return existing  # Return existing reaction instead of None
                
                reaction = Reaction(message_id=message_id, user_id=user_id, emoji=emoji)
                session.add(reaction)
                await session.flush()
                await session.refresh(reaction)
                return reaction

    async def remove_reaction(self, message_id: int, user_id: str, emoji: str) -> bool:
        """Remove a reaction from a message."""
        async with self.async_session() as session:
            async with session.begin():
                stmt = select(Reaction).where(
                    Reaction.message_id == message_id,
                    Reaction.user_id == user_id,
                    Reaction.emoji == emoji
                )
                result = await session.execute(stmt)
                reaction = result.scalar_one_or_none()
                
                if reaction:
                    await session.delete(reaction)
                    return True
                return False

    async def close(self):
        """Close the database connection."""
        await self.engine.dispose() 