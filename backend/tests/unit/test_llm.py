import pytest
from unittest.mock import patch


def test_fallback_sans_cle_api():
    """
    Vérifie que call_llm retourne un message clair
    quand la clé API Groq n'est pas configurée.
    On remplace directement la variable du module
    car il est déjà importé en mémoire.
    """
    import services.llm as llm_module
    original_key = llm_module.GROQ_API_KEY
    llm_module.GROQ_API_KEY = ""

    result = llm_module.call_llm("system", "user")

    # Restaure la clé originale après le test
    llm_module.GROQ_API_KEY = original_key

    assert isinstance(result, str)
    assert len(result) > 0


def test_appel_avec_erreur_reseau():
    """
    Vérifie que call_llm gère proprement une erreur réseau
    sans lever d'exception et retourne un message d'erreur lisible.
    """
    with patch("services.llm.requests.post") as mock_post:
        mock_post.side_effect = Exception("Network error")
        from services.llm import call_llm
        result = call_llm("system", "user")

        # Doit retourner une string non vide même en cas d'erreur
        assert isinstance(result, str)
        assert len(result) > 0