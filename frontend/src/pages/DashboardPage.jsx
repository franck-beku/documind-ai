import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Eye, RefreshCw } from 'lucide-react'
import Sidebar from '../components/Navbar.jsx'
import UploadZone from '../components/UploadZone.jsx'
import { documentsAPI } from '../services/api.js'
import toast from 'react-hot-toast'

// ── Configuration des statuts ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  done:        { label: 'Analysé',    className: 'status-done'  },
  processing:  { label: 'En cours',   className: 'status-proc'  },
  analyzing:   { label: 'Analyse IA', className: 'status-proc'  },
  pending:     { label: 'En attente', className: 'status-proc'  },
  error:       { label: 'Erreur',     className: 'status-error' },
  error_pages: { label: 'Trop long',  className: 'status-error' },
}

// ── Helpers d'affichage ───────────────────────────────────────────────────────

/** Formate une taille en octets en KB ou MB lisible */
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Formate une date ISO en format français lisible */
function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  /** Charge la liste des documents depuis le backend */
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await documentsAPI.list()
      setDocuments(res.data)
    } catch {
      toast.error('Impossible de charger les documents')
    }
  }, [])

  // Chargement initial — une seule fois au montage du composant
  useEffect(() => {
    fetchDocuments()
  }, [])

  // Polling toutes les 5s uniquement si un document est en cours d'analyse
  // S'arrête automatiquement quand tous les documents sont terminés
  useEffect(() => {
    const hasProcessing = documents.some(d =>
      ['processing', 'analyzing', 'pending'].includes(d.status)
    )
    if (!hasProcessing) return

    const interval = setInterval(fetchDocuments, 5000)
    return () => clearInterval(interval) // nettoyage à la destruction
  }, [documents])

  /** Gère l'upload d'un nouveau document */
  const handleUpload = async (file) => {
    setUploading(true)
    try {
      await documentsAPI.upload(file)
      toast.success('Document soumis — analyse démarrée')
      await fetchDocuments()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors du téléversement')
    } finally {
      setUploading(false)
    }
  }

  /** Supprime un document après confirmation */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    try {
      await documentsAPI.delete(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Impossible de supprimer le document')
    }
  }

  /** Actualisation manuelle de la liste */
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDocuments()
    setRefreshing(false)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: '28px 32px 20px',
          borderBottom: '1px solid #131920',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22,
              fontWeight: 700, color: 'white', letterSpacing: '-.02em'
            }}>
              Tableau de bord
            </h1>
            <p style={{ fontSize: 13, color: '#5a6e85', marginTop: 2 }}>
              Analysez vos documents administratifs
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={handleRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* ── Zone d'upload ─────────────────────────────────────────────── */}
          <UploadZone onFile={handleUpload} loading={uploading} />

          {/* ── En-tête de la liste ───────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 14
          }}>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.06em', color: '#b8c5d4'
            }}>
              Documents récents
            </div>
            <div style={{ fontSize: 12, color: '#374355' }}>
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* ── Liste vide ────────────────────────────────────────────────── */}
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#374355', fontSize: 14 }}>
              Aucun document analysé. Téléversez votre premier document.
            </div>
          ) : (
            /* ── Tableau des documents ──────────────────────────────────── */
            <div style={{
              background: '#0d1117', border: '1px solid #1c2530',
              borderRadius: 12, overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Document', 'Date', 'Taille', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{
                        fontSize: 11, fontWeight: 600, color: '#5a6e85',
                        textTransform: 'uppercase', letterSpacing: '.08em',
                        padding: '10px 16px', borderBottom: '1px solid #1c2530',
                        textAlign: 'left',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => {
                    const sc          = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
                    const isReady      = doc.status === 'done'
                    const isProcessing = ['processing', 'analyzing', 'pending'].includes(doc.status)

                    return (
                      <tr
                        key={doc.id}
                        style={{ borderBottom: i < documents.length - 1 ? '1px solid #131920' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0f141a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Nom du fichier */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ fontWeight: 500, color: 'white', fontSize: 13.5 }}>
                            {doc.original_filename}
                          </div>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11, color: '#374355', marginTop: 2
                          }}>
                            {doc.page_count ? `${doc.page_count} pages` : '—'}
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#5a6e85' }}>
                          {formatDate(doc.uploaded_at)}
                        </td>

                        {/* Taille */}
                        <td style={{
                          padding: '13px 16px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 12, color: '#5a6e85'
                        }}>
                          {formatSize(doc.file_size)}
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className={`status-pill ${sc.className}`}>
                            <span className="status-dot" />
                            {isProcessing ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {sc.label}
                                <RefreshCw size={10} className="animate-spin" />
                              </span>
                            ) : sc.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-ghost"
                              disabled={!isReady}
                              onClick={() => navigate(`/analysis/${doc.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <Eye size={12} /> Voir
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => handleDelete(doc.id, doc.original_filename)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <Trash2 size={12} /> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}