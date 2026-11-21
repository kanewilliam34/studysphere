import hashlib
import logging
import random
import time
import uuid
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def compute_nexconn_headers(app_key: str, app_secret: str) -> dict[str, str]:
    nonce = str(random.randint(10000, 999999))
    timestamp = str(int(time.time() * 1000))
    raw_signature = f"{app_secret}{nonce}{timestamp}"
    signature = hashlib.sha1(raw_signature.encode("utf-8")).hexdigest()
    request_id = uuid.uuid4().hex

    return {
        "App-Key": app_key,
        "Nonce": nonce,
        "Timestamp": timestamp,
        "Signature": signature,
        "X-Request-ID": request_id,
        "Content-Type": "application/json",
    }


def is_placeholder_config() -> bool:
    return (
        not settings.NEXCONN_APP_KEY
        or "placeholder" in settings.NEXCONN_APP_KEY.lower()
        or not settings.NEXCONN_APP_SECRET
        or "placeholder" in settings.NEXCONN_APP_SECRET.lower()
    )


async def issue_nexconn_token(user_id: str, name: str, avatar_url: str | None = None) -> dict[str, Any]:
    if is_placeholder_config() and settings.NEXCONN_MOCK_FALLBACK:
        simulated_token = f"sim_token_{user_id}_{hashlib.sha256(user_id.encode()).hexdigest()[:16]}"
        logger.info(f"Using simulated Nexconn token for user {user_id}")
        return {
            "app_key": settings.NEXCONN_APP_KEY,
            "user_id": user_id,
            "access_token": simulated_token,
            "base_url": settings.NEXCONN_BASE_URL,
            "is_simulated": True,
        }

    url = f"{settings.NEXCONN_BASE_URL}/v4/auth/access-token/issue"
    headers = compute_nexconn_headers(settings.NEXCONN_APP_KEY, settings.NEXCONN_APP_SECRET)
    payload = {
        "userId": user_id,
        "name": name[:64],
        "avatarUrl": avatar_url or "",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == 0 and "result" in data:
                    return {
                        "app_key": settings.NEXCONN_APP_KEY,
                        "user_id": user_id,
                        "access_token": data["result"]["accessToken"],
                        "base_url": settings.NEXCONN_BASE_URL,
                        "is_simulated": False,
                    }
            logger.warning(f"Nexconn API returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Failed to connect to Nexconn server: {e}")

    if settings.NEXCONN_MOCK_FALLBACK:
        simulated_token = f"sim_token_{user_id}_{hashlib.sha256(user_id.encode()).hexdigest()[:16]}"
        return {
            "app_key": settings.NEXCONN_APP_KEY,
            "user_id": user_id,
            "access_token": simulated_token,
            "base_url": settings.NEXCONN_BASE_URL,
            "is_simulated": True,
        }

    raise RuntimeError("Nexconn service unavailable and fallback disabled.")


async def create_nexconn_group_channel(
    channel_id: str,
    name: str,
    owner_id: str,
    user_ids: list[str] | None = None,
) -> bool:
    if is_placeholder_config():
        return True

    url = f"{settings.NEXCONN_BASE_URL}/v4/group-channel/create"
    headers = compute_nexconn_headers(settings.NEXCONN_APP_KEY, settings.NEXCONN_APP_SECRET)
    payload = {
        "channelId": channel_id,
        "name": name[:64],
        "owner": owner_id,
        "userIds": user_ids or [owner_id],
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.status_code == 200
    except Exception as e:
        logger.warning(f"Failed to create Nexconn group channel {channel_id}: {e}")
        return False


async def join_nexconn_group_channel(channel_id: str, user_ids: list[str]) -> bool:
    if is_placeholder_config():
        return True

    url = f"{settings.NEXCONN_BASE_URL}/v4/group-channel/join"
    headers = compute_nexconn_headers(settings.NEXCONN_APP_KEY, settings.NEXCONN_APP_SECRET)
    payload = {
        "channelId": channel_id,
        "userIds": user_ids,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.status_code == 200
    except Exception as e:
        logger.warning(f"Failed to join Nexconn group channel {channel_id}: {e}")
        return False


async def leave_nexconn_group_channel(channel_id: str, user_ids: list[str]) -> bool:
    if is_placeholder_config():
        return True

    url = f"{settings.NEXCONN_BASE_URL}/v4/group-channel/quit"
    headers = compute_nexconn_headers(settings.NEXCONN_APP_KEY, settings.NEXCONN_APP_SECRET)
    payload = {
        "channelId": channel_id,
        "userIds": user_ids,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.status_code == 200
    except Exception as e:
        logger.warning(f"Failed to leave Nexconn group channel {channel_id}: {e}")
        return False
