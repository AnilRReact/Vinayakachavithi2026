import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const { endpoint, keys } = req.body || {}
  if (!url || !serviceKey) return res.status(503).json({ error: 'Push subscriptions are not configured yet.' })
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: 'Invalid browser subscription.' })
  const client = createClient(url, serviceKey, { auth: { persistSession:false } })
  let userId = null
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (token) { const { data: { user } } = await client.auth.getUser(token); userId = user?.id || null }
  const { error } = await client.from('push_subscriptions').upsert({ endpoint, p256dh:keys.p256dh, auth:keys.auth, user_id:userId, updated_at:new Date().toISOString() }, { onConflict:'endpoint' })
  return error ? res.status(400).json({ error:error.message }) : res.status(200).json({ ok:true })
}
