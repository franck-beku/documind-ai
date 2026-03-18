from fastapi import APIRouter, HTTPException, Depends
from routers.auth import require_admin
from database import get_db
import os

router = APIRouter()


@router.get("/stats")
def stats(admin: dict = Depends(require_admin)):
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    total_docs  = conn.execute("SELECT COUNT(*) as c FROM documents").fetchone()["c"]
    done_docs   = conn.execute("SELECT COUNT(*) as c FROM documents WHERE status='done'").fetchone()["c"]
    conn.close()
    return {
        "total_users":        total_users,
        "total_documents":    total_docs,
        "analyzed_documents": done_docs,
    }


@router.get("/documents")
def all_documents(admin: dict = Depends(require_admin)):
    conn = get_db()
    docs = conn.execute("""
        SELECT d.*, u.email as user_email, u.full_name as user_name
        FROM documents d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.uploaded_at DESC
    """).fetchall()
    conn.close()
    return [dict(d) for d in docs]


@router.get("/users")
def all_users(admin: dict = Depends(require_admin)):
    conn = get_db()
    users = conn.execute(
        "SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(u) for u in users]


@router.delete("/documents/{doc_id}")
def admin_delete_document(doc_id: int, admin: dict = Depends(require_admin)):
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document introuvable")

    if os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])

    conn.execute("DELETE FROM analyses WHERE document_id = ?", (doc_id,))
    conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    return {"message": "Document supprimé par l'admin"}