import pytest

def test_stats_admin(client, auth_headers):
    res = client.get("/api/admin/stats", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users"        in data
    assert "total_documents"    in data
    assert "analyzed_documents" in data

def test_stats_refuse_non_admin(client, user_headers):
    res = client.get("/api/admin/stats", headers=user_headers)
    assert res.status_code == 403

def test_all_users_admin(client, auth_headers):
    res = client.get("/api/admin/users", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_all_documents_admin(client, auth_headers):
    res = client.get("/api/admin/documents", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_all_documents_refuse_non_admin(client, user_headers):
    res = client.get("/api/admin/documents", headers=user_headers)
    assert res.status_code == 403

def test_delete_document_inexistant_admin(client, auth_headers):
    res = client.delete("/api/admin/documents/99999", headers=auth_headers)
    assert res.status_code == 404