# ── Imports ───────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from database import get_db
import os

router = APIRouter()

# ── Configuration JWT ─────────────────────────────────────────────────────────
# Clé secrète chargée depuis le fichier .env
# sha256_crypt est utilisé car bcrypt est incompatible avec Python 3.13
SECRET_KEY = os.getenv("SECRET_KEY", "documind-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token valide 24 heures

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Modèle de données ─────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    """Données reçues lors de l'inscription d'un utilisateur."""
    email: str
    password: str
    full_name: str = ""


# ── Fonctions utilitaires ─────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Chiffre le mot de passe avant de le stocker en base de données."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Vérifie si le mot de passe en clair correspond au hash stocké."""
    return pwd_context.verify(plain, hashed)


def create_token(data: dict) -> str:
    """
    Génère un token JWT signé avec une durée d'expiration de 24h.
    Le champ 'sub' est converti en string car la spec JWT l'exige.
    """
    to_encode = data.copy()

    # JWT requiert que 'sub' soit une string, pas un entier
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dépendance FastAPI — extrait et valide le token JWT.
    Reconvertit 'sub' en entier pour la requête SQL.
    Retourne l'utilisateur connecté ou lève une erreur 401.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Token invalide")

        # Reconvertit en entier pour la requête SQL
        user_id = int(user_id_str)

    except (JWTError, ValueError):
        # ValueError si la conversion int() échoue
        raise HTTPException(status_code=401, detail="Token invalide")

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return dict(user)


def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Dépendance FastAPI — vérifie que l'utilisateur connecté est admin.
    Lève une erreur 403 si ce n'est pas le cas.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register")
def register(user: UserCreate):
    """
    Inscription d'un nouvel utilisateur.
    Le premier compte créé devient automatiquement administrateur.
    Retourne un token JWT et les informations de l'utilisateur.
    """
    conn = get_db()

    # Vérifie si l'email est déjà utilisé
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?", (user.email,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Chiffre le mot de passe avant stockage
    hashed = hash_password(user.password)

    # Le premier utilisateur inscrit devient automatiquement admin
    count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    role = "admin" if count == 0 else "user"

    cursor = conn.execute(
        "INSERT INTO users (email, hashed_password, full_name, role) VALUES (?, ?, ?, ?)",
        (user.email, hashed, user.full_name, role)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    # Génère et retourne le token JWT avec l'id converti en string
    token = create_token({"sub": user_id})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":        user_id,
            "email":     user.email,
            "full_name": user.full_name,
            "role":      role
        }
    }


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    """
    Connexion d'un utilisateur existant.
    Vérifie l'email et le mot de passe puis retourne un token JWT.
    Note : OAuth2PasswordRequestForm utilise 'username' pour le champ email.
    """
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?", (form.username,)
    ).fetchone()
    conn.close()

    # Vérifie que l'utilisateur existe et que le mot de passe est correct
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    # Génère le token avec l'id de l'utilisateur
    token = create_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":        user["id"],
            "email":     user["email"],
            "full_name": user["full_name"],
            "role":      user["role"]
        }
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """
    Retourne les informations de l'utilisateur actuellement connecté.
    Le mot de passe hashé est explicitement exclu de la réponse par sécurité.
    """
    return {k: v for k, v in current_user.items() if k != "hashed_password"}