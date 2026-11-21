from app.core.security import verify_password
from app.models.user import User


def test_register_and_argon2_hashing(client, db):
    email = "charlie@example.com"
    password = "SecurePassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Charlie", "email": email, "password": password},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # Verify password hash format in DB is Argon2id
    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.password_hash.startswith("$argon2id$")
    assert verify_password(password, user.password_hash)


def test_register_duplicate_email(client):
    payload = {"name": "Duplicate", "email": "dupe@example.com", "password": "Password123!"}
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409


def test_login_success_and_failure(client):
    email = "david@example.com"
    password = "CorrectPassword123!"
    client.post("/api/v1/auth/register", json={"name": "David", "email": email, "password": password})

    # Success
    res_success = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res_success.status_code == 200
    assert "access_token" in res_success.json()

    # Failure
    res_fail = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword"})
    assert res_fail.status_code == 401


def test_get_and_update_profile(client, alice_auth):
    headers = alice_auth["headers"]
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Alice Developer"

    # Update name
    update_res = client.patch("/api/v1/users/me", json={"name": "Alice Senior Dev"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Alice Senior Dev"


def test_logout_and_revocation(client, alice_auth):
    headers = alice_auth["headers"]
    # Check authorized access
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 200

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Subsequent request with revoked token should fail with 401
    revoked_res = client.get("/api/v1/users/me", headers=headers)
    assert revoked_res.status_code == 401
