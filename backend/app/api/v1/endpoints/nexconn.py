from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.nexconn import NexconnTokenResponse
from app.services.audit_service import log_event
from app.services.nexconn_service import issue_nexconn_token

router = APIRouter(prefix="/nexconn", tags=["Nexconn Chat"])


@router.post("/token", response_model=NexconnTokenResponse)
async def get_nexconn_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token_info = await issue_nexconn_token(
        user_id=current_user.id,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
    )

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="NEXCONN_TOKEN_ISSUED",
        target_type="user",
        target_id=current_user.id,
    )

    return NexconnTokenResponse(
        app_key=token_info["app_key"],
        user_id=token_info["user_id"],
        access_token=token_info["access_token"],
        base_url=token_info["base_url"],
        is_simulated=token_info.get("is_simulated", False),
    )
