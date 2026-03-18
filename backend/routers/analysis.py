# ── Imports ───────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from routers.auth import get_current_user
from database import get_db
from services.rag import ask_question
from services.pdf_report import generate_pdf_report
import json

router = APIRouter()


# ── Récupération de l'analyse ─────────────────────────────────────────────────
@router.get("/{doc_id}")
def get_analysis(doc_id: int, current_user: dict = Depends(get_current_user)):
    """
    Retourne l'analyse complète d'un document :
    résumé, informations clés, clauses, risques et texte annoté.
    """
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc["user_id"] != current_user["id"] and current_user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Accès refusé")

    analysis = conn.execute(
        "SELECT * FROM analyses WHERE document_id = ?", (doc_id,)
    ).fetchone()
    conn.close()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non disponible")

    return {
        "document_id":    doc_id,
        "summary":        analysis["summary"],
        "key_info":       json.loads(analysis["key_info"]       or "[]"),
        "clauses":        json.loads(analysis["clauses"]        or "[]"),
        "risks":          json.loads(analysis["risks"]          or "[]"),
        "annotated_text": json.loads(analysis["annotated_text"] or "[]"),
    }


# ── Questions-Réponses (RAG) ───────────────────────────────────────────────────
class QuestionRequest(BaseModel):
    """Corps de la requête pour poser une question sur le document."""
    question: str


@router.post("/{doc_id}/ask")
def ask(doc_id: int, body: QuestionRequest, current_user: dict = Depends(get_current_user)):
    """
    Répond à une question basée uniquement sur le contenu du document.
    Utilise l'architecture RAG (FAISS + LLM).
    """
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc["user_id"] != current_user["id"] and current_user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Accès refusé")
    conn.close()

    answer = ask_question(doc_id, body.question)
    return {"question": body.question, "answer": answer}


# ── Export rapport PDF ────────────────────────────────────────────────────────
@router.get("/{doc_id}/export")
def export_pdf(doc_id: int, current_user: dict = Depends(get_current_user)):
    """
    Génère et retourne un rapport PDF téléchargeable contenant :
    résumé, informations clés, clauses détectées et alertes de risque.
    """
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc["user_id"] != current_user["id"] and current_user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Accès refusé")

    analysis = conn.execute(
        "SELECT * FROM analyses WHERE document_id = ?", (doc_id,)
    ).fetchone()
    conn.close()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non disponible")

    # Génère le PDF avec les données de l'analyse
    pdf_bytes = generate_pdf_report(
        dict(doc),
        {
            "summary": analysis["summary"],
            "key_info": json.loads(analysis["key_info"]  or "[]"),
            "risks":    json.loads(analysis["risks"]     or "[]"),
            "clauses":  json.loads(analysis["clauses"]   or "[]"),
        }
    )

    # Retourne le PDF comme fichier téléchargeable
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=rapport_documind_{doc_id}.pdf"
        }
    )