import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, History, Users, Settings, LogOut, FileSearch } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Déconnexion réussie')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-7">
        <div className="w-7 h-7 bg-accent rounded flex items-center justify-center flex-shrink-0">
          <FileSearch size={14} color="white" />
        </div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'white' }}>
          DocuMind
        </span>
      </div>

      {/* Navigation */}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#374355', padding: '0 8px', marginBottom: 6 }}>
        Navigation
      </div>

      <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={15} />
        Tableau de bord
      </NavLink>

      <NavLink to="/dashboard" className="sidebar-item" style={{ pointerEvents: 'none', opacity: .5 }}>
        <History size={15} />
        Historique
      </NavLink>

      {/* Admin section */}
      {user?.role === 'admin' && (
        <>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#374355', padding: '0 8px', margin: '16px 0 6px' }}>
            Administration
          </div>
          <NavLink to="/admin" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Users size={15} />
            Utilisateurs
          </NavLink>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid #1c2530', paddingTop: 16 }}>
        <div className="flex items-center gap-2.5 p-2 rounded cursor-pointer hover:bg-ink-800 transition-colors group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{
              background: user?.role === 'admin' ? '#f97316' : '#3b82f6',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13, fontWeight: 500, color: '#dde5ee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || user?.email}
            </div>
            <div style={{ fontSize: 11, color: user?.role === 'admin' ? '#f97316' : '#5a6e85' }}>
              {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Se déconnecter"
          >
            <LogOut size={14} color="#5a6e85" />
          </button>
        </div>
      </div>
    </aside>
  )
}