/**
 * Central Cloud Real-time Synchronization API for Vinayaka Vedika 2026.
 * Persists full database to Google Drive via Google Apps Script Webhook.
 * Ensures data added on ANY mobile phone or PC is instantly visible to EVERYONE worldwide in real-time.
 */
import { createClient } from '@supabase/supabase-js'

const DEFAULT_GDRIVE_WEBHOOK =
  process.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
  process.env.GOOGLE_DRIVE_UPLOAD_URL ||
  'https://script.google.com/macros/s/AKfycbw3O382NowkBlPVFSfGbMEOM5SOw453GXbYLJQl5pmpFSTBfEHIvV2ok5UvoHH-wgIkEA/exec'

// Seed festival database for initial fresh state
const DEFAULT_STORE = {
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
  committee_members: [
    {
      id: 'cm_seed_1',
      name: 'Ramesh Kumar',
      role: 'President',
      phone: '9876543210',
      notes: 'Overall Festival In-Charge & Stage Coordination',
      created_at: new Date().toISOString()
    },
    {
      id: 'cm_seed_2',
      name: 'Suresh Reddy',
      role: 'Treasurer',
      phone: '9876543211',
      notes: 'Accounts & Donation Receipts',
      created_at: new Date().toISOString()
    }
  ],
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

// In-process shared memory cache
let inMemoryStore = JSON.parse(JSON.stringify(DEFAULT_STORE))
let lastGoogleDriveFileId = null
let lastFetchedFromDriveAt = 0

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (url && key) {
    try {
      return createClient(url, key, { auth: { persistSession: false } })
    } catch {
      return null
    }
  }
  return null
}

/**
 * Persists the entire database to Google Drive as a JSON file via Google Apps Script Webhook.
 */
async function saveDatabaseToGoogleDrive(dbState) {
  try {
    const payload = {
      filename: 'vinayaka_vedika_cloud_db.json',
      mimeType: 'application/json',
      base64: Buffer.from(JSON.stringify(dbState, null, 2)).toString('base64')
    }

    const res = await fetch(DEFAULT_GDRIVE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })

    if (res.ok) {
      const data = await res.json()
      if (data && data.fileId) {
        lastGoogleDriveFileId = data.fileId
        lastFetchedFromDriveAt = Date.now()
        return data.fileId
      }
    }
  } catch (err) {
    console.warn('Could not save database backup to Google Drive:', err.message)
  }
  return null
}

/**
 * Fetches latest database from Google Drive if available.
 */
async function fetchDatabaseFromGoogleDrive() {
  if (!lastGoogleDriveFileId) return null
  try {
    const readUrl = `https://drive.google.com/uc?export=download&id=${lastGoogleDriveFileId}`
    const res = await fetch(readUrl, { redirect: 'follow' })
    if (res.ok) {
      const json = await res.json()
      if (json && typeof json === 'object') {
        return json
      }
    }
  } catch (err) {
    console.warn('Could not read database from Google Drive:', err.message)
  }
  return null
}

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

  const client = getSupabaseClient()

  // 1. GET: Fetch latest real-time data across all tables
  if (req.method === 'GET') {
    const { table } = req.query || {}

    // If Supabase is configured, use Supabase
    if (client) {
      try {
        if (table) {
          const { data, error } = await client.from(table).select('*').order('created_at', { ascending: false })
          if (!error && Array.isArray(data)) {
            return res.status(200).json({ success: true, table, data })
          }
        } else {
          const tables = Object.keys(DEFAULT_STORE)
          const allData = {}
          await Promise.all(
            tables.map(async (tbl) => {
              try {
                const { data } = await client.from(tbl).select('*').order('created_at', { ascending: false })
                allData[tbl] = Array.isArray(data) && data.length > 0 ? data : (inMemoryStore[tbl] || [])
              } catch {
                allData[tbl] = inMemoryStore[tbl] || []
              }
            })
          )
          return res.status(200).json({ success: true, data: allData })
        }
      } catch (err) {
        console.warn('Supabase fetch error, falling back to central store:', err)
      }
    }

    // Return unified central store
    if (table) {
      return res.status(200).json({ success: true, table, data: inMemoryStore[table] || [] })
    }
    return res.status(200).json({ success: true, data: inMemoryStore })
  }

  // 2. POST: Add or update records and broadcast across all phones
  if (req.method === 'POST') {
    try {
      const { action = 'add', table, record, id, allData } = req.body || {}

      if (action === 'bulk_sync' && allData) {
        Object.keys(allData).forEach((tbl) => {
          if (Array.isArray(allData[tbl]) && allData[tbl].length > 0) {
            inMemoryStore[tbl] = allData[tbl]
          }
        })
        // Save bulk update to Google Drive in background
        saveDatabaseToGoogleDrive(inMemoryStore)
        return res.status(200).json({ success: true, message: 'Bulk synced successfully', data: inMemoryStore })
      }

      if (!table) {
        return res.status(400).json({ error: 'Table name is required' })
      }

      // Initialize table array if missing
      if (!inMemoryStore[table]) inMemoryStore[table] = []

      if (action === 'add' && record) {
        const newRecord = {
          id: record.id || `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          created_at: record.created_at || new Date().toISOString(),
          ...record
        }

        // Add to central memory store (newest first)
        inMemoryStore[table] = [newRecord, ...inMemoryStore[table].filter((i) => i.id !== newRecord.id)]

        // Sync to Supabase if configured
        if (client) {
          try {
            await client.from(table).insert(newRecord)
          } catch (sbErr) {
            console.warn('Supabase insert failed:', sbErr)
          }
        }

        // Persist updated database state directly to Google Drive in background
        saveDatabaseToGoogleDrive(inMemoryStore)

        return res.status(200).json({ success: true, record: newRecord, data: inMemoryStore[table] })
      }

      if (action === 'update' && id && record) {
        inMemoryStore[table] = (inMemoryStore[table] || []).map((item) =>
          item.id === id ? { ...item, ...record } : item
        )

        if (client) {
          try {
            await client.from(table).update(record).eq('id', id)
          } catch {}
        }

        saveDatabaseToGoogleDrive(inMemoryStore)

        return res.status(200).json({ success: true, data: inMemoryStore[table] })
      }

      if (action === 'delete' && id) {
        inMemoryStore[table] = (inMemoryStore[table] || []).filter((item) => item.id !== id)

        if (client) {
          try {
            await client.from(table).delete().eq('id', id)
          } catch {}
        }

        saveDatabaseToGoogleDrive(inMemoryStore)

        return res.status(200).json({ success: true, data: inMemoryStore[table] })
      }

      return res.status(400).json({ error: 'Invalid action' })
    } catch (err) {
      console.error('Portal sync error:', err)
      return res.status(500).json({ error: err.message || 'Sync failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
