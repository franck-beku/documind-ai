import os
import pickle
import numpy as np
from services.llm import call_llm

# ── Configuration ─────────────────────────────────────────────────────────────
FAISS_DIR = "faiss_indexes"
os.makedirs(FAISS_DIR, exist_ok=True)

# Instance unique de l'embedder (chargé une seule fois en mémoire)
_embedder = None


# ── Chargement du modèle d'embeddings ─────────────────────────────────────────

def get_embedder():
    """
    Charge le modèle sentence-transformers une seule fois (singleton).
    Utilisé pour convertir le texte en vecteurs numériques.
    """
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ── Construction de l'index FAISS ─────────────────────────────────────────────

def build_index(doc_id: int, chunks: list):
    """
    Convertit les chunks en embeddings et construit l'index FAISS.
    Sauvegarde l'index et les chunks sur disque pour le Q&A.
    """
    try:
        import faiss
        embedder   = get_embedder()
        embeddings = np.array(
            embedder.encode(chunks, show_progress_bar=False)
        ).astype("float32")

        # Crée et remplit l'index vectoriel
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)

        # Sauvegarde l'index FAISS et les chunks correspondants
        faiss.write_index(index, os.path.join(FAISS_DIR, f"doc_{doc_id}.faiss"))
        with open(os.path.join(FAISS_DIR, f"doc_{doc_id}.pkl"), "wb") as f:
            pickle.dump(chunks, f)

        print(f"Index FAISS créé pour doc {doc_id} — {len(chunks)} chunks")

    except Exception as e:
        print(f"Erreur FAISS build: {e}")


# ── Recherche de passages pertinents ──────────────────────────────────────────

def search_similar(doc_id: int, query: str, top_k: int = 4) -> list:
    """
    Recherche les chunks les plus proches sémantiquement de la question.
    Retourne une liste vide si l'index n'existe pas.
    """
    try:
        import faiss
        index_path  = os.path.join(FAISS_DIR, f"doc_{doc_id}.faiss")
        chunks_path = os.path.join(FAISS_DIR, f"doc_{doc_id}.pkl")

        # Vérifie que l'index existe
        if not os.path.exists(index_path):
            return []

        # Charge l'index et les chunks
        index = faiss.read_index(index_path)
        with open(chunks_path, "rb") as f:
            chunks = pickle.load(f)

        # Convertit la question en vecteur et cherche les plus proches
        query_vec  = get_embedder().encode([query]).astype("float32")
        _, indices = index.search(query_vec, min(top_k, len(chunks)))

        return [chunks[i] for i in indices[0] if i < len(chunks)]

    except Exception as e:
        print(f"Erreur FAISS search: {e}")
        return []


# ── Pipeline Q&A (RAG) ────────────────────────────────────────────────────────

def ask_question(doc_id: int, question: str) -> str:
    """
    Pipeline RAG complet :
    1. Récupère les passages les plus pertinents via FAISS
    2. Envoie le contexte + la question au LLM
    3. Retourne une réponse basée uniquement sur le document

    Gère aussi les questions générales comme "ya-t-il des risques ?"
    """
    chunks = search_similar(doc_id, question, top_k=4)
    if not chunks:
        return "Index introuvable. Assurez-vous que l'analyse est terminée."

    # Assemble le contexte à partir des chunks pertinents
    context = "\n\n---\n\n".join(chunks)

    system = """Tu es un assistant juridique expert qui aide à comprendre des documents administratifs.
Tu réponds en français, de manière claire et concise.

Règles :
- Réponds UNIQUEMENT à partir des extraits du document fournis
- Si la question porte sur les risques, clauses importantes ou points d'attention, analyse le contenu et identifie les éléments potentiellement défavorables
- Si tu ne trouves vraiment pas l'information, dis : "Cette information ne figure pas dans les extraits disponibles du document."
- Ne dis jamais que tu ne peux pas aider — propose toujours une réponse utile basée sur le contenu"""

    prompt = f"""Extraits du document :

{context}

---

Question : {question}

Réponse :"""

    return call_llm(system, prompt)