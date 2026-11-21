import uuid
from datetime import UTC, datetime

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_key = Column(String(255), nullable=False, unique=True)
    mime_type = Column(String(100), default="application/pdf", nullable=False)
    file_size = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    owner = relationship("User", back_populates="notes")
    permissions = relationship("NotePermission", back_populates="note", cascade="all, delete-orphan")


class NotePermission(Base):
    __tablename__ = "note_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    note_id = Column(String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    group_id = Column(String(36), ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=True, index=True)

    note = relationship("Note", back_populates="permissions")
    group = relationship("StudyGroup", back_populates="shared_notes")
