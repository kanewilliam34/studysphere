
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.models.ai import AIConversation
from app.models.user import User
from app.schemas.ai import (
    AIAskRequest,
    AIAskResponse,
    AIMessageResponse,
    ConversationCreate,
    ConversationResponse,
)
from app.services.ai_service import ask_tutor_in_conversation
from app.services.audit_service import log_event

router = APIRouter(prefix="/ai", tags=["AI Tutor"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = AIConversation(
        user_id=current_user.id,
        title=conv_in.title,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="AI_CONVERSATION_CREATE",
        target_type="ai_conversation",
        target_id=conv.id,
    )

    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        created_at=conv.created_at,
        messages=[],
    )


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.created_at.desc())
        .all()
    )
    return [
        ConversationResponse(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            created_at=c.created_at,
            messages=[AIMessageResponse.model_validate(m) for m in c.messages],
        )
        for c in convs
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(AIConversation)
        .filter(AIConversation.id == conversation_id, AIConversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        created_at=conv.created_at,
        messages=[AIMessageResponse.model_validate(m) for m in conv.messages],
    )


@router.post("/ask", response_model=AIAskResponse)
async def ask_tutor(
    request: AIAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await ask_tutor_in_conversation(
        db=db,
        user=current_user,
        question=request.question,
        conversation_id=request.conversation_id,
    )
    return AIAskResponse(**result)
