import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QAChat from '../../components/QAChat.jsx'

// Mock api
vi.mock('../../services/api', () => ({
  analysisAPI: {
    ask: vi.fn(),
  },
}))

import { analysisAPI } from '../../services/api.js'

describe('QAChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('affiche les questions suggérées par défaut', () => {
    render(<QAChat docId="1" />)
    expect(screen.getByText('Quelle est la durée du contrat ?')).toBeInTheDocument()
    expect(screen.getByText('Y a-t-il une pénalité de résiliation ?')).toBeInTheDocument()
  })

  it('affiche la réponse de l\'IA après une question', async () => {
    analysisAPI.ask.mockResolvedValue({ data: { answer: 'La durée est de 24 mois.' } })

    render(<QAChat docId="1" />)
    const input = screen.getByPlaceholderText(/Posez une question/)
    fireEvent.change(input, { target: { value: 'Durée du contrat ?' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('La durée est de 24 mois.')).toBeInTheDocument()
    })
  })

  it('affiche la question posée par l\'utilisateur', async () => {
    analysisAPI.ask.mockResolvedValue({ data: { answer: 'Réponse test' } })

    render(<QAChat docId="1" />)
    const input = screen.getByPlaceholderText(/Posez une question/)
    fireEvent.change(input, { target: { value: 'Ma question test' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Ma question test')).toBeInTheDocument()
    })
  })

  it('affiche un message d\'erreur si l\'API échoue', async () => {
    analysisAPI.ask.mockRejectedValue(new Error('Network error'))

    render(<QAChat docId="1" />)
    const input = screen.getByPlaceholderText(/Posez une question/)
    fireEvent.change(input, { target: { value: 'Question test' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText(/erreur est survenue/)).toBeInTheDocument()
    })
  })

  it('vide le champ après envoi', async () => {
    analysisAPI.ask.mockResolvedValue({ data: { answer: 'OK' } })

    render(<QAChat docId="1" />)
    const input = screen.getByPlaceholderText(/Posez une question/)
    fireEvent.change(input, { target: { value: 'Une question' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })
})