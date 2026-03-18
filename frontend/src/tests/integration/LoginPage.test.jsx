import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage.jsx'

// Mocks
const mockLogin   = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}))

import { authAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

describe('LoginPage — intégration', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderPage = () =>
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

  it('affiche le formulaire de connexion', () => {
    renderPage()
    expect(screen.getByPlaceholderText('nom@exemple.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se connecter/ })).toBeInTheDocument()
  })

  it('désactive le bouton si les champs sont vides', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Se connecter/ })).toBeDisabled()
  })

  it('appelle authAPI.login avec les bonnes valeurs', async () => {
    authAPI.login.mockResolvedValue({
      data: { access_token: 'tok123', user: { id: 1, email: 'a@b.com', role: 'user' } }
    })
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('nom@exemple.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('a@b.com', 'password123')
    })
  })

  it('appelle login() et redirige vers /dashboard en cas de succès', async () => {
    authAPI.login.mockResolvedValue({
      data: { access_token: 'tok123', user: { id: 1, email: 'a@b.com', role: 'user' } }
    })
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('nom@exemple.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok123', expect.any(Object))
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('affiche un toast d\'erreur si les identifiants sont incorrects', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { detail: 'Email ou mot de passe incorrect' } }
    })
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('nom@exemple.com'), { target: { value: 'bad@bad.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email ou mot de passe incorrect')
    })
  })

  it('contient un lien vers la page d\'inscription', () => {
    renderPage()
    expect(screen.getByText('Créer un compte')).toBeInTheDocument()
  })
})