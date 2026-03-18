import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../../pages/DashboardPage.jsx'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'user@test.com', full_name: 'Test User', role: 'user' },
    logout: vi.fn(),
  }),
}))

vi.mock('../../services/api', () => ({
  documentsAPI: {
    list:   vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
  },
}))

import { documentsAPI } from '../../services/api.js'
import toast from 'react-hot-toast'

const MOCK_DOCS = [
  {
    id: 1, original_filename: 'contrat.pdf', status: 'done',
    page_count: 10, file_size: 1024000, uploaded_at: '2026-03-11T10:00:00',
    user_id: 1,
  },
  {
    id: 2, original_filename: 'assurance.pdf', status: 'processing',
    page_count: null, file_size: 2048000, uploaded_at: '2026-03-10T10:00:00',
    user_id: 1,
  },
]

describe('DashboardPage — intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    documentsAPI.list.mockResolvedValue({ data: MOCK_DOCS })
  })

  const renderPage = () =>
    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

  it('affiche la zone d\'upload', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Déposez votre document ici/)).toBeInTheDocument()
    })
  })

  it('affiche la liste des documents', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('contrat.pdf')).toBeInTheDocument()
      expect(screen.getByText('assurance.pdf')).toBeInTheDocument()
    })
  })

  it('affiche les bons statuts', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Analysé')).toBeInTheDocument()
      expect(screen.getByText('En cours')).toBeInTheDocument()
    })
  })

  it('désactive le bouton Voir pour les documents en cours', async () => {
    renderPage()
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Voir/ })
      // Second doc is processing → its button disabled
      expect(buttons[1]).toBeDisabled()
    })
  })

  it('navigue vers la page d\'analyse au clic sur Voir', async () => {
    renderPage()
    await waitFor(() => screen.getByText('contrat.pdf'))
    const viewButtons = screen.getAllByRole('button', { name: /Voir/ })
    fireEvent.click(viewButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/analysis/1')
  })

  it('supprime un document après confirmation', async () => {
    documentsAPI.delete.mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()
    await waitFor(() => screen.getByText('contrat.pdf'))
    const deleteButtons = screen.getAllByRole('button', { name: /Supprimer/ })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(documentsAPI.delete).toHaveBeenCalledWith(1)
      expect(toast.success).toHaveBeenCalledWith('Document supprimé')
    })
  })

  it('affiche un message si aucun document', async () => {
    documentsAPI.list.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Aucun document analysé/)).toBeInTheDocument()
    })
  })
})