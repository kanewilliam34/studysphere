from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AIMessageBase(BaseModel):
    role: str
    content: str


class AIMessageResponse(AIMessageBase):
    id: str
    conversation_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    messages: list[AIMessageResponse] | None = None
    model_config = ConfigDict(from_attributes=True)


class AIAskRequest(BaseModel):
    conversation_id: str | None = None
    question: str = Field(..., min_length=1, max_length=4000)


class AIAskResponse(BaseModel):
    conversation_id: str
    question: str
    answer: str
    model: str
