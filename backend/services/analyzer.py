import json
import re
from services.llm import call_llm
from services.rag import build_index


# ── Découpage du texte en chunks ──────────────────────────────────────────────

def chunk_text(text: str, size: int = 800, overlap: int = 100) -> list:
    """
    Découpe le texte en morceaux (chunks) avec chevauchement.
    Le chevauchement évite de couper des phrases importantes.
    """
    words  = text.split()
    chunks = []
    i      = 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + size]))
        i += size - overlap
    return chunks


# ── Point d'entrée principal ──────────────────────────────────────────────────

def analyze_document(text: str, doc_id: int) -> dict:
    """
    Pipeline d'analyse complet et optimisé.
    Un seul appel LLM au lieu de 6 — réduit le temps de 50s à ~10s.
    """
    # 1. Découpe le texte et construit l'index FAISS pour le Q&A
    chunks = chunk_text(text)
    build_index(doc_id, chunks)

    # 2. Tronque le texte pour respecter la limite de contexte du LLM
    truncated = text[:3000]

    # 3. Analyse complète en un seul appel
    result = analyze_all_in_one(truncated)

    # 4. Génère les annotations à partir des résultats
    annotations = annotate_text(
        truncated,
        result.get("risks",   []),
        result.get("clauses", [])
    )

    return {
        "summary":        result.get("summary",  "Analyse non disponible."),
        "key_info":       result.get("key_info", []),
        "clauses":        result.get("clauses",  []),
        "risks":          result.get("risks",    []),
        "annotated_text": annotations,
    }


# ── Analyse complète en un seul appel LLM ─────────────────────────────────────

def analyze_all_in_one(text: str) -> dict:
    """
    Effectue toute l'analyse en un seul appel Groq.
    Retourne un dict avec summary, key_info, clauses et risks.
    Réduit le temps d'analyse de ~50s à ~10s.
    """
    system = (
        "Tu es un assistant juridique expert. "
        "Réponds UNIQUEMENT en JSON valide, sans texte avant ou après."
    )

    prompt = f"""Analyse ce document administratif et retourne UN SEUL objet JSON avec ces 4 clés :

1. "summary"  : string avec 5 points séparés par \\n, chaque point commence par •
2. "key_info" : tableau d'objets avec les champs : type, valeur, contexte
   Types possibles : montant, date, durée, organisation, obligation, condition_paiement
3. "clauses"  : tableau d'objets avec les champs : type, description, extrait
   Types possibles : paiement, durée, obligation, restriction, responsabilité, résiliation
4. "risks"    : tableau d'objets avec les champs : type, niveau, description, extrait
   Types possibles : pénalité, frais_cachés, renouvellement_automatique, engagement_long, résiliation_difficile, augmentation_prix
   Niveaux possibles : haut, moyen, faible

Document :
{text}

Retourne UNIQUEMENT le JSON, sans explication :"""

    raw    = call_llm(system, prompt, temperature=0.1)
    result = parse_json_safe_dict(raw)

    # Valeurs par défaut si le parsing échoue
    return {
        "summary":  result.get("summary",  "Analyse non disponible."),
        "key_info": result.get("key_info", []),
        "clauses":  result.get("clauses",  []),
        "risks":    result.get("risks",    []),
    }


# ── Annotation du texte ───────────────────────────────────────────────────────

def annotate_text(text: str, risks: list, clauses: list) -> list:
    """
    Génère une liste de passages surlignés avec leur couleur et type.
    Les passages doivent être présents dans le texte et faire plus de 10 caractères.
    """
    color_map = {
        "pénalité":                  "red",
        "frais_cachés":              "red",
        "renouvellement_automatique":"red",
        "engagement_long":           "red",
        "résiliation_difficile":     "red",
        "augmentation_prix":         "red",
        "paiement":                  "green",
        "durée":                     "orange",
        "obligation":                "blue",
        "restriction":               "purple",
        "responsabilité":            "orange",
        "résiliation":               "orange",
    }

    annotations = []

    # Annotations des risques en rouge
    for risk in risks:
        extrait = risk.get("extrait", "")
        if extrait and len(extrait) > 10 and extrait in text:
            annotations.append({
                "text":    extrait,
                "color":   "red",
                "label":   risk.get("type", "risque"),
                "tooltip": risk.get("description", ""),
            })

    # Annotations des clauses avec couleur selon le type
    for clause in clauses:
        extrait = clause.get("extrait", "")
        if extrait and len(extrait) > 10 and extrait in text:
            color = color_map.get(clause.get("type", ""), "orange")
            annotations.append({
                "text":    extrait,
                "color":   color,
                "label":   clause.get("type", "clause"),
                "tooltip": clause.get("description", ""),
            })

    return annotations


# ── Parsers JSON ──────────────────────────────────────────────────────────────

def parse_json_safe(raw: str, fallback):
    """
    Tente de parser un JSON depuis une réponse LLM.
    Gère les cas où le JSON est entouré de texte parasite.
    Retourne le fallback si le parsing échoue.
    """
    # Tentative de parse direct
    try:
        return json.loads(raw)
    except Exception:
        pass

    # Extraction d'un tableau JSON depuis le texte
    match = re.search(r'\[.*?\]', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass

    return fallback


def parse_json_safe_dict(raw: str) -> dict:
    """
    Tente de parser un objet JSON (dict) depuis une réponse LLM.
    Gère les blocs markdown ```json ... ``` et le texte parasite.
    Retourne un dict vide si le parsing échoue.
    """
    # Supprime les blocs markdown si présents
    cleaned = re.sub(r'```json\s*', '', raw)
    cleaned = re.sub(r'```\s*',     '', cleaned).strip()

    # Tentative de parse direct
    try:
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
    except Exception:
        pass

    # Extraction d'un objet JSON depuis le texte
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, dict):
                return result
        except Exception:
            pass

    return {}