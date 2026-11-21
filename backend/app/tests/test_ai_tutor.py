

def test_ai_ask_and_conversation_flow(client, alice_auth):
    headers = alice_auth["headers"]

    # Ask a question (creates a conversation automatically)
    ask_res = client.post(
        "/api/v1/ai/ask",
        json={"question": "What is binary search algorithm and its time complexity?"},
        headers=headers,
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "conversation_id" in data
    assert "Binary Search" in data["answer"]
    conv_id = data["conversation_id"]

    # Retrieve conversation messages
    conv_res = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=headers)
    assert conv_res.status_code == 200
    conv_data = conv_res.json()
    assert len(conv_data["messages"]) >= 2
    assert conv_data["messages"][0]["role"] == "user"
    assert conv_data["messages"][1]["role"] == "assistant"


def test_ai_conversation_ownership_boundary(client, alice_auth, bob_auth):
    alice_headers = alice_auth["headers"]
    bob_headers = bob_auth["headers"]

    # Alice creates conversation
    create_res = client.post(
        "/api/v1/ai/conversations",
        json={"title": "Discrete Mathematics Revision"},
        headers=alice_headers,
    )
    conv_id = create_res.json()["id"]

    # Alice can view
    res_alice = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=alice_headers)
    assert res_alice.status_code == 200

    # Bob cannot view Alice's conversation (404 / access denied)
    res_bob = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=bob_headers)
    assert res_bob.status_code == 404


def test_ai_input_length_limit(client, alice_auth):
    headers = alice_auth["headers"]
    oversized_question = "Explain this! " * 400  # > 4000 chars

    res = client.post(
        "/api/v1/ai/ask",
        json={"question": oversized_question},
        headers=headers,
    )
    assert res.status_code in [400, 422]
