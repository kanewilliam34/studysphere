

def test_create_and_list_groups(client, alice_auth):
    headers = alice_auth["headers"]
    res = client.post(
        "/api/v1/groups/",
        json={
            "name": "Machine Learning Study Circle",
            "description": "Collaborative group studying deep learning and transformer architectures",
            "subject": "Computer Science",
            "visibility": "public",
        },
        headers=headers,
    )
    assert res.status_code == 201
    group_data = res.json()
    assert group_data["name"] == "Machine Learning Study Circle"
    assert group_data["member_count"] == 1
    assert group_data["is_member"] is True
    assert group_data["user_role"] == "owner"
    assert group_data["nexconn_channel_id"] is not None

    # List groups
    list_res = client.get("/api/v1/groups/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_join_and_leave_group(client, alice_auth, bob_auth):
    alice_headers = alice_auth["headers"]
    bob_headers = bob_auth["headers"]

    # Alice creates a public group
    create_res = client.post(
        "/api/v1/groups/",
        json={
            "name": "Distributed Systems",
            "description": "Raft, Paxos, and CAP theorem",
            "subject": "Systems",
            "visibility": "public",
        },
        headers=alice_headers,
    )
    group_id = create_res.json()["id"]

    # Bob joins the group
    join_res = client.post(f"/api/v1/groups/{group_id}/join", headers=bob_headers)
    assert join_res.status_code == 200
    assert join_res.json()["member_count"] == 2
    assert join_res.json()["is_member"] is True

    # Bob leaves the group
    leave_res = client.post(f"/api/v1/groups/{group_id}/leave", headers=bob_headers)
    assert leave_res.status_code == 200

    # Verify Bob is no longer a member
    get_res = client.get(f"/api/v1/groups/{group_id}", headers=bob_headers)
    assert get_res.status_code == 200
    assert get_res.json()["is_member"] is False
    assert get_res.json()["member_count"] == 1


def test_private_group_authorization(client, alice_auth, bob_auth):
    alice_headers = alice_auth["headers"]
    bob_headers = bob_auth["headers"]

    # Alice creates private group
    create_res = client.post(
        "/api/v1/groups/",
        json={
            "name": "Secret Study Lab",
            "description": "Private project discussions",
            "visibility": "private",
        },
        headers=alice_headers,
    )
    group_id = create_res.json()["id"]

    # Alice can view
    res_alice = client.get(f"/api/v1/groups/{group_id}", headers=alice_headers)
    assert res_alice.status_code == 200

    # Bob cannot view private group without membership (403 Forbidden)
    res_bob = client.get(f"/api/v1/groups/{group_id}", headers=bob_headers)
    assert res_bob.status_code == 403
