from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai,
    audit,
    auth,
    groups,
    nexconn,
    notes,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(groups.router)
api_router.include_router(nexconn.router)
api_router.include_router(notes.router)
api_router.include_router(ai.router)
api_router.include_router(audit.router)
