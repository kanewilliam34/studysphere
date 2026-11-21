from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditEventResponse(BaseModel):
    id: str
    actor_id: str | None = None
    event_type: str
    target_type: str | None = None
    target_id: str | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
