/**
 * Serverless API proxy for Google Drive and Google Sheets uploads.
 * Eliminates browser CORS and 302 redirect issues by forwarding requests server-side.
 */

const DEFAULT_GDRIVE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbw3O382NowkBlPVFSfGbMEOM5SOw453GXbYLJQl5pmpFSTBfEHIvV2ok5UvoHH-wgIkEA/exec'

export default async function handler(req, res) {
  // Enable CORS for local dev and preview domains
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl =
    process.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
    process.env.GOOGLE_DRIVE_UPLOAD_URL ||
    DEFAULT_GDRIVE_WEBHOOK

  try {
    const payload = req.body || {}
    
    // Server-side fetch to Google Apps Script Web App
    const gasResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload)
    })

    const rawText = await gasResponse.text()
    let result = null
    try {
      result = JSON.parse(rawText)
    } catch {
      result = { url: rawText }
    }

    if (result.error) {
      return res.status(500).json({ error: result.error })
    }

    const directUrl =
      result.url ||
      (result.fileId ? `https://lh3.googleusercontent.com/d/${result.fileId}` : '') ||
      result.fileUrl

    return res.status(200).json({
      success: true,
      url: directUrl,
      fileId: result.fileId,
      result
    })
  } catch (err) {
    console.error('Google Drive serverless proxy error:', err)
    return res.status(500).json({ error: err.message || 'Failed to upload to Google Drive' })
  }
}
