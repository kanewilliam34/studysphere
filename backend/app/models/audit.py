import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, String

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # 'USER_REGISTER', 'LOGIN', 'NOTE_UPLOAD', etc.
    target_type = Column(String(50), nullable=True)  # 'user', 'study_group', 'note', 'ai'
    target_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False, index=True)
