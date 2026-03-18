import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileSearch } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      login(res.data.access_token, res.data.user)
      navigate('/dashboard')
      toast.success('Connexion réussie')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080b10',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, #1d4ed820, transparent)',
    }}>
      <div style={{
        width: 420, background: '#0d1117',
        border: '1px solid #1c2530', borderRadius: 16,
        padding: '48px 40px',
        boxShadow: '0 32px 80px #00000060',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'white' }}>DocuMind</span>
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 6, letterSpacing: '-.02em' }}>
          Connexion
        </h1>
        <p style={{ fontSize: 14, color: '#5a6e85', marginBottom: 32 }}>
          Accédez à votre espace d'analyse
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label className="form-label">Adresse email</label>
            <input
              className="form-input"
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !email || !password}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5a6e85' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}