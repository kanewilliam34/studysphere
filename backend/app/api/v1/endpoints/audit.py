
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.models.audit import AuditEvent
from app.models.user import User
from app.schemas.audit import AuditEventResponse

router = APIRouter(prefix="/audit", tags=["Audit Events"])


@router.get("/events", response_model=list[AuditEventResponse])
def get_audit_events(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve security audit events associated with the user."""
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.actor_id == current_user.id)
        .order_by(AuditEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [AuditEventResponse.model_validate(e) for e in events]
