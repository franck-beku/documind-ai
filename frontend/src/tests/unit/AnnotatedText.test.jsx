import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AnnotatedText from '../../components/AnnotatedText.jsx'

const RAW_TEXT = 'Le client doit payer 49,90 euros par mois. En cas de résiliation, des pénalités s\'appliquent.'
const ANNOTATIONS = [
  { text: '49,90 euros par mois', color: 'green', label: 'montant',  tooltip: 'Montant mensuel' },
  { text: 'pénalités s\'appliquent', color: 'red', label: 'pénalité', tooltip: 'Risque financier' },
]

describe('AnnotatedText', () => {
  it('affiche le texte brut', () => {
    render(<AnnotatedText rawText={RAW_TEXT} annotations={[]} />)
    expect(screen.getByText(/Le client doit payer/)).toBeInTheDocument()
  })

  it('affiche la légende des couleurs', () => {
    render(<AnnotatedText rawText={RAW_TEXT} annotations={ANNOTATIONS} />)
    expect(screen.getByText('Risque / pénalité')).toBeInTheDocument()
    expect(screen.getByText('Information financière')).toBeInTheDocument()
    expect(screen.getByText('Obligation')).toBeInTheDocument()
  })

  it('applique les surlignages sur le bon texte', () => {
    render(<AnnotatedText rawText={RAW_TEXT} annotations={ANNOTATIONS} />)
    const highlighted = screen.getByText('49,90 euros par mois')
    expect(highlighted).toHaveClass('hl-green')
  })

  it('ne rend rien si rawText est vide', () => {
    const { container } = render(<AnnotatedText rawText="" annotations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche le marqueur de troncature pour les textes longs', () => {
    const longText = 'mot '.repeat(600)
    render(<AnnotatedText rawText={longText} annotations={[]} />)
    expect(screen.getByText(/\[extrait\]/)).toBeInTheDocument()
  })
})