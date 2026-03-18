# DocuMind AI

> Assistant intelligent d'analyse de documents administratifs

DocuMind AI est une application web full-stack qui utilise l'intelligence artificielle pour analyser automatiquement les documents administratifs complexes — contrats, assurances, factures, conditions d'utilisation — et aider les utilisateurs à comprendre leurs droits et obligations avant de signer.

---

## Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Tests](#tests)
- [Formats supportés](#formats-supportés)
- [Auteur](#auteur)

---

## Présentation

Dans la vie quotidienne, de nombreuses personnes signent des documents sans les comprendre entièrement. Les contrats sont souvent longs, rédigés dans un langage juridique complexe, et contiennent des clauses importantes difficiles à identifier — frais cachés, pénalités financières, renouvellements automatiques.

DocuMind AI répond à ce problème en automatisant l'analyse de ces documents grâce à l'IA. L'utilisateur téléverse un document et obtient en quelques secondes :

- un résumé clair et structuré
- les informations clés extraites automatiquement
- les clauses à risque mises en évidence
- la possibilité de poser des questions directement sur le document

L'application utilise une architecture **RAG (Retrieval Augmented Generation)** pour garantir que toutes les réponses sont basées uniquement sur le contenu réel du document, sans hallucinations.

---

## Fonctionnalités

### Analyse de documents
- Résumé automatique clair et structuré
- Extraction des informations clés (montants, dates, durées, obligations)
- Détection des clauses importantes (paiement, résiliation, responsabilité)
- Détection des clauses à risque (pénalités, renouvellement automatique, engagement long)
- Annotation visuelle du texte avec code couleur

### Code couleur des annotations
| Couleur | Signification |
|---------|---------------|
| Rouge | Risque ou pénalité |
| Orange | Clause importante |
| Vert | Information financière |
| Bleu | Obligation |
| Violet | Restriction |

### Interface utilisateur
- Tableau de bord avec zone d'upload par glisser-déposer
- Page d'analyse détaillée avec toutes les sections
- Interface de questions-réponses sur le document
- Export du rapport d'analyse en PDF
- Historique des documents analysés

### Gestion des accès
- Inscription et connexion sécurisées (JWT)
- Deux rôles : Utilisateur et Administrateur
- L'utilisateur ne voit que ses propres documents
- L'administrateur accède à tous les documents et utilisateurs

### OCR
- Support des documents scannés (JPG, PNG, PDF scanné)
- Reconnaissance automatique du français et de l'anglais

---

## Architecture
```
documind-ai/
│
├── .env.example                  # Template des variables d'environnement
├── .gitignore
├── README.md
│
├── backend/
│   ├── main.py                   # Point d'entrée FastAPI
│   ├── database.py               # Initialisation SQLite
│   ├── requirements.txt          # Dépendances Python
│   │
│   ├── routers/
│   │   ├── auth.py               # Inscription, connexion, JWT
│   │   ├── documents.py          # Upload, liste, suppression
│   │   ├── analysis.py           # Résultats, Q&A, export PDF
│   │   └── admin.py              # Gestion admin
│   │
│   ├── services/
│   │   ├── extractor.py          # Extraction texte PDF, DOCX, OCR
│   │   ├── analyzer.py           # Pipeline d'analyse IA
│   │   ├── llm.py                # Appel Groq API
│   │   ├── rag.py                # Index FAISS + Q&A
│   │   └── pdf_report.py         # Génération rapport PDF
│   │
│   └── tests/
│       ├── unit/                 # Tests unitaires
│       └── integration/          # Tests d'intégration
│
└── frontend/
    └── src/
        ├── pages/                # Login, Register, Dashboard, Analysis, Admin
        ├── components/           # Navbar, UploadZone, RiskBadge, QAChat...
        ├── services/             # Appels API (Axios)
        ├── context/              # AuthContext (état global)
        └── hooks/                # useAuth
```

### Pipeline de traitement
```
Document uploadé
      ↓
Extraction du texte (PyMuPDF / OCR Tesseract)
      ↓
Découpage en chunks + index FAISS (RAG)
      ↓
Analyse IA en un seul appel (Groq — llama-3.1-8b-instant)
      ↓
Résumé + Clauses + Risques + Annotations
      ↓
Sauvegarde SQLite → Affichage frontend
```

---

## Technologies

### Backend
| Technologie | Rôle |
|-------------|------|
| Python 3.13 + FastAPI | Serveur API REST |
| SQLite | Base de données |
| JWT (python-jose) | Authentification |
| PyMuPDF | Extraction texte PDF |
| pytesseract + Pillow | OCR documents scannés |
| python-docx | Extraction texte DOCX |
| sentence-transformers | Embeddings vectoriels |
| FAISS | Recherche vectorielle (RAG) |
| Groq API | LLM gratuit (llama-3.1-8b-instant) |
| ReportLab | Génération rapport PDF |

### Frontend
| Technologie | Rôle |
|-------------|------|
| React 18 + Vite | Interface utilisateur |
| Tailwind CSS | Styles |
| Axios | Appels API |
| Lucide React | Icônes |
| React Router | Navigation |
| React Hot Toast | Notifications |
| React Dropzone | Upload par glisser-déposer |

### Tests
| Technologie | Rôle |
|-------------|------|
| pytest + httpx | Tests backend |
| Vitest + Testing Library | Tests frontend |

---

## Installation

### Prérequis
- Python 3.13+
- Node.js 18+
- Clé API Groq gratuite — [console.groq.com](https://console.groq.com)

### 1. Cloner le projet
```bash
git clone https://github.com/franck-beku/documind-ai.git
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

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Le backend sera disponible sur **http://localhost:8000**

### 4. Lancer le frontend

Ouvrir un second terminal :
```bash
cd frontend
npm install
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173**

---

## Utilisation

1. Ouvrir **http://localhost:5173**
2. Créer un compte — le premier compte est automatiquement **administrateur**
3. Téléverser un document PDF, DOCX, JPG ou PNG
4. Attendre l'analyse (environ 10 secondes)
5. Consulter le résumé, les risques, les clauses et poser des questions
6. Télécharger le rapport PDF si nécessaire

---

## Tests

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

## Formats supportés

| Format | Type | Méthode d'extraction |
|--------|------|----------------------|
| PDF | Numérique | PyMuPDF |
| PDF | Scanné | OCR Tesseract |
| DOCX | Word | python-docx |
| JPG / PNG | Image scannée | OCR Tesseract |

**Limites :** taille maximale 50 MB — 200 pages maximum.

---

## Auteur

**Franck Beku**

Développé dans le cadre d'un projet personnel démontrant des compétences en intelligence artificielle, développement backend, développement frontend et architecture RAG.