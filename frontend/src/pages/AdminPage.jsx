import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, BarChart2, Trash2, Eye } from 'lucide-react'
import Sidebar from '../components/Navbar.jsx'
import { adminAPI } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'
import toast from 'react-hot-toast'

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1c2530', borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#374355', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-.02em' }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: subColor || '#22c55e', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}

const STATUS_CONFIG = {
  done:       { label: 'Analysé',    className: 'status-done' },
  processing: { label: 'En cours',   className: 'status-proc' },
  analyzing:  { label: 'Analyse IA', className: 'status-proc' },
  pending:    { label: 'En attente', className: 'status-proc' },
  error:      { label: 'Erreur',     className: 'status-error' },
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats]       = useState(null)
  const [docs, setDocs]         = useState([])
  const [users, setUsers]       = useState([])
  const [tab, setTab]           = useState('users') // 'users' | 'docs'
  const [loading, setLoading]   = useState(true)

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
      toast.error('Accès réservé aux administrateurs')
    }
  }, [user, navigate])

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, docsRes, usersRes] = await Promise.all([
          adminAPI.stats(),
          adminAPI.documents(),
          adminAPI.users(),
        ])
        setStats(statsRes.data)
        setDocs(docsRes.data)
        setUsers(usersRes.data)
      } catch {
        toast.error('Erreur lors du chargement des données admin')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDeleteDoc = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement "${name}" ?`)) return
    try {
      await adminAPI.delete(id)
      setDocs(prev => prev.filter(d => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const TAB_STYLE = (active) => ({
    padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
    fontSize: 13, fontWeight: active ? 600 : 400,
    background: active ? '#1c2530' : 'transparent',
    color: active ? '#dde5ee' : '#5a6e85',
    border: 'none', fontFamily: 'DM Sans, sans-serif',
    transition: 'all .12s',
  })

  return (
    <div className="app-layout">
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #131920' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-.02em' }}>
              Administration
            </h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f97316', color: 'white', letterSpacing: '.04em' }}>
              ADMIN
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#5a6e85' }}>Supervision globale du système</p>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            <StatCard label="Utilisateurs inscrits" value={stats?.total_users} sub="Comptes actifs" />
            <StatCard label="Documents analysés" value={stats?.analyzed_documents} sub={`/ ${stats?.total_documents} soumis`} />
            <StatCard
              label="Taux de succès"
              value={stats ? `${stats.total_documents > 0 ? Math.round(stats.analyzed_documents / stats.total_documents * 100) : 0}%` : '—'}
              sub="Analyses réussies"
              subColor="#22c55e"
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#0d1117', padding: 4, borderRadius: 8, border: '1px solid #1c2530', width: 'fit-content' }}>
            <button style={TAB_STYLE(tab === 'users')} onClick={() => setTab('users')}>
              Utilisateurs ({users.length})
            </button>
            <button style={TAB_STYLE(tab === 'docs')} onClick={() => setTab('docs')}>
              Documents ({docs.length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#374355' }}>Chargement…</div>
          ) : tab === 'users' ? (
            /* Users table */
            <div style={{ background: '#0d1117', border: '1px solid #1c2530', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Utilisateur', 'Rôle', 'Inscription', 'Documents'].map(h => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#5a6e85', textTransform: 'uppercase', letterSpacing: '.08em', padding: '10px 16px', borderBottom: '1px solid #1c2530', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const initials = u.full_name
                      ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : u.email[0].toUpperCase()
                    const isAdmin = u.role === 'admin'
                    return (
                      <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #131920' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0f141a'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: isAdmin ? '#f97316' : '#3b82f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'white' }}>{u.full_name || '—'}</div>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#374355' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-pill" style={{ background: isAdmin ? '#f9731615' : 'var(--blue-bg)', color: isAdmin ? '#f97316' : 'var(--blue)' }}>
                            <span className="status-dot" />
                            {isAdmin ? 'Admin' : 'Utilisateur'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#5a6e85' }}>{formatDate(u.created_at)}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#8a9bb0' }}>
                          {docs.filter(d => d.user_id === u.id).length}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Docs table */
            <div style={{ background: '#0d1117', border: '1px solid #1c2530', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Document', 'Utilisateur', 'Date', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#5a6e85', textTransform: 'uppercase', letterSpacing: '.08em', padding: '10px 16px', borderBottom: '1px solid #1c2530', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, i) => {
                    const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
                    return (
                      <tr key={doc.id} style={{ borderBottom: i < docs.length - 1 ? '1px solid #131920' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0f141a'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'white' }}>{doc.original_filename}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5a6e85' }}>
                          {doc.user_email}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#5a6e85' }}>{formatDate(doc.uploaded_at)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`status-pill ${sc.className}`}><span className="status-dot" />{sc.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {doc.status === 'done' && (
                              <button className="btn-ghost" onClick={() => navigate(`/analysis/${doc.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Eye size={12} /> Voir
                              </button>
                            )}
                            <button className="btn-danger" onClick={() => handleDeleteDoc(doc.id, doc.original_filename)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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