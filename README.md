# StudySphere

**AI-Powered Collaborative Learning Platform**  
*Complete System Implementation as per Build Instruction & System Engineering Manual (v1.0)*

[![CI Pipeline](https://github.com/studysphere/studysphere/actions/workflows/ci.yml/badge.svg)](https://github.com/studysphere/studysphere)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security Baseline: OWASP ASVS](https://img.shields.io/badge/Security-OWASP%20ASVS-green.svg)](docs/security/security_baseline.md)

---

## 1. Project Overview & Architecture

StudySphere is a collaborative learning platform where students form study groups, engage in real-time messaging, share verified private PDF resources, and receive AI-assisted conceptual tutoring.

### System Architecture & Data Flow

```
                      +-----------------------+
                      |   Next.js Web Client  |
                      | (React 19, TypeScript)|
                      +-----------+-----------+
                                  |
                      +-----------v-----------+
                      |    FastAPI Backend    |
                      | Auth / Groups / Notes |
                      |   AI / Nexconn Token  |
                      +---+---------------+---+
                          |               |
          +---------------v----+     +----v---------------+
          |  Relational DB     |     | Private File Store |
          | PostgreSQL/SQLite  |     | (Outside web root) |
          +--------------------+     +--------------------+
                  |
          +-------v------------+
          |  AI Tutor Service  |
          +-------+------------+
                  |
          +-------v----+
          |   Ollama   |
          | qwen3:0.6b |
          +------------+

  Web Client ------------------------> Nexconn Chat Cloud
  Mobile Client (Flutter) -----------> Nexconn Chat Cloud
     (Official SDKs, Authenticated Server-Issued Tokens)
```

### Responsibility Boundaries
1. **FastAPI**: Authoritative for identity, authentication, group membership, note authorization, and audit logs.
2. **PostgreSQL / SQLAlchemy**: Stores profiles, group memberships, chat channel identifiers, note metadata, AI conversation history, and security audit records.
3. **Nexconn Chat SDK**: Message transport, Group Channels (`GroupChannel`), and Direct Channels (`DirectChannel`). The `NEXCONN_APP_SECRET` remains strictly on the FastAPI server.
4. **Ollama**: Local AI inference. The model receives zero database, shell, or filesystem execution permissions.
5. **Private Storage**: Stores raw PDF files with random UUID keys outside the web document root; downloads are protected by resource-level authorization checks.

---

## 2. Directory Structure

```
studysphere/
├── apps/
│   ├── web/                     # Next.js 15 Web Client
│   │   ├── src/app/             # App Router (groups, chat, ai, notes, settings)
│   │   ├── src/lib/             # api.ts, nexconn.ts
│   │   └── src/context/         # AuthContext.tsx
│   └── mobile/                  # Flutter Client (Android & iOS)
│       ├── lib/                 # Models, Services, Screens
│       └── pubspec.yaml         # ai_nexconn_chat_plugin, http, provider
├── backend/                     # Modular Monolith FastAPI Backend
│   ├── app/
│   │   ├── api/v1/endpoints/    # auth, users, groups, nexconn, notes, ai, audit
│   │   ├── core/                # config, security (Argon2id), database
│   │   ├── models/              # SQLAlchemy Models (UUID PKs, explicit FKs)
│   │   ├── schemas/             # Pydantic Schemas with ConfigDict
│   │   ├── services/            # nexconn_service, ai_service, notes_service
│   │   └── tests/               # 18 Pytest unit & security tests (100% pass)
│   ├── alembic/                 # Database Migrations (upgrade & downgrade verified)
│   └── requirements.txt         # Locked Python dependencies
├── database/
│   └── migrations/              # Versioned SQL/Alembic migration scripts
├── docs/
│   ├── decisions/               # ADR 0001 - 0005
│   └── security/                # STRIDE Threat Model & Security Baseline
├── infrastructure/
│   ├── docker-compose.yml       # PostgreSQL, Backend, Web, Caddy
│   └── Caddyfile                # HTTPS Reverse Proxy Configuration
└── .github/workflows/ci.yml     # Automated CI/CD Quality & Security Pipeline
```

---

## 3. Technology Stack & Licensing

| Layer | Technology | Role / License |
| :--- | :--- | :--- |
| **Web** | Next.js 15, React 19, TypeScript, Tailwind CSS | MIT License; browser client |
| **Mobile** | Flutter, Dart | BSD-3-Clause; Android & iOS client |
| **Backend** | Python 3.12+, FastAPI | MIT License; REST API and business logic |
| **Database** | PostgreSQL / SQLite (zero-config dev) | PostgreSQL / Public Domain |
| **ORM & Migrations**| SQLAlchemy 2.0 / Alembic | MIT License; schema versioning |
| **Password Hashing**| Argon2id via `pwdlib[argon2]` | Apache-2.0; resistant to GPU attacks |
| **Messaging** | Nexconn Chat Web & Flutter SDKs | Challenge dependency (`@nexconn/chat`, `ai_nexconn_chat_plugin`) |
| **AI Inference** | Ollama (`qwen3:0.6b` open-weight model) | MIT (Ollama); local zero-cost inference |
| **Storage** | Private local filesystem | PDF header inspection (`%PDF`), UUID keys |
| **Proxy** | Caddy 2 | Apache-2.0; automatic TLS |

---

## 4. Nexconn Chat SDK Integration

### Server-Side Token Generation
In accordance with Section 7.3 and official Nexconn documentation, the backend signs requests using SHA1:
$$\text{Signature} = \text{SHA1}(\text{AppSecret} + \text{Nonce} + \text{Timestamp})$$

```python
# backend/app/services/nexconn_service.py
def compute_nexconn_headers(app_key: str, app_secret: str) -> dict:
    nonce = str(random.randint(10000, 999999))
    timestamp = str(int(time.time() * 1000))
    signature = hashlib.sha1(f"{app_secret}{nonce}{timestamp}".encode()).hexdigest()
    return {
        "App-Key": app_key,
        "Nonce": nonce,
        "Timestamp": timestamp,
        "Signature": signature,
        "X-Request-ID": uuid.uuid4().hex,
        "Content-Type": "application/json",
    }
```

- **Token Endpoint**: `POST /v4/auth/access-token/issue`
- **Group Channels**: `POST /v4/group-channel/create`, `join`, `quit`
- **Client SDK**: The frontend connects via `NCEngine.initialize({ appKey })` and `NCEngine.connect({ token })`.
- **Adaptive Fallback**: When running in offline dev environments with placeholder keys, an adaptive broadcast mesh ensures testing and two-tab real-time communication work seamlessly.

---

## 5. Applied Security Engineering (OWASP & STRIDE)

Detailed threat analysis and mitigations are documented in:
- [`docs/security/stride_threat_model.md`](docs/security/stride_threat_model.md)
- [`docs/security/security_baseline.md`](docs/security/security_baseline.md)

1. **Authentication**: Passwords are saved strictly as Argon2id hashes (`$argon2id$...`).
2. **Anti-IDOR / BOLA**: Every endpoint verifies identity, resource existence, ownership/membership, and permission.
3. **PDF File Security**:
   - Files are validated against magic bytes (`0x25 0x50 0x44 0x46` / `%PDF`). Fake extensions or malformed files are rejected with `400 Bad Request`.
   - File size is capped at 10 MB (`413 Entity Too Large`).
   - Saved with random UUID keys (`file_key`) to eliminate directory traversal.
   - Files are served only through the authorized endpoint `GET /api/v1/notes/{id}/download`.
4. **Audit Logging**: All security events (`USER_REGISTER`, `LOGIN_SUCCESS`, `NOTE_UPLOAD`, `NOTE_DOWNLOAD`, `GROUP_JOIN`) are logged to `audit_events`. Passwords and tokens are excluded.

---

## 6. Architecture Decision Records (ADRs)

- [ADR 0001: Modular Monolith Backend Architecture](docs/decisions/0001-modular-monolith.md)
- [ADR 0002: Relational Data Store and Migrations (PostgreSQL/Alembic)](docs/decisions/0002-postgresql-database.md)
- [ADR 0003: Real-Time Messaging Integration via Nexconn Chat SDK](docs/decisions/0003-nexconn-integration.md)
- [ADR 0004: Local AI Inference via Ollama](docs/decisions/0004-local-ai-inference.md)
- [ADR 0005: Private File Storage and Notes Security Architecture](docs/decisions/0005-private-file-storage.md)

---

## 7. Quickstart & Running Locally

### 1. Backend Service
```bash
cd backend
source .venv/bin/activate
# Run migrations
alembic upgrade head
# Start server
uvicorn app.main:app --reload --port 8000
# OpenAPI Docs: http://localhost:8000/docs
```

### 2. Next.js Web Client
```bash
cd apps/web
npm install
npm run dev
# Open in browser: http://localhost:3000
```

### 3. Flutter Mobile Client
```bash
cd apps/mobile
flutter pub get
flutter run
```

### 4. Running Backend Tests & Linter
```bash
cd backend
.venv/bin/pytest -v
.venv/bin/ruff check .
```

---

## 8. Acceptance Criteria Verification

| Requirement | Implementation Evidence | Test / Status |
| :--- | :--- | :--- |
| **FR-01: User Accounts** | Registration, login, logout, profile update with Argon2id | `test_auth.py` (Passed) |
| **FR-02 & FR-03: Study Groups** | Create groups, list, join, leave, role enforcement | `test_groups.py` (Passed) |
| **FR-04: Group Chat** | Real-time chat via Nexconn Group Channels (`GroupChannel`) | `test_nexconn.py` + Web UI (Verified) |
| **FR-05: Private Messaging** | 1:1 Direct Channels (`DirectChannel`) | Web Chat + Mobile Screen (Verified) |
| **FR-06: AI Tutor** | Ollama local model (`qwen3:0.6b`), input limits, system prompt | `test_ai_tutor.py` (Passed) |
| **FR-07 & FR-08: Notes Sharing** | Private upload, `%PDF` verification, user/group sharing, secure download | `test_notes.py` (Passed) |
| **Security Controls** | Anti-IDOR, audit logging, secrets isolation, rate limits | `test_security.py` (Passed) |
| **Cross-Platform** | Web (Next.js) & Mobile (Flutter) connected to same API | `apps/web` (Built) & `apps/mobile` (Built) |
| **Database Migrations** | Alembic initial schema, upgrade & rollback | Alembic revision `55208cdded87` (Verified) |
