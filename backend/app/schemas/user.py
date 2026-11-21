from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    avatar_url: str | None = None


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    avatar_url: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    avatar_url: str | None = None
    password: str | None = Field(None, min_length=6, max_length=128)


class UserResponse(UserBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserSettingsBase(BaseModel):
    theme: str = "system"
    language: str = "en"
    notifications: bool = True


class UserSettingsUpdate(BaseModel):
    theme: str | None = None
    language: str | None = None
    notifications: bool | None = None


class UserSettingsResponse(UserSettingsBase):
    id: str
    user_id: str
    model_config = ConfigDict(from_attributes=True)
