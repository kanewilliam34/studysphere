from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str | None = None
    subject: str | None = Field(None, max_length=100)
    visibility: str = Field("private", pattern="^(private|public)$")


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=150)
    description: str | None = None
    subject: str | None = Field(None, max_length=100)
    visibility: str | None = Field(None, pattern="^(private|public)$")


class GroupMemberUser(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str | None = None
    model_config = ConfigDict(from_attributes=True)


class GroupMemberResponse(BaseModel):
    id: str
    group_id: str
    user_id: str
    role: str
    joined_at: datetime
    user: GroupMemberUser | None = None
    model_config = ConfigDict(from_attributes=True)


class GroupResponse(GroupBase):
    id: str
    owner_id: str
    created_at: datetime
    member_count: int = 0
    is_member: bool = False
    user_role: str | None = None
    nexconn_channel_id: str | None = None
    members: list[GroupMemberResponse] | None = None
    model_config = ConfigDict(from_attributes=True)
