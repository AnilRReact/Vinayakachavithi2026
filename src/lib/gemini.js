/**
 * Direct Google Gemini API helper for local dev / client fallback
 */
export async function askGeminiDirectly({ question, context, apiKey }) {
  const key =
    apiKey ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    ''

  const settings = context?.settings || {}
  const activities = context?.activities || []
  const raised = Number(context?.raised || 0)
  const spent = Number(context?.spent || 0)
  const villageName = settings.village_name || 'Vinayaka Vedika'

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
Answer in 2–3 friendly sentences. Be polite, festive, and helpful (Ganapathi Bappa Morya! 🙏). 
Use the live festival context provided. Do not invent dates or timings that are not in the context. If information is not available, advise checking with the committee coordinator.`

  if (key) {
    try {
      const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemInstruction}\n\n${contextSummary}\n\nUser Question: ${question}`
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
        return {
          answer: data.candidates[0].content.parts[0].text.trim(),
          provider: 'google-gemini'
        }
      }
    } catch {
      // Fall through to smart grounded fallback
    }
  }

  // Built-in intelligent smart grounding fallback
  const q = String(question || '').toLowerCase()

  if (q.includes('aarti') || q.includes('time') || q.includes('timing')) {
    const morning = settings.morning_aarti_time || 'Morning'
    const evening = settings.evening_aarti_time || 'Evening'
    return {
      answer: `🪔 Daily Aarti at ${villageName}: Morning aarti is at ${morning} and Evening aarti is at ${evening}. All devotees are cordially welcome to participate and receive divine blessings!`,
      provider: 'vedika-grounded'
    }
  }

  if (q.includes('money') || q.includes('collect') || q.includes('fund') || q.includes('raised') || q.includes('donation') || q.includes('donate') || q.includes('upi')) {
    return {
      answer: `💰 So far, our community has raised ₹${raised.toLocaleString('en-IN')} with ₹${spent.toLocaleString('en-IN')} in expenses (Balance: ₹${(raised - spent).toLocaleString('en-IN')}). You can donate directly via UPI (${settings.upi_id || 'scan QR in Money section'}) and download an official Ganesha receipt!`,
      provider: 'vedika-grounded'
    }
  }

  if (q.includes('doctor') || q.includes('police') || q.includes('emergency') || q.includes('contact') || q.includes('help')) {
    const doc = settings.em_doctor_name ? `${settings.em_doctor_name} (📞 ${settings.em_doctor_phone})` : 'Available on call'
    const police = settings.em_police_phone ? `📞 ${settings.em_police_phone}` : 'Local Station'
    const coord = settings.em_coord_name ? `${settings.em_coord_name} (📞 ${settings.em_coord_phone})` : 'Committee Desk'
    return {
      answer: `🚨 Emergency Contacts for ${villageName}: Doctor: ${doc} · Police: ${police} · Coordinator: ${coord}. Please reach out immediately if needed!`,
      provider: 'vedika-grounded'
    }
  }

  if (q.includes('activity') || q.includes('event') || q.includes('schedule') || q.includes('program') || q.includes('today')) {
    if (activities.length > 0) {
      const top3 = activities.slice(0, 3).map((a) => `${a.title} (${a.date}${a.start_time ? ` at ${a.start_time}` : ''})`).join(', ')
      return {
        answer: `📅 Upcoming Festival Events: ${top3}. You can view the complete timeline and add events to Google Calendar from the Schedule tab!`,
        provider: 'vedika-grounded'
      }
    }
    return {
      answer: `📅 Festival events and pooja rituals are listed in the Schedule tab. Check there for all live timings and calendar reminders!`,
      provider: 'vedika-grounded'
    }
  }

  return {
    answer: `🙏 Welcome to ${villageName} Vinayaka Chavithi 2026! Feel free to ask about aarti timings, scheduled events, emergency contacts, or how to donate. Ganapathi Bappa Morya!`,
    provider: 'vedika-grounded'
  }
}
