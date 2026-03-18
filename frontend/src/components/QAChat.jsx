import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { analysisAPI } from '../services/api.js'
import { MessageSquare } from 'lucide-react'

const SUGGESTED = [
  'Quelle est la durée du contrat ?',
  'Y a-t-il une pénalité de résiliation ?',
  'Le contrat se renouvelle-t-il automatiquement ?',
  'Quel est le montant à payer ?',
]

export default function QAChat({ docId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (question) => {
    const q = (question || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await analysisAPI.ask(docId, q)
      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Une erreur est survenue. Veuillez réessayer.', error: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-header">
        <MessageSquare size={16} color="var(--accent)" />
        <span className="card-title">Questions sur le document</span>
      </div>

      {/* Messages */}
      <div style={{ height: 320, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 24 }}>
            <div style={{ fontSize: 13, color: '#374355', marginBottom: 14 }}>
              Posez une question sur le document
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: '#131920', border: '1px solid #1c2530',
                    borderRadius: 6, padding: '7px 12px',
                    fontSize: 12, color: '#8a9bb0', cursor: 'pointer',
                    textAlign: 'left', transition: 'all .12s',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onMouseEnter={e => e.target.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.target.style.borderColor = '#1c2530'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              background: msg.role === 'user' ? 'var(--accent)' : (msg.error ? 'var(--red-bg)' : '#131920'),
              border: msg.role === 'ai' ? `1px solid ${msg.error ? 'var(--red)' : '#1c2530'}` : 'none',
              color: msg.role === 'user' ? 'white' : (msg.error ? 'var(--red)' : '#b8c5d4'),
              fontSize: 13,
              lineHeight: 1.55,
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 14px', borderRadius: '8px 8px 8px 2px',
              background: '#131920', border: '1px solid #1c2530',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#374355',
                  animation: `bounce .8s ease-in-out ${j * .15}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #131920', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Posez une question sur le document…"
          disabled={loading}
          style={{
            flex: 1, padding: '9px 13px',
            background: '#131920', border: '1px solid #1c2530',
            borderRadius: 6, color: '#dde5ee',
            fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#1c2530'}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{
            padding: '9px 13px', background: 'var(--accent)', border: 'none',
            borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
            opacity: !input.trim() || loading ? .5 : 1,
          }}
        >
          <Send size={14} color="white" />
        </button>
      </div>

      <style>{`
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }
      `}</style>
    </div>
  )
}