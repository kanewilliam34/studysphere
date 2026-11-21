from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db, security
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    revoke_token,
    verify_password,
)
from app.models.user import User, UserSettings
from app.schemas.user import (
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.audit_service import log_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    # Argon2id password hash
    password_hash = get_password_hash(user_in.password)

    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=password_hash,
        avatar_url=user_in.avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default settings
    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    db.commit()

    # Log audit event
    log_event(
        db=db,
        actor_id=user.id,
        event_type="USER_REGISTER",
        target_type="user",
        target_id=user.id,
    )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        log_event(
            db=db,
            actor_id=None,
            event_type="LOGIN_FAILED",
            target_type="user",
            target_id=login_data.email.lower(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    log_event(
        db=db,
        actor_id=user.id,
        event_type="LOGIN_SUCCESS",
        target_type="user",
        target_id=user.id,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Invalidate previous refresh token and issue new pair
    revoke_token(request.refresh_token)
    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(
    credentials=Depends(security),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if credentials:
        revoke_token(credentials.credentials)

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="LOGOUT",
        target_type="user",
        target_id=current_user.id,
    )
    return {"message": "Successfully logged out"}
