from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class NoteCreate(NoteBase):
    pass


class NotePermissionResponse(BaseModel):
    id: str
    note_id: str
    user_id: str | None = None
    group_id: str | None = None
    model_config = ConfigDict(from_attributes=True)


class NoteResponse(NoteBase):
    id: str
    owner_id: str
    file_key: str
    mime_type: str
    file_size: int
    created_at: datetime
    owner_name: str | None = None
    permissions: list[NotePermissionResponse] | None = None
    model_config = ConfigDict(from_attributes=True)


class NoteShareRequest(BaseModel):
    user_id: str | None = None
    group_id: str | None = None
