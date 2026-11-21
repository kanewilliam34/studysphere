
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.models.group import GroupMember
from app.models.note import Note, NotePermission
from app.models.user import User
from app.schemas.note import (
    NotePermissionResponse,
    NoteResponse,
    NoteShareRequest,
)
from app.services.audit_service import log_event
from app.services.notes_service import (
    get_authorized_note,
    get_note_file_path,
    save_uploaded_note,
    share_note,
)

router = APIRouter(prefix="/notes", tags=["Notes & Files"])


def format_note_response(note: Note, db: Session) -> NoteResponse:
    perms = db.query(NotePermission).filter(NotePermission.note_id == note.id).all()
    perm_responses = [
        NotePermissionResponse(
            id=p.id,
            note_id=p.note_id,
            user_id=p.user_id,
            group_id=p.group_id,
        )
        for p in perms
    ]

    return NoteResponse(
        id=note.id,
        owner_id=note.owner_id,
        title=note.title,
        description=note.description,
        file_key=note.file_key,
        mime_type=note.mime_type,
        file_size=note.file_size,
        created_at=note.created_at,
        owner_name=note.owner.name if note.owner else None,
        permissions=perm_responses,
    )


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = await save_uploaded_note(
        db=db,
        user=current_user,
        file=file,
        title=title,
        description=description,
    )
    return format_note_response(note, db)


@router.get("/", response_model=list[NoteResponse])
def list_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Notes owned by user
    owned_notes = db.query(Note).filter(Note.owner_id == current_user.id).all()

    # 2. Notes shared directly with user
    direct_shared_note_ids = (
        db.query(NotePermission.note_id)
        .filter(NotePermission.user_id == current_user.id)
        .all()
    )
    direct_ids = [n[0] for n in direct_shared_note_ids]

    # 3. Notes shared with user's groups
    user_group_ids = (
        db.query(GroupMember.group_id)
        .filter(GroupMember.user_id == current_user.id)
        .all()
    )
    group_ids = [g[0] for g in user_group_ids]

    group_shared_note_ids = []
    if group_ids:
        group_shared_note_ids = (
            db.query(NotePermission.note_id)
            .filter(NotePermission.group_id.in_(group_ids))
            .all()
        )
    group_ids_from_perms = [n[0] for n in group_shared_note_ids]

    # Combine unique note IDs
    all_authorized_ids = set(direct_ids + group_ids_from_perms)
    shared_notes = []
    if all_authorized_ids:
        shared_notes = (
            db.query(Note)
            .filter(Note.id.in_(all_authorized_ids), Note.owner_id != current_user.id)
            .all()
        )

    all_notes = owned_notes + shared_notes
    return [format_note_response(n, db) for n in all_notes]


@router.post("/{note_id}/share", response_model=NotePermissionResponse)
def share_note_endpoint(
    note_id: str,
    share_req: NoteShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    perm = share_note(
        db=db,
        owner_id=current_user.id,
        note_id=note_id,
        target_user_id=share_req.user_id,
        target_group_id=share_req.group_id,
    )
    return NotePermissionResponse.model_validate(perm)


@router.get("/{note_id}/download")
def download_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = get_authorized_note(db, current_user.id, note_id)
    file_path = get_note_file_path(note)

    log_event(
        db=db,
        actor_id=current_user.id,
        event_type="NOTE_DOWNLOAD",
        target_type="note",
        target_id=note.id,
    )

    safe_filename = f"{note.title.replace(' ', '_')}.pdf"
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=safe_filename,
    )
