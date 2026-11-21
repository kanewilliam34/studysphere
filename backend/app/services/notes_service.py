import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.group import GroupMember
from app.models.note import Note, NotePermission
from app.models.user import User
from app.services.audit_service import log_event

logger = logging.getLogger(__name__)

# PDF signature (Magic bytes %PDF-)
PDF_MAGIC_BYTES = b"%PDF"


def validate_pdf_content(content: bytes) -> bool:
    if len(content) < 4:
        return False
    # Check if header begins with %PDF
    return content[:4] == PDF_MAGIC_BYTES


async def save_uploaded_note(
    db: Session,
    user: User,
    file: UploadFile,
    title: str,
    description: str | None = None,
) -> Note:
    # Read file content safely
    content = await file.read()
    file_size = len(content)

    # 1. Enforce file size limit
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB",
        )

    # 2. Inspect file signature (magic bytes)
    if not validate_pdf_content(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only valid PDF files with proper signature are accepted.",
        )

    # 3. Generate random storage key (prevent path traversal / directory traversal)
    file_key = f"{uuid.uuid4().hex}.pdf"
    storage_path = settings.STORAGE_DIR / file_key

    # 4. Store outside public web root
    with open(storage_path, "wb") as f:
        f.write(content)

    # 5. Save metadata
    note = Note(
        owner_id=user.id,
        title=title,
        description=description,
        file_key=file_key,
        mime_type="application/pdf",
        file_size=file_size,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # 6. Audit event
    log_event(
        db=db,
        actor_id=user.id,
        event_type="NOTE_UPLOAD",
        target_type="note",
        target_id=note.id,
    )

    return note


def can_user_access_note(db: Session, user_id: str, note: Note) -> bool:
    # 1. Owner always has access
    if note.owner_id == user_id:
        return True

    # 2. Check direct user permission
    direct_perm = (
        db.query(NotePermission)
        .filter(NotePermission.note_id == note.id, NotePermission.user_id == user_id)
        .first()
    )
    if direct_perm:
        return True

    # 3. Check group-based permission
    # Find all groups shared with this note
    group_perms = (
        db.query(NotePermission.group_id)
        .filter(NotePermission.note_id == note.id, NotePermission.group_id.isnot(None))
        .all()
    )
    shared_group_ids = [gp[0] for gp in group_perms]

    if shared_group_ids:
        # Check if user is a member of any of those groups
        membership = (
            db.query(GroupMember)
            .filter(
                GroupMember.user_id == user_id,
                GroupMember.group_id.in_(shared_group_ids),
            )
            .first()
        )
        if membership:
            return True

    return False


def get_authorized_note(db: Session, user_id: str, note_id: str) -> Note:
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    if not can_user_access_note(db, user_id, note):
        # Do not leak file details
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this note",
        )
    return note


def get_note_file_path(note: Note) -> Path:
    file_path = settings.STORAGE_DIR / note.file_key
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File content not found on server",
        )
    return file_path


def share_note(
    db: Session,
    owner_id: str,
    note_id: str,
    target_user_id: str | None = None,
    target_group_id: str | None = None,
) -> NotePermission:
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.owner_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the note owner can manage sharing permissions",
        )

    if not target_user_id and not target_group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or group_id must be provided to share",
        )

    # Check if duplicate permission already exists
    existing = (
        db.query(NotePermission)
        .filter(
            NotePermission.note_id == note_id,
            NotePermission.user_id == target_user_id,
            NotePermission.group_id == target_group_id,
        )
        .first()
    )
    if existing:
        return existing

    perm = NotePermission(
        note_id=note_id,
        user_id=target_user_id,
        group_id=target_group_id,
    )
    db.add(perm)
    db.commit()
    db.refresh(perm)

    log_event(
        db=db,
        actor_id=owner_id,
        event_type="NOTE_SHARE",
        target_type="note",
        target_id=note_id,
    )

    return perm
