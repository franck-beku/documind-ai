import { CheckSquare } from 'lucide-react'

const TAG_CLASS = {
  paiement:      'tag-paiement',
  durée:         'tag-duree',
  obligation:    'tag-obligation',
  restriction:   'tag-restriction',
  résiliation:   'tag-resiliation',
  responsabilité:'tag-responsabilite',
}

const TAG_LABELS = {
  paiement:      'PAIEMENT',
  durée:         'DURÉE',
  obligation:    'OBLIGATION',
  restriction:   'RESTRICTION',
  résiliation:   'RÉSILIATION',
  responsabilité:'RESPONSABILITÉ',
}

export default function ClauseList({ clauses }) {
  if (!clauses || clauses.length === 0) return null

  return (
    <div className="card">
      <div className="card-header">
        <CheckSquare size={16} color="var(--accent)" />
        <span className="card-title">Clauses détectées</span>
      </div>
      <div className="card-body" style={{ padding: '8px 18px' }}>
        {clauses.map((clause, i) => {
          const type = (clause.type || '').toLowerCase()
          const tagClass = TAG_CLASS[type] || 'tag-obligation'
          const tagLabel = TAG_LABELS[type] || type.toUpperCase()

          return (
            <div
              key={i}
              style={{
                display: 'flex', gap: 10, padding: '10px 0',
                borderBottom: i < clauses.length - 1 ? '1px solid #131920' : 'none',
                alignItems: 'flex-start',
              }}
            >
              <span className={`clause-tag ${tagClass}`}>{tagLabel}</span>
              <div>
                <div style={{ fontSize: 13, color: '#b8c5d4', lineHeight: 1.5 }}>
                  {clause.description}
                </div>
                {clause.extrait && (
                  <div style={{
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    color: '#374355', marginTop: 4,
                  }}>
                    "{clause.extrait.slice(0, 80)}{clause.extrait.length > 80 ? '…' : ''}"
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}