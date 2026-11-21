# StudySphere STRIDE Threat Model

Following Section 10.4 of the StudySphere System Engineering Manual.

| Threat | StudySphere Example | Attack Vector | Security Mitigation | Verification / Test |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates a student or moderator | Stolen credentials, token tampering, forged JWT | Argon2id password hashing, high-entropy JWT signing secrets, expiration validation, token revocation on logout. | `test_auth.py` |
| **Tampering** | Attacker modifies group ownership, group metadata, or note permissions | Bypassing client UI to PATCH resource fields | Server-side authorization checks on every state change; immutable owner fields; foreign key constraints. | `test_groups.py`, `test_notes.py` |
| **Repudiation** | Moderator bans a user or changes group settings and denies it | No audit trail for administrative operations | `audit_events` table recording `actor_id`, `event_type`, `target_type`, `target_id`, and `created_at`. | `test_security.py` |
| **Information Disclosure** | Private notes or study groups viewed by unauthorized users | IDOR / BOLA parameter tampering | Resource-level permission checks verifying membership or explicit `note_permissions`. Safe 404/403 responses that avoid leaking entity existence. | `test_notes.py`, `test_security.py` |
| **Denial of Service** | Flooding AI endpoint or uploading gigabyte files | Exhausting server memory, disk, or Ollama workers | Bounded request bodies (10MB limit), rate limits, Ollama client timeouts, async non-blocking I/O. | `test_ai_tutor.py`, `test_notes.py` |
| **Elevation of Privilege** | Normal student changes role to moderator or owner | Manipulating role parameters in membership requests | Role assignments restricted to group owners/admins; role escalation prevented by strict backend validation. | `test_groups.py` |
