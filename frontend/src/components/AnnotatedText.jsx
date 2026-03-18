import { PenLine } from 'lucide-react'

const COLOR_CLASS = {
  red:    'hl-red',
  orange: 'hl-orange',
  green:  'hl-green',
  blue:   'hl-blue',
  purple: 'hl-purple',
}

const LEGEND = [
  { color: 'var(--red)',    label: 'Risque / pénalité' },
  { color: 'var(--orange)', label: 'Clause importante' },
  { color: 'var(--green)',  label: 'Information financière' },
  { color: 'var(--blue)',   label: 'Obligation' },
  { color: 'var(--purple)', label: 'Restriction' },
]

function buildAnnotatedParts(text, annotations) {
  if (!annotations || annotations.length === 0) {
    return [{ type: 'text', content: text }]
  }

  // Build sorted list of spans
  const spans = []
  for (const ann of annotations) {
    const idx = text.indexOf(ann.text)
    if (idx !== -1) {
      spans.push({ start: idx, end: idx + ann.text.length, ann })
    }
  }
  spans.sort((a, b) => a.start - b.start)

  const parts = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) {
      parts.push({ type: 'text', content: text.slice(cursor, span.start) })
    }
    if (span.start >= cursor) {
      parts.push({ type: 'highlight', content: span.ann.text, color: span.ann.color, tooltip: span.ann.tooltip })
      cursor = span.end
    }
  }
  if (cursor < text.length) {
    parts.push({ type: 'text', content: text.slice(cursor) })
  }
  return parts
}

export default function AnnotatedText({ rawText, annotations }) {
  if (!rawText) return null

  const preview = rawText.slice(0, 2000)
  const parts = buildAnnotatedParts(preview, annotations)

  return (
    <div className="card">
      <div className="card-header">
        <PenLine size={16} color="var(--accent)" />
        <span className="card-title">Texte annoté</span>
      </div>
      <div className="card-body">
        <div style={{ fontSize: 13.5, lineHeight: 2, color: '#8a9bb0', fontFamily: 'DM Sans, sans-serif' }}>
          {parts.map((part, i) =>
            part.type === 'text' ? (
              <span key={i}>{part.content}</span>
            ) : (
              <span
                key={i}
                className={`hl ${COLOR_CLASS[part.color] || 'hl-orange'}`}
                title={part.tooltip}
              >
                {part.content}
              </span>
            )
          )}
          {rawText.length > 2000 && (
            <span style={{ color: '#374355', fontSize: 12 }}> … [extrait]</span>
          )}
        </div>
      </div>
      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12,
        padding: '10px 18px',
        background: '#080b10',
        borderTop: '1px solid #131920',
      }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a6e85' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}