
from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def log_event(
    db: Session,
    event_type: str,
    actor_id: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
) -> AuditEvent:
    event = AuditEvent(
        actor_id=actor_id,
        event_type=event_type,
        target_type=target_type,
        target_id=target_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
