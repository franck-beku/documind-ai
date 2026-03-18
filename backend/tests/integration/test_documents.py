import pytest
import io

def test_upload_pdf_valide(client, auth_headers):
    fake_pdf = b"%PDF-1.4 contenu test"
    res = client.post(
        "/api/documents/upload",
        files={"file": ("test.pdf", io.BytesIO(fake_pdf), "application/pdf")},
        headers=auth_headers
    )
    assert res.status_code == 200
    assert "document_id" in res.json()
    assert res.json()["status"] == "processing"

def test_upload_format_refuse(client, auth_headers):
    res = client.post(
        "/api/documents/upload",
        files={"file": ("test.exe", io.BytesIO(b"contenu"), "application/octet-stream")},
        headers=auth_headers
    )
    assert res.status_code == 400
    assert "Format non supporté" in res.json()["detail"]

def test_upload_sans_token(client):
    res = client.post(
        "/api/documents/upload",
        files={"file": ("test.pdf", io.BytesIO(b"%PDF"), "application/pdf")}
    )
    assert res.status_code == 401

def test_list_documents(client, auth_headers):
    res = client.get("/api/documents/", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_delete_document(client, auth_headers):
    # Upload d'abord
    fake_pdf = b"%PDF-1.4 test delete"
    upload   = client.post(
        "/api/documents/upload",
        files={"file": ("delete_me.pdf", io.BytesIO(fake_pdf), "application/pdf")},
        headers=auth_headers
    )
    doc_id = upload.json()["document_id"]

    # Suppression
    res = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert res.status_code == 200
    assert "supprimé" in res.json()["message"]

def test_get_document_inexistant(client, auth_headers):
    res = client.get("/api/documents/99999", headers=auth_headers)
    assert res.status_code == 404