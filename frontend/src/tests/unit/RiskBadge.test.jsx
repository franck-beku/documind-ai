import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RiskBadge from '../../components/RiskBadge.jsx'

describe('RiskBadge', () => {
  const baseRisk = {
    type: 'pénalité',
    niveau: 'haut',
    description: 'Résiliation anticipée entraîne des pénalités importantes.',
    extrait: 'le client devra payer les mensualités restantes',
  }

  it('affiche la description du risque', () => {
    render(<RiskBadge risk={baseRisk} />)
    expect(screen.getByText(/Résiliation anticipée/)).toBeInTheDocument()
  })

  it('affiche le badge HAUT pour un risque élevé', () => {
    render(<RiskBadge risk={baseRisk} />)
    expect(screen.getByText('HAUT')).toBeInTheDocument()
  })

  it('affiche le badge MOYEN pour un risque moyen', () => {
    render(<RiskBadge risk={{ ...baseRisk, niveau: 'moyen' }} />)
    expect(screen.getByText('MOYEN')).toBeInTheDocument()
  })

  it('affiche le badge FAIBLE pour un risque faible', () => {
    render(<RiskBadge risk={{ ...baseRisk, niveau: 'faible' }} />)
    expect(screen.getByText('FAIBLE')).toBeInTheDocument()
  })

  it('affiche le label du type de risque traduit', () => {
    render(<RiskBadge risk={baseRisk} />)
    expect(screen.getByText('Pénalité financière')).toBeInTheDocument()
  })

  it('tronque les extraits longs', () => {
    const longRisk = { ...baseRisk, extrait: 'a'.repeat(120) }
    render(<RiskBadge risk={longRisk} />)
    expect(screen.getByText(/…/)).toBeInTheDocument()
  })

  it('fonctionne sans extrait', () => {
    const { extrait, ...noExtrait } = baseRisk
    render(<RiskBadge risk={noExtrait} />)
    expect(screen.getByText(/Résiliation anticipée/)).toBeInTheDocument()
  })
})