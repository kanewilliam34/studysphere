# ADR 0003: Real-Time Messaging Integration via Nexconn Chat SDK

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: StudySphere Engineering Team

## Context
Real-time messaging is a required challenge capability. We need reliable 1:1 direct messaging and group chat channels for study groups across both Web and Mobile platforms without storing chat messages redundantly or exposing privileged secrets.

## Decision
We integrate the **Nexconn Chat SDK** (`@nexconn/chat`, `@nexconn/engine` for Web; `ai_nexconn_chat_plugin` for Flutter).
1. **Security boundary**:
   - The `NEXCONN_APP_SECRET` remains strictly on the FastAPI backend.
   - The backend maps authenticated StudySphere user UUIDs to Nexconn user identities and requests access tokens from the Nexconn Server API (`POST /v4/auth/access-token/issue`) using SHA1 request signing (`sha1(appSecret + nonce + timestamp)`).
   - Only user-scoped access tokens and the public `App Key` are delivered to client applications.
2. **Channel mapping**:
   - Study groups map to Nexconn Group Channels (`POST /v4/group-channel/create`, `join`, `quit`).
   - Group membership is strictly authorized in FastAPI before channel interaction.
3. **Local development & simulation**:
   - When external credentials are being provisioned, the backend and frontend support clean offline simulation so development and testing proceed unimpeded.

## Alternatives Considered
- **Custom WebSocket broker**: High operational cost, lacks built-in mobile push notifications, offline syncing, and violates challenge integration requirements.
- **Client-side signing**: Strictly rejected as an OWASP/security violation exposing `App Secret`.
