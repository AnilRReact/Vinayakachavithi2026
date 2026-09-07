/**
 * Central Cloud Real-time Synchronization API for Vinayaka Vedika 2026.
 * Persists full database to Google Drive via Google Apps Script Webhook.
 * Ensures data added on ANY mobile phone or PC is instantly visible to EVERYONE worldwide in real-time.
 */

const DEFAULT_GDRIVE_WEBHOOK =
  process.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
  process.env.GOOGLE_DRIVE_UPLOAD_URL ||
  'https://script.google.com/macros/s/AKfycbx1uG_Vy7dQDjUbzUHEtvRC8v8bQa7WVQ090PO8RaJo2LeirNa4B4Y9VpZojEyci51G/exec'

// Fallback seed database for fresh instances
const SEED_DATABASE = {
  settings: [
    {
      id: 'default-settings',
      village_name: 'Vinayaka Vedika 2026',
      tagline: 'Our village celebration, in one place.',
      festival_date: '2026-09-14',
      morning_aarti_time: '06:30 AM',
      evening_aarti_time: '07:30 PM',
      daily_schedule_note: 'Daily Pooja & Maha Harathi every morning & evening. All devotees are welcome.',
      google_drive_upload_url: DEFAULT_GDRIVE_WEBHOOK
    }
  ],
  committee_members: [],
  donations: [],
  expenses: [],
  purchases: [],
  bid_items: [
    {
      id: 'bid_seed_1',
      item_name: 'Special Maha Laddu Prasadam (15 Kg)',
      starting_bid: 5000,
      current_bid: 5000,
      current_bidder: '',
      status: 'open',
      created_at: new Date().toISOString()
    }
  ],
  bid_history: [],
  awards: [],
  nominees: [],
  activities: [
    {
      id: 'act_seed_1',
      title: 'Sri Maha Ganapathi Prana Pratishta & Morning Pooja',
      date: '2026-09-14',
      start_time: '07:30',
      end_time: '09:30',
      location: 'Main Village Pandal Stage',
      description: 'Sacred Prana Pratishta rituals by Vedic priests followed by Morning Maha Harathi.'
    },
    {
      id: 'act_seed_2',
      title: 'Evening Bhajan & Maha Mangala Harathi',
      date: '2026-09-14',
      start_time: '19:30',
      end_time: '21:00',
      location: 'Main Village Pandal Stage',
      description: 'Devotional bhajan singing, laddu distribution, and evening harathi.'
    }
  ],
  prasad_sponsors: [],
  volunteers: [],
  notices: [
    {
      id: 'not_seed_1',
      message: 'Welcome to Sri Vinayaka Vedika 2026! Daily morning aarti at 6:30 AM and evening aarti at 7:30 PM. All devotees are cordially invited.',
      pinned: true,
      date: '2026-09-14',
      created_at: new Date().toISOString()
    }
  ],
  gallery_items: [],
  music_playlist: []
}

// In-process memory store for fast edge caching
let edgeMemoryCache = JSON.parse(JSON.stringify(SEED_DATABASE))

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const webhookUrl =
    process.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
    process.env.GOOGLE_DRIVE_UPLOAD_URL ||
    DEFAULT_GDRIVE_WEBHOOK

  // 1. GET: Fetch latest real-time database from Google Drive Webhook
  if (req.method === 'GET') {
    const { table } = req.query || {}

    try {
      // 1a. Try fetching directly from Google Apps Script Webhook (doGet or doPost read)
      const gasResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all' }),
        redirect: 'follow'
      })

      if (gasResponse.ok) {
        const gasJson = await gasResponse.json()
        if (gasJson && gasJson.data && typeof gasJson.data === 'object') {
          edgeMemoryCache = gasJson.data
          if (table) {
            return res.status(200).json({ success: true, table, data: edgeMemoryCache[table] || [] })
          }
          return res.status(200).json({ success: true, data: edgeMemoryCache })
        }
      }
    } catch (gasErr) {
      // Fall through to memory cache
    }

    // 1b. Fallback to edge memory cache
    if (table) {
      return res.status(200).json({ success: true, table, data: edgeMemoryCache[table] || [] })
    }
    return res.status(200).json({ success: true, data: edgeMemoryCache })
  }

  // 2. POST: Add / Update / Delete / Bulk Sync to Google Drive Webhook
  if (req.method === 'POST') {
    try {
      const payload = req.body || {}
      const { action = 'add', table, record, id, allData } = payload

      // Update edge memory cache immediately
      if (action === 'bulk_sync' && allData) {
        Object.keys(allData).forEach((tbl) => {
          if (Array.isArray(allData[tbl])) {
            edgeMemoryCache[tbl] = allData[tbl]
          }
        })
      } else if (table) {
        if (!edgeMemoryCache[table]) edgeMemoryCache[table] = []

        if (action === 'add' && record) {
          const newRecord = {
            id: record.id || `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            created_at: record.created_at || new Date().toISOString(),
            ...record
          }
          edgeMemoryCache[table] = [newRecord, ...edgeMemoryCache[table].filter((i) => i.id !== newRecord.id)]
        } else if (action === 'update' && id && record) {
          edgeMemoryCache[table] = edgeMemoryCache[table].map((item) =>
            item.id === id ? { ...item, ...record } : item
          )
        } else if (action === 'delete' && id) {
          edgeMemoryCache[table] = edgeMemoryCache[table].filter((item) => item.id !== id)
        }
      }

      // Forward to Google Apps Script Webhook to persist in Google Drive (Awaited with timeout)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 7500)

        const gasRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          redirect: 'follow',
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (gasRes && gasRes.ok) {
          const gasJson = await gasRes.json()
          if (gasJson && gasJson.data && typeof gasJson.data === 'object') {
            edgeMemoryCache = gasJson.data
          }
        }
      } catch (gasErr) {
        console.warn('Google Drive webhook write warning:', gasErr.message || gasErr)
      }

      if (table) {
        return res.status(200).json({ success: true, data: edgeMemoryCache[table] })
      }
      return res.status(200).json({ success: true, data: edgeMemoryCache })
    } catch (err) {
      console.error('Portal sync error:', err)
      return res.status(500).json({ error: err.message || 'Sync failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
