import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertTriangle, Info } from 'lucide-react'
import Sidebar from '../components/Navbar.jsx'
import SummaryCard from '../components/SummaryCard.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import ClauseList from '../components/ClauseList.jsx'
import AnnotatedText from '../components/AnnotatedText.jsx'
import QAChat from '../components/QAChat.jsx'
import { documentsAPI, analysisAPI } from '../services/api.js'
import toast from 'react-hot-toast'

// ── Grille des informations clés ──────────────────────────────────────────────
function KeyInfoGrid({ items }) {
  if (!items || items.length === 0) return null

  // Couleurs par type d'information
  const COLOR = {
    montant:            '#22c55e',
    durée:              '#f97316',
    date:               '#60a5fa',
    organisation:       '#a78bfa',
    obligation:         '#60a5fa',
    condition_paiement: '#22c55e',
  }

  return (
    <div className="card">
      <div className="card-header">
        <Info size={16} color="var(--accent)" />
        <span className="card-title">Informations clés</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: '#131920', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '.08em', color: '#374355', marginBottom: 4
              }}>
                {item.type}
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500,
                color: COLOR[item.type?.toLowerCase()] || 'white',
              }}>
                {item.valeur}
              </div>
              {item.contexte && (
                <div style={{ fontSize: 11, color: '#374355', marginTop: 3 }}>
                  {item.contexte}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page principale d'analyse ─────────────────────────────────────────────────
export default function AnalysisPage() {
  const { docId } = useParams()
  const navigate  = useNavigate()

  const [doc, setDoc]         = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Chargement du document et de son analyse au montage
  useEffect(() => {
    const load = async () => {
      try {
        const [docRes, analysisRes] = await Promise.all([
          documentsAPI.get(docId),
          analysisAPI.get(docId),
        ])
        setDoc(docRes.data)
        setAnalysis(analysisRes.data)
      } catch (err) {
        setError(err.response?.data?.detail || "Impossible de charger l'analyse")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [docId])

  // Génère et télécharge le rapport PDF depuis le backend
  const handleExport = async () => {
    try {
      toast.loading('Génération du rapport PDF…', { id: 'export' })

      const res = await fetch(`/api/analysis/${docId}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!res.ok) throw new Error('Erreur serveur')

      // Crée un lien de téléchargement temporaire et le déclenche
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `rapport_documind_${docId}.pdf`
      a.click()
      URL.revokeObjectURL(url) // Libère la mémoire après téléchargement

      toast.success('Rapport téléchargé', { id: 'export' })
    } catch {
      toast.error('Erreur lors de la génération du rapport', { id: 'export' })
    }
  }

  // Formate une date ISO en français lisible
  const formatDate = (str) => str
    ? new Date(str).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : '—'

  // ── État de chargement ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '2px solid #1c2530', borderTopColor: '#3b82f6',
              animation: 'spin .8s linear infinite', margin: '0 auto 16px'
            }} />
            <div style={{ fontSize: 14, color: '#5a6e85' }}>Chargement de l'analyse…</div>
          </div>
        </main>
      </div>
    )
  }

  // ── État d'erreur ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 16 }}>{error}</div>
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Retour</button>
          </div>
        </main>
      </div>
    )
  }

  const riskCount = analysis?.risks?.length || 0

  // ── Rendu principal ─────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 32px',
          borderBottom: '1px solid #131920',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Bouton retour */}
            <button
              className="btn-ghost"
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}
            >
              <ArrowLeft size={13} /> Retour
            </button>

            {/* Infos du document */}
            <div>
              <h1 style={{
                fontFamily: 'Syne, sans-serif', fontSize: 18,
                fontWeight: 700, color: 'white', letterSpacing: '-.02em'
              }}>
                {doc?.original_filename}
              </h1>
              <p style={{ fontSize: 12, color: '#5a6e85', marginTop: 2 }}>
                {doc?.page_count} pages · Analysé le {formatDate(doc?.uploaded_at)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Badge risques si présents */}
            {riskCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--red-bg)', border: '1px solid var(--red)',
                borderRadius: 6, padding: '5px 10px',
                fontSize: 12, fontWeight: 600, color: 'var(--red)',
              }}>
                <AlertTriangle size={13} />
                {riskCount} risque{riskCount > 1 ? 's' : ''} détecté{riskCount > 1 ? 's' : ''}
              </div>
            )}

            {/* Bouton export PDF */}
            <button
              className="btn-ghost"
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={13} /> Rapport PDF
            </button>
          </div>
        </div>

        {/* ── Corps de la page ────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

            {/* Colonne gauche — résumé, infos clés, texte annoté */}
            <div>
              <SummaryCard summary={analysis?.summary} />
              <KeyInfoGrid items={analysis?.key_info} />
              <AnnotatedText
                rawText={analysis?.annotated_text?.map?.(a => a.text)?.join?.(' ') || ''}
                annotations={analysis?.annotated_text}
              />
            </div>

            {/* Colonne droite — risques, clauses, Q&A */}
            <div>
              {/* Alertes de risque */}
              {analysis?.risks?.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <AlertTriangle size={16} color="var(--red)" />
                    <span className="card-title" style={{ color: 'var(--red)' }}>
                      Alertes — {riskCount} risque{riskCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="card-body">
                    {analysis.risks.map((risk, i) => (
                      <RiskBadge key={i} risk={risk} />
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des clauses */}
              <ClauseList clauses={analysis?.clauses} />

              {/* Interface Q&A */}
              <QAChat docId={docId} />
            </div>
          </div>
        </div>
      </main>

      {/* Animation de chargement */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}