import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # Ensure all models are registered with Base
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("studysphere")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing StudySphere Database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("StudySphere backend started successfully.")
    yield
    logger.info("StudySphere backend shutting down.")


app = FastAPI(
    title="StudySphere API",
    description="Backend API for StudySphere AI-Powered Collaborative Learning Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "project": "StudySphere",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
