// Vercel serverless function supporting Google Gemini AI (Default) & Anthropic with offline smart fallback
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, context } = req.body || {}
  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Please enter a question.' })
  }
  if (question.length > 500) {
    return res.status(413).json({ error: 'Please keep your question under 500 characters.' })
  }

  const cleanQuestion = question.trim()
  const settings = context?.settings || {}
  const activities = context?.activities || []
  const raised = Number(context?.raised || 0)
  const spent = Number(context?.spent || 0)
  const villageName = settings.village_name || 'Vinayaka Vedika'

  // Context summary text
  const contextSummary = `
Portal Context:
- Village / Colony Name: ${villageName}
- Festival Tagline: ${settings.tagline || 'Our village celebration'}
- Festival Date: ${settings.festival_date || 'Vinayaka Chavithi 2026'}
- Morning Aarti Time: ${settings.morning_aarti_time || 'Not specified'}
- Evening Aarti Time: ${settings.evening_aarti_time || 'Not specified'}
- Daily Schedule Note: ${settings.daily_schedule_note || 'None'}
- UPI ID for Donations: ${settings.upi_id || 'Available on portal'}
- Total Raised: ₹${raised.toLocaleString('en-IN')}
- Total Spent: ₹${spent.toLocaleString('en-IN')}
- Balance in Hand: ₹${(raised - spent).toLocaleString('en-IN')}
- Emergency Doctor: ${settings.em_doctor_name ? `${settings.em_doctor_name} (${settings.em_doctor_phone})` : 'Registered with committee'}
- Police Station: ${settings.em_police_phone || 'Local Police Station'}
- Key Coordinator: ${settings.em_coord_name ? `${settings.em_coord_name} (${settings.em_coord_phone})` : 'Committee Desk'}
- Scheduled Activities (${activities.length}): ${activities.map((a) => `${a.title} on ${a.date}${a.start_time ? ` at ${a.start_time}` : ''}`).join('; ')}
`

  const systemInstruction = `You are the short, warm, and helpful AI guide for the ${villageName} Vinayaka Chavithi 2026 celebration. 
Answer in 2–3 friendly sentences. Be polite, festive, and helpful (Ganapathi Bappa Morya!). 
Use the live festival context provided below. Do not invent dates or timings that are not in the context. If information is not available, advise checking with the committee coordinator.`

  // 1. Check Google Gemini AI (Google AI Studio)
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY

  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemInstruction}\n\n${contextSummary}\n\nUser Question: ${cleanQuestion}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300
          }
        })
      })

      const data = await response.json()
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text.trim()
        return res.status(200).json({ answer: text, provider: 'google-gemini' })
      }
    } catch (err) {
      // Fall through to Anthropic or smart fallback
    }
  }

  // 2. Check Anthropic Claude API
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: 250,
          system: `${systemInstruction}\n\n${contextSummary}`,
          messages: [{ role: 'user', content: cleanQuestion }]
        })
      })
      const payload = await response.json()
      if (response.ok && payload.content?.[0]?.text) {
        return res.status(200).json({ answer: payload.content[0].text.trim(), provider: 'anthropic' })
      }
    } catch (err) {
      // Fall through to smart grounding
    }
  }

  // 3. Smart Built-in Grounded Response Engine (Zero-configuration Fallback)
  const q = cleanQuestion.toLowerCase()

  if (q.includes('aarti') || q.includes('time') || q.includes('timing')) {
    const morning = settings.morning_aarti_time || 'Morning'
    const evening = settings.evening_aarti_time || 'Evening'
    return res.status(200).json({
      answer: `🪔 Daily Aarti at ${villageName}: Morning aarti is at ${morning} and Evening aarti is at ${evening}. All devotees are cordially welcome to participate and receive divine blessings!`,
      provider: 'vedika-grounded'
    })
  }

  if (q.includes('money') || q.includes('collect') || q.includes('fund') || q.includes('raised') || q.includes('donation') || q.includes('donate') || q.includes('upi')) {
    return res.status(200).json({
      answer: `💰 So far, our community has raised ₹${raised.toLocaleString('en-IN')} with ₹${spent.toLocaleString('en-IN')} in expenses (Balance: ₹${(raised - spent).toLocaleString('en-IN')}). You can donate directly via UPI (${settings.upi_id || 'scan QR in Money section'}) and download an official Ganesha receipt!`,
      provider: 'vedika-grounded'
    })
  }

  if (q.includes('doctor') || q.includes('police') || q.includes('emergency') || q.includes('contact') || q.includes('help')) {
    const doc = settings.em_doctor_name ? `${settings.em_doctor_name} (📞 ${settings.em_doctor_phone})` : 'Available on call'
    const police = settings.em_police_phone ? `📞 ${settings.em_police_phone}` : 'Local Station'
    const coord = settings.em_coord_name ? `${settings.em_coord_name} (📞 ${settings.em_coord_phone})` : 'Committee Desk'
    return res.status(200).json({
      answer: `🚨 Emergency Contacts for ${villageName}: Doctor: ${doc} · Police: ${police} · Coordinator: ${coord}. Please reach out immediately if needed!`,
      provider: 'vedika-grounded'
    })
  }

  if (q.includes('activity') || q.includes('event') || q.includes('schedule') || q.includes('program') || q.includes('today')) {
    if (activities.length > 0) {
      const top3 = activities.slice(0, 3).map((a) => `${a.title} (${a.date}${a.start_time ? ` at ${a.start_time}` : ''})`).join(', ')
      return res.status(200).json({
        answer: `📅 Upcoming Festival Events: ${top3}. You can view the complete timeline and add events to Google Calendar from the Schedule tab!`,
        provider: 'vedika-grounded'
      })
    }
    return res.status(200).json({
      answer: `📅 Festival events and pooja rituals are listed in the Schedule tab. Check there for all live timings and calendar reminders!`,
      provider: 'vedika-grounded'
    })
  }

  return res.status(200).json({
    answer: `🙏 Welcome to ${villageName} Vinayaka Chavithi 2026! Feel free to ask about aarti timings, scheduled events, emergency contacts, or how to donate. Ganapathi Bappa Morya!`,
    provider: 'vedika-grounded'
  })
}
