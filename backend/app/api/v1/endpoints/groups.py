from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.models.chat import ChatChannel
from app.models.group import GroupMember, StudyGroup
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupMemberResponse,
    GroupMemberUser,
    GroupResponse,
)
from app.services.audit_service import log_event
from app.services.nexconn_service import (
    create_nexconn_group_channel,
    join_nexconn_group_channel,
    leave_nexconn_group_channel,
)

router = APIRouter(prefix="/groups", tags=["Study Groups"])


def format_group_response(group: StudyGroup, user_id: str, db: Session) -> GroupResponse:
    membership = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group.id, GroupMember.user_id == user_id)
        .first()
    )
    member_count = db.query(GroupMember).filter(GroupMember.group_id == group.id).count()
    nexconn_channel_id = group.chat_channel.nexconn_channel_id if group.chat_channel else None

    # Load members with user details
    members_list = []
    if membership or group.visibility == "public":
        group_members = (
            db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        )
        for gm in group_members:
            u = gm.user
            members_list.append(
                GroupMemberResponse(
                    id=gm.id,
                    group_id=gm.group_id,
                    user_id=gm.user_id,
                    role=gm.role,
                    joined_at=gm.joined_at,
                    user=GroupMemberUser(
                        id=u.id,
                        name=u.name,
                        email=u.email,
                        avatar_url=u.avatar_url,
                    ) if u else None,
                )
            )

    return GroupResponse(
        id=group.id,
        owner_id=group.owner_id,
        name=group.name,
        description=group.description,
        subject=group.subject,
        visibility=group.visibility,
        created_at=group.created_at,
        member_count=member_count,
        is_member=membership is not None,
        user_role=membership.role if membership else None,
        nexconn_channel_id=nexconn_channel_id,
        members=members_list if (membership or group.visibility == "public") else None,
    )


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_in: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = StudyGroup(
        owner_id=current_user.id,
        name=group_in.name,
        description=group_in.description,
        subject=group_in.subject,
        visibility=group_in.visibility,
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    # Add creator as owner member
    owner_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(owner_member)

    # Provision Nexconn Chat Channel ID
    clean_id = group.id.replace("-", "")[:24]
    nexconn_channel_id = f"group_{clean_id}"
    chat_channel = ChatChannel(
        group_id=group.id,
        nexconn_channel_id=nexconn_channel_id,
    )
    db.add(chat_channel)
    db.commit()
    db.refresh(group)

    # Sync with Nexconn Server API
    await create_nexconn_group_channel(
        channel_id=nexconn_channel_id,
        name=group.name,
        owner_id=current_user.id,
        user_ids=[current_user.id],
    )

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="GROUP_CREATE",
        target_type="study_group",
        target_id=group.id,
    )

    return format_group_response(group, current_user.id, db)


@router.get("/", response_model=list[GroupResponse])
def list_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Retrieve user's joined group IDs
    user_memberships = (
        db.query(GroupMember.group_id).filter(GroupMember.user_id == current_user.id).all()
    )
    joined_group_ids = [m[0] for m in user_memberships]

    # Return public groups or private groups the user is part of
    groups = (
        db.query(StudyGroup)
        .filter(
            (StudyGroup.visibility == "public")
            | (StudyGroup.id.in_(joined_group_ids))
        )
        .all()
    )

    return [format_group_response(g, current_user.id, db) for g in groups]


@router.get("/{group_id}", response_model=GroupResponse)
def get_group_details(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found",
        )

    membership = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group.id, GroupMember.user_id == current_user.id)
        .first()
    )

    # Authorization check
    if group.visibility == "private" and not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to private study group",
        )

    return format_group_response(group, current_user.id, db)


@router.post("/{group_id}/join", response_model=GroupResponse)
async def join_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found",
        )

    existing_membership = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group.id, GroupMember.user_id == current_user.id)
        .first()
    )
    if existing_membership:
        return format_group_response(group, current_user.id, db)

    member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="member",
    )
    db.add(member)
    db.commit()

    # Sync membership with Nexconn
    if group.chat_channel:
        await join_nexconn_group_channel(
            channel_id=group.chat_channel.nexconn_channel_id,
            user_ids=[current_user.id],
        )

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="GROUP_JOIN",
        target_type="study_group",
        target_id=group.id,
    )

    return format_group_response(group, current_user.id, db)


@router.post("/{group_id}/leave")
async def leave_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found",
        )

    membership = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group.id, GroupMember.user_id == current_user.id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this group",
        )

    if membership.role == "owner":
        other_members_count = (
            db.query(GroupMember)
            .filter(GroupMember.group_id == group.id, GroupMember.user_id != current_user.id)
            .count()
        )
        if other_members_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owners must transfer ownership before leaving the study group",
            )

    db.delete(membership)
    db.commit()

    if group.chat_channel:
        await leave_nexconn_group_channel(
            channel_id=group.chat_channel.nexconn_channel_id,
            user_ids=[current_user.id],
        )

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="GROUP_LEAVE",
        target_type="study_group",
        target_id=group.id,
    )

    return {"message": "Successfully left the group"}
