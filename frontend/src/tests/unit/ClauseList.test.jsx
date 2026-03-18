import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ClauseList from '../../components/ClauseList.jsx'

const CLAUSES = [
  { type: 'paiement',    description: 'Prélèvement automatique mensuel le 5',   extrait: 'prélevé le 5 de chaque mois' },
  { type: 'durée',       description: 'Engagement ferme de 24 mois',              extrait: 'durée ferme de vingt-quatre mois' },
  { type: 'résiliation', description: 'Préavis obligatoire de 30 jours par LRAR', extrait: 'lettre recommandée avec accusé' },
]

describe('ClauseList', () => {
  it('affiche toutes les clauses reçues', () => {
    render(<ClauseList clauses={CLAUSES} />)
    expect(screen.getByText(/Prélèvement automatique/)).toBeInTheDocument()
    expect(screen.getByText(/Engagement ferme/)).toBeInTheDocument()
    expect(screen.getByText(/Préavis obligatoire/)).toBeInTheDocument()
  })

  it('affiche les tags de type', () => {
    render(<ClauseList clauses={CLAUSES} />)
    expect(screen.getByText('PAIEMENT')).toBeInTheDocument()
    expect(screen.getByText('DURÉE')).toBeInTheDocument()
    expect(screen.getByText('RÉSILIATION')).toBeInTheDocument()
  })

  it('affiche les extraits tronqués', () => {
    render(<ClauseList clauses={CLAUSES} />)
    expect(screen.getByText(/"prélevé le 5 de chaque mois"/)).toBeInTheDocument()
  })

  it('ne rend rien si la liste est vide', () => {
    const { container } = render(<ClauseList clauses={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('ne rend rien si clauses est undefined', () => {
    const { container } = render(<ClauseList />)
    expect(container.firstChild).toBeNull()
  })

  it('tronque les extraits dépassant 80 caractères', () => {
    const clause = { type: 'obligation', description: 'Test', extrait: 'a'.repeat(100) }
    render(<ClauseList clauses={[clause]} />)
    expect(screen.getByText(/…/)).toBeInTheDocument()
  })
})