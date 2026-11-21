
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserSettings
from app.schemas.user import (
    UserResponse,
    UserSettingsResponse,
    UserSettingsUpdate,
    UserUpdate,
)
from app.services.audit_service import log_event

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_current_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.password is not None:
        current_user.password_hash = get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="PROFILE_UPDATED",
        target_type="user",
        target_id=current_user.id,
    )

    return UserResponse.model_validate(current_user)


@router.get("/me/settings", response_model=UserSettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return UserSettingsResponse.model_validate(settings)


@router.patch("/me/settings", response_model=UserSettingsResponse)
def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if settings_update.theme is not None:
        settings.theme = settings_update.theme
    if settings_update.language is not None:
        settings.language = settings_update.language
    if settings_update.notifications is not None:
        settings.notifications = settings_update.notifications

    db.commit()
    db.refresh(settings)
    return UserSettingsResponse.model_validate(settings)


@router.get("/", response_model=list[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List other users for 1:1 chat or sharing notes."""
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]
