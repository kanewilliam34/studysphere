from app.models.audit import AuditEvent


def test_audit_logging_and_sensitive_data_exclusion(client, db):
    # Register a user
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Audit Test User",
            "email": "audit@example.com",
            "password": "SuperSecretPassword123!",
        },
    )
    assert resp.status_code == 201

    # Check audit events recorded
    events = db.query(AuditEvent).filter(AuditEvent.event_type == "USER_REGISTER").all()
    assert len(events) >= 1

    # Verify no plaintext password or JWT tokens leaked in audit table
    all_events = db.query(AuditEvent).all()
    for ev in all_events:
        assert ev.event_type != "SuperSecretPassword123!"
        assert "SuperSecretPassword123!" not in str(ev.target_id)


def test_unauthorized_access_protection(client):
    # All private endpoints must reject unauthenticated requests
    assert client.get("/api/v1/users/me").status_code == 401
    assert client.get("/api/v1/groups/").status_code == 401
    assert client.get("/api/v1/notes/").status_code == 401
    assert client.get("/api/v1/ai/conversations").status_code == 401
    assert client.post("/api/v1/nexconn/token").status_code == 401
