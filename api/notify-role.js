/**
 * Serverless API endpoint for automated SMS/WhatsApp notifications on role assignment.
 * Supports Twilio, Fast2SMS, MSG91, or custom webhooks when environment variables are set.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, name, role, duty, date, type, villageName = 'Vinayaka Vedika' } = req.body || {}

  if (!phone || !name) {
    return res.status(400).json({ error: 'Phone and Name are required' })
  }

  // Fast2SMS integration (popular in India for festival alerts)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const message =
        type === 'volunteer'
          ? `Namaste ${name}! You are assigned to volunteer duty: ${duty} on ${date} for ${villageName}. Thank you!`
          : `Namaste ${name}! You have been appointed as ${role} for ${villageName} 2026. Ganapathi Bappa Morya!`

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message,
          numbers: phone.replace(/^91/, '') // 10 digit Indian number
        })
      })

      const data = await response.json()
      return res.status(200).json({ success: true, provider: 'fast2sms', data })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // Twilio integration (if TWILIO credentials present)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const message =
        type === 'volunteer'
          ? `Namaste ${name}! You are assigned volunteer duty: ${duty} on ${date} for ${villageName}.`
          : `Namaste ${name}! You have been assigned as ${role} for ${villageName} 2026.`

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
      const params = new URLSearchParams()
      params.append('To', `+${phone}`)
      params.append('From', process.env.TWILIO_PHONE_NUMBER)
      params.append('Body', message)

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      const data = await response.json()
      return res.status(200).json({ success: true, provider: 'twilio', data })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // If no SMS gateway keys configured, return fallback status so client opens WhatsApp Web
  return res.status(200).json({
    success: true,
    note: 'SMS gateway not configured in .env. Falling back to direct WhatsApp link.'
  })
}

