import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AnalysisPage from '../../pages/AnalysisPage.jsx'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ docId: '1' }) }
})

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'user@test.com', full_name: 'Test User', role: 'user' },
    logout: vi.fn(),
  }),
}))

vi.mock('../../services/api', () => ({
  documentsAPI: { get: vi.fn() },
  analysisAPI:  { get: vi.fn(), ask: vi.fn() },
}))

import { documentsAPI, analysisAPI } from '../../services/api.js'

const MOCK_DOC = {
  id: 1, original_filename: 'contrat.pdf', status: 'done',
  page_count: 14, file_size: 2500000, uploaded_at: '2026-03-11T10:00:00', user_id: 1,
}

const MOCK_ANALYSIS = {
  document_id: 1,
  summary: '• Contrat de 24 mois\n• Montant mensuel : 49,90 €\n• Renouvellement automatique',
  key_info: [
    { type: 'montant', valeur: '49,90 €', contexte: 'Mensualité' },
    { type: 'durée',   valeur: '24 mois', contexte: 'Engagement' },
  ],
  risks: [
    { type: 'pénalité', niveau: 'haut', description: 'Pénalité en cas de résiliation', extrait: 'mensualités restantes' },
  ],
  clauses: [
    { type: 'paiement', description: 'Prélèvement le 5 du mois', extrait: 'prélevé automatiquement' },
  ],
  annotated_text: [
    { text: 'mensualités restantes', color: 'red', label: 'pénalité', tooltip: 'Risque' },
  ],
}

describe('AnalysisPage — intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    documentsAPI.get.mockResolvedValue({ data: MOCK_DOC })
    analysisAPI.get.mockResolvedValue({ data: MOCK_ANALYSIS })
  })

  const renderPage = () =>
    render(<MemoryRouter initialEntries={['/analysis/1']}><AnalysisPage /></MemoryRouter>)

  it('affiche le nom du document dans le header', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('contrat.pdf')).toBeInTheDocument()
    })
  })

  it('affiche le résumé', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Contrat de 24 mois/)).toBeInTheDocument()
    })
  })

  it('affiche les informations clés', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('49,90 €')).toBeInTheDocument()
      expect(screen.getByText('24 mois')).toBeInTheDocument()
    })
  })

  it('affiche le nombre de risques dans le header', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/1 risque détecté/)).toBeInTheDocument()
    })
  })

  it('affiche les alertes de risque', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Pénalité en cas de résiliation')).toBeInTheDocument()
    })
  })

  it('affiche les clauses détectées', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Prélèvement le 5 du mois')).toBeInTheDocument()
    })
  })

  it('affiche le composant Q&A', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Posez une question/)).toBeInTheDocument()
    })
  })

  it('affiche un message d\'erreur si l\'API échoue', async () => {
    analysisAPI.get.mockRejectedValue({ response: { data: { detail: 'Analyse introuvable' } } })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Analyse introuvable')).toBeInTheDocument()
    })
  })
})