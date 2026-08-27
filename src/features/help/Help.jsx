import { useState } from 'react'
import { Card, Button } from '../../components/ui'

export function Help({ data }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
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
    const queryToAsk = customQuery || question
    if (!queryToAsk || !queryToAsk.trim()) return

    setLoading(true)
    setAnswer('')
    setErrorMsg('')

    try {
      const response = await fetch(
        import.meta.env.VITE_AI_ENDPOINT || '/api/ask',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: queryToAsk.trim(),
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

      setAnswer(body.answer)
    } catch (error) {
      setErrorMsg(error.message || 'Unable to connect to AI assistant.')
    } finally {
      setLoading(false)
    }
  }

  const sampleQuestions = [
    'What time is evening aarti?',
    'What activities are scheduled for today?',
    'Who are the emergency contacts?',
    'How much has been collected so far?'
  ]

  return (
    <Card title="Ask a Question (AI Guide)">
      <p>
        Need a timing, a festival schedule detail, or pandal guidance? Ask below.
        For emergency or logistical matters, please check directly with the committee.
      </p>

      <form className="ask-form" onSubmit={ask}>
        <div className="ask-input-row">
          <input
            value={question}
            required
            maxLength={250}
            disabled={loading}
            placeholder="e.g. What time is morning aarti?"
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? 'Asking…' : 'Ask'}
          </Button>
        </div>
      </form>

      <div className="sample-questions">
        <small>Suggested questions:</small>
        <div className="sample-pills">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              type="button"
              className="sample-pill-btn"
              disabled={loading}
              onClick={() => {
                setQuestion(q)
                ask(null, q)
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="ai-loading">
          <span>🪔 Consulting festival schedule…</span>
        </div>
      )}

      {errorMsg && (
        <div className="form-error" style={{ marginTop: '14px' }}>
          ⚠ {errorMsg}
        </div>
      )}

      {answer && (
        <div className="answer-card" role="region" aria-live="polite">
          <div className="answer-header">
            <b>🙏 Vedika Assistant:</b>
          </div>
          <p className="answer-text">{answer}</p>
        </div>
      )}
    </Card>
  )
}

