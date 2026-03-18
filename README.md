# DocuMind AI — Assistant intelligent d'analyse de documents

DocuMind AI est une application web qui analyse automatiquement les documents administratifs complexes (contrats, assurances, factures, conditions d'utilisation) et aide les utilisateurs à comprendre leurs droits et obligations avant de signer.

---

## Fonctionnalités

- **Analyse automatique** — résumé clair, extraction des informations clés
- **Détection des risques** — pénalités, renouvellement automatique, engagements longs
- **Annotation visuelle** — passages surlignés par couleur selon leur type
- **Questions-Réponses** — posez des questions sur le document (architecture RAG)
- **Export PDF** — rapport d'analyse téléchargeable
- **Gestion des rôles** — utilisateur et administrateur
- **OCR** — support des documents scannés (JPG, PNG, PDF scanné)

---

## Technologies utilisées

### Backend
- Python 3.13 + FastAPI
- SQLite (base de données)
- FAISS + sentence-transformers (recherche vectorielle RAG)
- Groq API — LLM llama-3.1-8b-instant (gratuit)
- PyMuPDF, pytesseract (extraction de texte et OCR)
- ReportLab (génération PDF)
- JWT (authentification)

### Frontend
- React 18 + Vite
- Tailwind CSS
- Lucide React (icônes)
- Axios (appels API)

### Tests
- pytest + httpx (backend)
- Vitest + Testing Library (frontend)

---

## Architecture
```
documind-ai/
├── backend/
│   ├── main.py              # Point d'entrée FastAPI
│   ├── database.py          # SQLite
│   ├── routers/             # auth, documents, analysis, admin
│   └── services/            # extractor, analyzer, rag, llm, pdf_report
└── frontend/
    └── src/
        ├── pages/           # Login, Register, Dashboard, Analysis, Admin
        └── components/      # Navbar, UploadZone, RiskBadge, QAChat...
```

---

## Installation et lancement

### Prérequis
- Python 3.13+
- Node.js 18+
- Clé API Groq gratuite — https://console.groq.com

### 1. Cloner le projet
```bash
git clone https://github.com/ton-username/documind-ai.git
cd documind-ai
```

### 2. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Remplir le fichier `.env` :
```
GROQ_API_KEY=gsk_votre_cle_groq_ici
SECRET_KEY=votre_cle_secrete_ici
```

### 3. Lancer le backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Lancer le frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Accéder à l'application

Ouvrir **http://localhost:5173** dans le navigateur.

Le premier compte créé devient automatiquement **administrateur**.

---

## Lancer les tests

### Backend
```bash
cd backend
pytest tests -v
```

### Frontend
```bash
cd frontend
npm run test
```

---

## Formats de documents supportés

| Format | Type | Méthode |
|--------|------|---------|
| PDF | Numérique | PyMuPDF |
| PDF | Scanné | OCR Tesseract |
| DOCX | Numérique | python-docx |
| JPG / PNG | Image | OCR Tesseract |

Taille maximale : **50 MB** — 200 pages maximum.

---



### Tableau de bord
![Dashboard](docs/dashboard.png)

### Page d'analyse
![Analyse](docs/analysis.png)

---

## Auteur

Franck Beku -Développé dans le cadre d'un projet personel.