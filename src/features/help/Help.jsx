import { useState } from 'react'
import { Card, Button } from '../../components/ui'

export function Help({ data }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '🙏 Namaste! I am your AI festival guide for Vinayaka Vedika 2026. Ask me anything about daily aarti timings, pooja schedules, donations, or emergency contacts!'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const settings = data.settings?.[0] || {}
  const activities = data.activities || []
  const raised = (data.donations || []).reduce(
    (s, x) => s + Number(x.amount || 0),
    0
  )
  const spent = (data.expenses || []).reduce(
    (s, x) => s + Number(x.amount || 0),
    0
  )

  const ask = async (e, customQuery) => {
    if (e) e.preventDefault()
    const queryToAsk = (customQuery || question).trim()
    if (!queryToAsk) return

    setLoading(true)
    setErrorMsg('')

    // Add user message to thread
    const newThread = [...messages, { role: 'user', text: queryToAsk }]
    setMessages(newThread)
    setQuestion('')

    try {
      const response = await fetch(
        import.meta.env.VITE_AI_ENDPOINT || '/api/ask',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: queryToAsk,
            context: {
              settings,
              activities,
              raised,
              spent
            }
          })
        }
      )

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.error || 'Could not get an answer right now.')
      }

      setMessages([
        ...newThread,
        {
          role: 'assistant',
          text: body.answer,
          provider: body.provider
        }
      ])
    } catch (error) {
      setErrorMsg(error.message || 'Unable to connect to AI assistant.')
      setMessages([
        ...newThread,
        {
          role: 'assistant',
          text: '🙏 I am temporarily offline, but here is what I know from our festival records: You can check the Schedule tab for pooja timings, or the Money tab for donations & receipts!'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const sampleQuestions = [
    'What time is evening aarti?',
    'What poojas are scheduled today?',
    'How much has been collected so far?',
    'Who are the emergency contacts?',
    'How do I sponsor prasad or donate?'
  ]

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <span>Ask a Question (AI Guide)</span>
          <span style={{ fontSize: '0.76rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid #bae6fd' }}>
            ✨ Powered by Google AI (Gemini)
          </span>
        </div>
      }
    >
      <p className="muted">
        Need a pooja timing, a festival schedule detail, or pandal guidance? Ask below.
      </p>

      {/* Chat Thread */}
      <div className="chat-thread-container" style={{ background: '#fdf8f0', border: '1px solid #ebd9be', borderRadius: '10px', padding: '14px', marginBottom: '14px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? '#7c2414' : '#ffffff',
              color: msg.role === 'user' ? '#ffffff' : '#25211d',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: msg.role === 'user' ? 'none' : '1px solid #e5d5be'
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: '700', opacity: 0.8, marginBottom: '2px', color: msg.role === 'user' ? '#fed7aa' : '#854d0e' }}>
              {msg.role === 'user' ? '👤 You' : '🪔 Vedika Assistant'}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</p>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #e5d5be', padding: '8px 14px', borderRadius: '12px 12px 12px 2px', color: '#854d0e', fontSize: '0.85rem' }}>
            <span className="loading-spinner">🪔</span> Consulting Google Gemini & festival records…
          </div>
        )}
      </div>

      <form className="ask-form" onSubmit={ask}>
        <div className="ask-input-row">
          <input
            value={question}
            required
            maxLength={250}
            disabled={loading}
            placeholder="Ask about aarti timings, poojas, donations, contacts..."
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? 'Thinking…' : 'Ask'}
          </Button>
        </div>
      </form>

      <div className="sample-questions" style={{ marginTop: '12px' }}>
        <small style={{ color: '#7c2414', fontWeight: '700' }}>💡 Suggested Questions:</small>
        <div className="sample-pills" style={{ marginTop: '6px' }}>
          {sampleQuestions.map((q) => (
            <button
              key={q}
              type="button"
              className="sample-pill-btn"
              disabled={loading}
              onClick={() => {
                ask(null, q)
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="form-error" style={{ marginTop: '14px' }}>
          ⚠ {errorMsg}
        </div>
      )}
    </Card>
  )
}
