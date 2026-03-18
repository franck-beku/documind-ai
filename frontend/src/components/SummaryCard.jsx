import { FileText } from 'lucide-react'

export default function SummaryCard({ summary }) {
  if (!summary) return null

  // Split bullet points if present, else show as paragraph
  const lines = summary
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  return (
    <div className="card">
      <div className="card-header">
        <FileText size={16} color="var(--accent)" />
        <span className="card-title">Résumé</span>
      </div>
      <div className="card-body">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 0',
              borderBottom: i < lines.length - 1 ? '1px solid #131920' : 'none',
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginTop: 8, flexShrink: 0 }} />
            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#b8c5d4' }}>
              {line.replace(/^[•\-*]\s*/, '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}