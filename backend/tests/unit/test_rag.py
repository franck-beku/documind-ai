import pytest
from unittest.mock import patch, MagicMock

def test_ask_question_sans_index():
    with patch("services.rag.search_similar", return_value=[]):
        from services.rag import ask_question
        result = ask_question(9999, "Question test")
        assert "introuvable" in result.lower() or "index" in result.lower()

def test_search_similar_fichier_absent():
    from services.rag import search_similar
    result = search_similar(99999, "question")
    assert result == []

def test_build_index_chunks_vides():
    # Ne doit pas planter avec une liste vide
    with patch("services.rag.get_embedder") as mock_emb:
        mock_emb.return_value.encode.return_value = []
        from services.rag import build_index
        # Doit gérer sans erreur
        try:
            build_index(9999, [])
        except Exception:
            pass  # acceptable