// Vercel serverless function. Set ANTHROPIC_API_KEY in Vercel, never in the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { question, context } = req.body || {}
  if (typeof question !== 'string' || !question.trim()) return res.status(400).json({ error: 'Please enter a question.' })
  if (question.length > 500) return res.status(413).json({ error: 'Please keep your question under 500 characters.' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'The guidance assistant has not been configured yet.' })
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514', max_tokens: 220, system: `You are the short, warm Vinayaka Vedika village festival guide. Answer in 2–4 plain sentences. Use the live portal context when relevant. Do not invent arrangements. Context: ${JSON.stringify(context)}`, messages: [{ role:'user', content:question }] })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message || 'Anthropic request failed')
    return res.status(200).json({ answer: payload.content?.[0]?.text || 'Please ask the committee for help.' })
  } catch (error) { return res.status(502).json({ error: error.message }) }
}
