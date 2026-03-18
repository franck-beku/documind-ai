import { AlertTriangle } from 'lucide-react'

const LEVEL_CONFIG = {
  haut:   { label: 'HAUT',   className: 'risk-high',   badge: { background: '#ef4444', color: 'white' } },
  moyen:  { label: 'MOYEN',  className: 'risk-medium', badge: { background: '#f97316', color: 'white' } },
  faible: { label: 'FAIBLE', className: 'risk-low',    badge: { background: '#60a5fa', color: '#0d1117' } },
}

const TYPE_LABELS = {
  pénalité:                'Pénalité financière',
  frais_cachés:            'Frais supplémentaires',
  renouvellement_automatique: 'Renouvellement automatique',
  engagement_long:         'Engagement long',
  résiliation_difficile:   'Résiliation difficile',
  augmentation_prix:       'Augmentation de prix',
}

export default function RiskBadge({ risk }) {
  const niveau = (risk.niveau || 'moyen').toLowerCase()
  const config = LEVEL_CONFIG[niveau] || LEVEL_CONFIG.moyen
  const typeLabel = TYPE_LABELS[risk.type] || risk.type || 'Risque détecté'

  return (
    <div className={`risk-item ${config.className}`}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '.05em', marginBottom: 3,
          color: config.className === 'risk-high' ? 'var(--red)'
               : config.className === 'risk-medium' ? 'var(--orange)' : 'var(--blue)',
        }}>
          {typeLabel}
        </div>
        <div style={{ fontSize: 13, color: '#8a9bb0', lineHeight: 1.5 }}>
          {risk.description}
        </div>
        {risk.extrait && (
          <div style={{
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            color: '#374355', marginTop: 6,
            borderLeft: '2px solid #253040', paddingLeft: 8,
          }}>
            "{risk.extrait.slice(0, 80)}{risk.extrait.length > 80 ? '…' : ''}"
          </div>
        )}
      </div>
      <div style={{
        ...config.badge,
        fontSize: 10, fontWeight: 700, padding: '2px 8px',
        borderRadius: 20, alignSelf: 'flex-start', flexShrink: 0,
        letterSpacing: '.04em',
      }}>
        {config.label}
      </div>
    </div>
  )
}