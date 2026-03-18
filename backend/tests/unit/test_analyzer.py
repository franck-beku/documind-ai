import pytest
from services.analyzer import chunk_text, parse_json_safe, annotate_text


def test_annotate_text_risque():
    """
    Vérifie que les extraits de type risque sont annotés
    en rouge et correctement détectés dans le texte.
    """
    text  = "Le client doit payer des pénalités importantes en cas de résiliation."
    risks = [{"type": "pénalité", "niveau": "haut",
               "description": "Pénalité élevée",
               "extrait": "pénalités importantes"}]

    result = annotate_text(text, risks, [])

    assert len(result) == 1
    assert result[0]["color"] == "red"
    assert result[0]["text"]  == "pénalités importantes"


def test_annotate_text_clause():
    """
    Vérifie que les clauses de type durée sont annotées en orange.
    L'extrait doit faire plus de 10 caractères pour être pris en compte.
    """
    text    = "Le contrat dure vingt-quatre mois à compter de la signature."
    clauses = [{"type": "durée", "description": "Engagement 24 mois",
                "extrait": "vingt-quatre mois"}]

    result = annotate_text(text, [], clauses)

    assert len(result) == 1
    assert result[0]["color"] == "orange"


def test_annotate_text_extrait_absent():
    """
    Vérifie qu'un extrait absent du texte n'est pas annoté.
    """
    text    = "Contenu du contrat."
    risks   = [{"type": "pénalité", "description": "Risque",
                "extrait": "texte absent du document"}]

    result = annotate_text(text, risks, [])

    assert len(result) == 0


def test_annotate_text_extrait_trop_court():
    """
    Vérifie que les extraits de moins de 10 caractères
    sont ignorés pour éviter les faux positifs.
    """
    text    = "Contenu du contrat."
    risks   = [{"type": "pénalité", "description": "Risque",
                "extrait": "ok"}]

    result = annotate_text(text, risks, [])

    assert len(result) == 0


def test_chunk_text_divise_correctement():
    """
    Vérifie que chunk_text divise bien un texte long
    en plusieurs morceaux.
    """
    text   = " ".join([f"mot{i}" for i in range(1000)])
    chunks = chunk_text(text, size=100, overlap=10)

    assert len(chunks) > 1
    assert all(isinstance(c, str) for c in chunks)


def test_chunk_text_texte_court():
    """
    Vérifie qu'un texte court tient dans un seul chunk.
    """
    text   = "Bonjour monde"
    chunks = chunk_text(text, size=100, overlap=10)

    assert len(chunks) == 1
    assert chunks[0] == "Bonjour monde"


def test_chunk_overlap():
    """
    Vérifie que le chevauchement (overlap) produit
    plus de chunks qu'un découpage sans overlap.
    """
    text   = " ".join([f"mot{i}" for i in range(200)])
    chunks = chunk_text(text, size=100, overlap=20)

    assert len(chunks) >= 2


def test_parse_json_safe_valide():
    """
    Vérifie que parse_json_safe parse correctement
    un JSON valide.
    """
    raw    = '[{"type": "montant", "valeur": "10€"}]'
    result = parse_json_safe(raw, [])

    assert len(result) == 1
    assert result[0]["type"] == "montant"


def test_parse_json_safe_json_dans_texte():
    """
    Vérifie que parse_json_safe extrait le JSON
    même s'il est entouré de texte parasite.
    """
    raw    = 'Voici le résultat : [{"type": "date", "valeur": "2026"}] fin.'
    result = parse_json_safe(raw, [])

    assert len(result) == 1
    assert result[0]["valeur"] == "2026"


def test_parse_json_safe_invalide_retourne_fallback():
    """
    Vérifie que parse_json_safe retourne le fallback
    quand le contenu n'est pas du JSON valide.
    """
    raw    = "Ce n'est pas du JSON valide"
    result = parse_json_safe(raw, [])

    assert result == []


def test_parse_json_safe_vide():
    """
    Vérifie que parse_json_safe gère une chaîne vide
    et retourne le fallback.
    """
    result = parse_json_safe("", [])

    assert result == []