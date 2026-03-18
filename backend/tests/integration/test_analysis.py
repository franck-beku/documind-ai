import pytest
import io

def test_get_analysis_document_inexistant(client, auth_headers):
    res = client.get("/api/analysis/99999", headers=auth_headers)
    assert res.status_code == 404

def test_ask_document_inexistant(client, auth_headers):
    res = client.post(
        "/api/analysis/99999/ask",
        json={"question": "Test ?"},
        headers=auth_headers
    )
    assert res.status_code == 404

def test_ask_sans_token(client):
    res = client.post(
        "/api/analysis/1/ask",
        json={"question": "Test ?"}
    )
    assert res.status_code == 401