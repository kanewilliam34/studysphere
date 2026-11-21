# ADR 0005: Private File Storage and Notes Security Architecture

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: StudySphere Engineering Team

## Context
Students share study notes (PDF format). Exposing user uploads directly via static web servers or public URLs risks unauthorized access, directory traversal attacks, malicious executable uploads, and data leakage.

## Decision
We enforce a secure private storage pipeline:
1. **Private root**: Files are stored outside the public document root in private disk storage (or SeaweedFS in scale deployments).
2. **Sanitization & validation**:
   - Client-provided filenames and Content-Types are untrusted.
   - Files are validated against magic bytes (PDF header signature `%PDF`).
   - Hard request/file size limits are enforced (10 MB default).
3. **Randomized storage keys**: Each file is named with an opaque random UUID (`file_key`), preventing path traversal.
4. **Authorized download**: Every file download passes through an authenticated FastAPI endpoint (`/api/v1/notes/{id}/download`) that validates ownership or explicit user/group permissions.
5. **Audit logging**: Every upload and download event is recorded in the `audit_events` table without logging sensitive file contents.
