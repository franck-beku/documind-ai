import pytest
from services.analyzer import chunk_text, parse_json_safe

def test_chunk_text_divise_correctement():
    text   = " ".join([f"mot{i}" for i in range(1000)])
    chunks = chunk_text(text, size=100, overlap=10)
    assert len(chunks) > 1
    assert all(isinstance(c, str) for c in chunks)

def test_chunk_text_texte_court():
    text   = "Bonjour monde"
    chunks = chunk_text(text, size=100, overlap=10)
    assert len(chunks) == 1
    assert chunks[0] == "Bonjour monde"

def test_chunk_overlap():
    text   = " ".join([f"mot{i}" for i in range(200)])
    chunks = chunk_text(text, size=100, overlap=20)
    # Avec overlap, les chunks se chevauchent
    assert len(chunks) >= 2

def test_parse_json_safe_valide():
    raw    = '[{"type": "montant", "valeur": "10€"}]'
    result = parse_json_safe(raw, [])
    assert len(result) == 1
    assert result[0]["type"] == "montant"

def test_parse_json_safe_json_dans_texte():
    raw    = 'Voici le résultat : [{"type": "date", "valeur": "2026"}] fin.'
    result = parse_json_safe(raw, [])
    assert len(result) == 1
    assert result[0]["valeur"] == "2026"

def test_parse_json_safe_invalide_retourne_fallback():
    raw    = "Ce n'est pas du JSON valide"
    result = parse_json_safe(raw, [])
    assert result == []

def test_parse_json_safe_vide():
    result = parse_json_safe("", [])
    assert result == []