import hashlib

from app.services.nexconn_service import compute_nexconn_headers


def test_nexconn_signature_algorithm():
    app_secret = "secret123"
    headers = compute_nexconn_headers("app_key_abc", app_secret)

    # Signature must match sha1(appSecret + nonce + timestamp)
    expected_raw = f"{app_secret}{headers['Nonce']}{headers['Timestamp']}"
    expected_sig = hashlib.sha1(expected_raw.encode("utf-8")).hexdigest()

    assert headers["Signature"] == expected_sig
    assert len(headers["Signature"]) == 40
    assert "App-Key" in headers
    assert "X-Request-ID" in headers


def test_issue_nexconn_token_authenticated(client, alice_auth, bob_auth):
    # Unauthenticated request rejected
    unauth_res = client.post("/api/v1/nexconn/token")
    assert unauth_res.status_code == 401

    # Alice obtains token
    alice_res = client.post("/api/v1/nexconn/token", headers=alice_auth["headers"])
    assert alice_res.status_code == 200
    alice_data = alice_res.json()
    assert alice_data["user_id"] == alice_auth["user"]["id"]
    assert "access_token" in alice_data
    assert "app_key" in alice_data

    # Bob obtains token
    bob_res = client.post("/api/v1/nexconn/token", headers=bob_auth["headers"])
    assert bob_res.status_code == 200
    bob_data = bob_res.json()
    assert bob_data["user_id"] == bob_auth["user"]["id"]

    # The two accounts receive independent credentials
    assert alice_data["access_token"] != bob_data["access_token"]
