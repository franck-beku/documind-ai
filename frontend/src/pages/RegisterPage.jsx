import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileSearch } from 'lucide-react'
import { authAPI } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({ email, password, full_name: fullName })
      login(res.data.access_token, res.data.user)
      navigate('/dashboard')
      toast.success('Compte créé avec succès')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création du compte')
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'white' }}>DocuMind</span>
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 6, letterSpacing: '-.02em' }}>
          Créer un compte
        </h1>
        <p style={{ fontSize: 14, color: '#5a6e85', marginBottom: 32 }}>
          Commencez votre analyse gratuitement
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label className="form-label">Nom complet</label>
            <input
              className="form-input"
              type="text"
              placeholder="Marie Dupont"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="form-label">Adresse email</label>
            <input
              className="form-input"
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !email || !password || !fullName}
          >
            {loading ? 'Création en cours…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5a6e85' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}