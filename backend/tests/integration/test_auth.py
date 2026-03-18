import pytest

def test_register_succes(client):
    res = client.post("/api/auth/register", json={
        "email":     "nouveau@test.com",
        "password":  "motdepasse123",
        "full_name": "Nouveau User"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["user"]["email"] == "nouveau@test.com"

def test_register_email_deja_utilise(client):
    client.post("/api/auth/register", json={
        "email": "double@test.com", "password": "pass123", "full_name": "Test"
    })
    res = client.post("/api/auth/register", json={
        "email": "double@test.com", "password": "pass123", "full_name": "Test"
    })
    assert res.status_code == 400
    assert "déjà utilisé" in res.json()["detail"]

def test_login_succes(client):
    client.post("/api/auth/register", json={
        "email": "login@test.com", "password": "pass123", "full_name": "Login"
    })
    res = client.post("/api/auth/login", data={
        "username": "login@test.com", "password": "pass123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_login_mauvais_mot_de_passe(client):
    res = client.post("/api/auth/login", data={
        "username": "login@test.com", "password": "mauvais"
    })
    assert res.status_code == 401

def test_login_email_inexistant(client):
    res = client.post("/api/auth/login", data={
        "username": "inexistant@test.com", "password": "pass123"
    })
    assert res.status_code == 401

def test_me_avec_token_valide(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert "email" in res.json()
    assert "hashed_password" not in res.json()

def test_me_sans_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_me_token_invalide(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer tokeninvalide"})
    assert res.status_code == 401