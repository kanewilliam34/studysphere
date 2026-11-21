import io


def create_mock_pdf_bytes(text: str = "Test Study Notes Content") -> bytes:
    # Valid PDF magic byte header
    return b"%PDF-1.4\n1 0 obj\n<< /Title (Notes) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n" + text.encode()


def test_upload_valid_pdf_and_download(client, alice_auth):
    headers = alice_auth["headers"]
    pdf_content = create_mock_pdf_bytes("Quantum Computing Principles")

    upload_res = client.post(
        "/api/v1/notes/",
        data={"title": "Quantum Physics Notes", "description": "Lecture 1 on Qubits"},
        files={"file": ("quantum.pdf", io.BytesIO(pdf_content), "application/pdf")},
        headers=headers,
    )
    assert upload_res.status_code == 201
    note_data = upload_res.json()
    assert note_data["title"] == "Quantum Physics Notes"
    assert note_data["file_key"].endswith(".pdf")
    # Assert randomized file key (not using client-provided filename "quantum.pdf")
    assert note_data["file_key"] != "quantum.pdf"

    # Alice can download her own note
    note_id = note_data["id"]
    download_res = client.get(f"/api/v1/notes/{note_id}/download", headers=headers)
    assert download_res.status_code == 200
    assert download_res.content == pdf_content


def test_reject_invalid_pdf_signature(client, alice_auth):
    headers = alice_auth["headers"]
    # Malicious or invalid file pretending to be PDF
    fake_content = b"<html><script>alert('malicious')</script></html>"

    res = client.post(
        "/api/v1/notes/",
        data={"title": "Fake Document"},
        files={"file": ("exploit.pdf", io.BytesIO(fake_content), "application/pdf")},
        headers=headers,
    )
    assert res.status_code == 400
    assert "Invalid file format" in res.json()["detail"]


def test_notes_authorization_and_sharing(client, alice_auth, bob_auth):
    alice_headers = alice_auth["headers"]
    bob_headers = bob_auth["headers"]

    # Alice uploads private note
    pdf_content = create_mock_pdf_bytes("Advanced Algorithms")
    upload_res = client.post(
        "/api/v1/notes/",
        data={"title": "Algorithms Deep Dive"},
        files={"file": ("algo.pdf", io.BytesIO(pdf_content), "application/pdf")},
        headers=alice_headers,
    )
    note_id = upload_res.json()["id"]

    # Bob initially cannot access or download the note (403 Forbidden)
    bob_download_res = client.get(f"/api/v1/notes/{note_id}/download", headers=bob_headers)
    assert bob_download_res.status_code == 403

    # Alice shares note with Bob
    share_res = client.post(
        f"/api/v1/notes/{note_id}/share",
        json={"user_id": bob_auth["user"]["id"]},
        headers=alice_headers,
    )
    assert share_res.status_code == 200

    # Bob can now download the shared note
    bob_download_res2 = client.get(f"/api/v1/notes/{note_id}/download", headers=bob_headers)
    assert bob_download_res2.status_code == 200
    assert bob_download_res2.content == pdf_content
