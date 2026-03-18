from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from routers.auth import get_current_user
from database import get_db
from services.extractor import extract_text
from services.analyzer import analyze_document
import os, uuid, json

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Format non supporté. Formats acceptés : PDF, DOCX, JPG, PNG.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Le document dépasse la taille maximale de 50 MB.")

    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO documents (user_id, filename, original_filename, file_path, file_size, status) VALUES (?, ?, ?, ?, ?, ?)",
        (current_user["id"], unique_name, file.filename, file_path, len(content), "processing")
    )
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()

    background_tasks.add_task(run_analysis, doc_id, file_path, ext)

    return {"document_id": doc_id, "status": "processing", "message": "Analyse en cours… Merci de patienter."}


def run_analysis(doc_id: int, file_path: str, ext: str):
    conn = get_db()
    try:
        text, page_count = extract_text(file_path, ext)

        if page_count > 200:
            conn.execute("UPDATE documents SET status=? WHERE id=?", ("error_pages", doc_id))
            conn.commit()
            conn.close()
            return

        conn.execute("UPDATE documents SET page_count=?, status=? WHERE id=?", (page_count, "analyzing", doc_id))
        conn.commit()

        result = analyze_document(text, doc_id)

        conn.execute("""
            INSERT OR REPLACE INTO analyses (document_id, summary, key_info, clauses, risks, annotated_text)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            result["summary"],
            json.dumps(result["key_info"], ensure_ascii=False),
            json.dumps(result["clauses"], ensure_ascii=False),
            json.dumps(result["risks"], ensure_ascii=False),
            json.dumps(result["annotated_text"], ensure_ascii=False),
        ))
        conn.execute("UPDATE documents SET status=? WHERE id=?", ("done", doc_id))
        conn.commit()

    except Exception as e:
        print(f"Erreur analyse doc {doc_id}: {e}")
        conn.execute("UPDATE documents SET status=? WHERE id=?", ("error", doc_id))
        conn.commit()
    finally:
        conn.close()


@router.get("/")
def list_documents(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    docs = conn.execute(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return [dict(d) for d in docs]


@router.get("/{doc_id}")
def get_document(doc_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")
    return dict(doc)


@router.delete("/{doc_id}")
def delete_document(doc_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc["user_id"] != current_user["id"] and current_user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Accès refusé")

    if os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])

    conn.execute("DELETE FROM analyses WHERE document_id = ?", (doc_id,))
    conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    return {"message": "Document supprimé"}


@router.get("/{doc_id}/status")
def get_status(doc_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    doc = conn.execute("SELECT status FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return {"status": doc["status"]}