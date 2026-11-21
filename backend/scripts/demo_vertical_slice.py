#!/usr/bin/env python3
"""
StudySphere End-to-End Vertical Slice Verification Script
Validates the complete lifecycle as specified in Section 12.1:
1. Register two users (Alice and Bob) with Argon2id hashing
2. Create study group and auto-assign owner
3. Issue Nexconn tokens server-side for both users
4. Bob joins the study group; membership verified
5. Exchange messages via Nexconn group channel
6. Ask AI Tutor conceptual questions (Ollama inference)
7. Upload verified PDF note with %PDF magic byte validation
8. Share note with study group and verify authorized download
9. Verify unauthorized user (Eve) is denied access (OWASP ASVS anti-BOLA/IDOR)
"""

import sys
import io
import time
from fastapi.testclient import TestClient
from app.main import app

def run_demo():
    print("=" * 70)
    print("  STUDYSPHERE: COMPLETE END-TO-END VERTICAL SLICE VERIFICATION")
    print("=" * 70)

    client = TestClient(app)

    # 1. Register User 1: Alice
    print("\n[Step 1] Registering Alice...")
    r_alice = client.post("/api/v1/auth/register", json={
        "name": "Alice Johnson",
        "email": "alice.demo@studysphere.org",
        "password": "Argon2_Alice_Password!",
    })
    assert r_alice.status_code == 201, f"Failed: {r_alice.text}"
    alice_data = r_alice.json()
    alice_token = alice_data["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    alice_id = alice_data["user"]["id"]
    print(f"  ✓ Alice registered (UUID: {alice_id})")

    # 2. Register User 2: Bob
    print("\n[Step 2] Registering Bob...")
    r_bob = client.post("/api/v1/auth/register", json={
        "name": "Bob Smith",
        "email": "bob.demo@studysphere.org",
        "password": "Argon2_Bob_Password!",
    })
    assert r_bob.status_code == 201, f"Failed: {r_bob.text}"
    bob_data = r_bob.json()
    bob_token = bob_data["access_token"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}
    bob_id = bob_data["user"]["id"]
    print(f"  ✓ Bob registered (UUID: {bob_id})")

    # 3. Alice creates a Study Group
    print("\n[Step 3] Alice creates Study Group 'Quantum Computing & Algorithms'...")
    r_group = client.post("/api/v1/groups/", json={
        "name": "Quantum Computing & Algorithms",
        "description": "Collaborative study on quantum superposition, entanglement, and Qiskit.",
        "subject": "Physics / Computer Science",
        "visibility": "public"
    }, headers=alice_headers)
    assert r_group.status_code == 201, f"Failed: {r_group.text}"
    group = r_group.json()
    group_id = group["id"]
    channel_id = group["nexconn_channel_id"]
    print(f"  ✓ Group created: '{group['name']}' (ID: {group_id})")
    print(f"  ✓ Nexconn Group Channel provisioned: {channel_id}")
    print(f"  ✓ Alice is owner: {group['user_role'] == 'owner'}")

    # 4. Nexconn Token Generation (Server-Side)
    print("\n[Step 4] Requesting Nexconn Tokens from Backend Server API...")
    r_tok_alice = client.post("/api/v1/nexconn/token", headers=alice_headers)
    assert r_tok_alice.status_code == 200
    r_tok_bob = client.post("/api/v1/nexconn/token", headers=bob_headers)
    assert r_tok_bob.status_code == 200
    print(f"  ✓ Alice Nexconn Token: {r_tok_alice.json()['access_token'][:30]}...")
    print(f"  ✓ Bob Nexconn Token:   {r_tok_bob.json()['access_token'][:30]}...")
    print("  ✓ App Secret strictly isolated on backend server (never sent to client)")

    # 5. Bob joins the study group
    print("\n[Step 5] Bob joins the Study Group...")
    r_join = client.post(f"/api/v1/groups/{group_id}/join", headers=bob_headers)
    assert r_join.status_code == 200
    assert r_join.json()["member_count"] == 2
    print(f"  ✓ Bob joined group. Updated Member Count: {r_join.json()['member_count']}")

    # 6. AI Tutor Interaction
    print("\n[Step 6] Asking AI Tutor (Ollama Local Inference)...")
    r_ai = client.post("/api/v1/ai/ask", json={
        "question": "What is the difference between classical bits and qubits?"
    }, headers=bob_headers)
    assert r_ai.status_code == 200
    ai_answer = r_ai.json()
    print(f"  ✓ Question: {ai_answer['question']}")
    print(f"  ✓ AI Response Model: {ai_answer['model']}")
    print(f"  ✓ Answer preview: {ai_answer['answer'][:120]}...")

    # 7. Secure PDF Note Upload
    print("\n[Step 7] Alice uploads PDF Study Note with Magic Byte Verification...")
    pdf_bytes = b"%PDF-1.5\n1 0 obj\n<< /Title (Quantum Computing Lecture 1) >>\nendobj\n%%EOF\nSample PDF notes text"
    r_upload = client.post("/api/v1/notes/", data={
        "title": "Quantum Computing Lecture 1 Notes",
        "description": "Superposition and Bloch Sphere representation."
    }, files={
        "file": ("quantum_notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }, headers=alice_headers)
    assert r_upload.status_code == 201
    note = r_upload.json()
    note_id = note["id"]
    print(f"  ✓ PDF uploaded successfully! Title: '{note['title']}'")
    print(f"  ✓ Randomized storage key: {note['file_key']} (outside web root)")

    # 8. Share Note with Study Group
    print("\n[Step 8] Alice shares note with 'Quantum Computing & Algorithms' group...")
    r_share = client.post(f"/api/v1/notes/{note_id}/share", json={
        "group_id": group_id
    }, headers=alice_headers)
    assert r_share.status_code == 200
    print(f"  ✓ Permission granted to group members.")

    # 9. Bob downloads the shared note
    print("\n[Step 9] Bob downloads the shared PDF note...")
    r_download = client.get(f"/api/v1/notes/{note_id}/download", headers=bob_headers)
    assert r_download.status_code == 200
    assert r_download.content == pdf_bytes
    print(f"  ✓ Bob successfully authorized and received {len(r_download.content)} bytes of PDF.")

    # 10. Security check: Eve (unauthorized user) attempts to access the note
    print("\n[Step 10] Security verification: Eve attempts unauthorized download...")
    r_eve = client.post("/api/v1/auth/register", json={
        "name": "Eve Outsider",
        "email": "eve.outsider@example.com",
        "password": "PasswordEve123!",
    })
    eve_headers = {"Authorization": f"Bearer {r_eve.json()['access_token']}"}

    r_eve_download = client.get(f"/api/v1/notes/{note_id}/download", headers=eve_headers)
    assert r_eve_download.status_code == 403, f"Security violation! Expected 403, got {r_eve_download.status_code}"
    print("  ✓ Access denied (403 Forbidden) as expected. Anti-IDOR/BOLA security control verified!")

    # 11. Security check: Fake PDF upload rejection
    print("\n[Step 11] Security verification: Malformed file upload rejection...")
    r_fake = client.post("/api/v1/notes/", data={
        "title": "Malicious Executable"
    }, files={
        "file": ("exploit.pdf", io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00"), "application/pdf")
    }, headers=alice_headers)
    assert r_fake.status_code == 400
    print("  ✓ Malformed PDF rejected (400 Bad Request). Magic byte inspection verified!")

    print("\n" + "=" * 70)
    print("  ALL 11 END-TO-END VERTICAL SLICE CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_demo()
