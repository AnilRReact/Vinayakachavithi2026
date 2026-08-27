// Vercel serverless route. It provisions an invited phone in Supabase Auth so
// signInWithOtp(... shouldCreateUser:false) cannot become open self-registration.
import { createClient } from '@supabase/supabase-js'

const validRole = (value) => value === 'committee' || value === 'treasurer'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const authHeader = req.headers.authorization
  if (!url || !serviceKey || !authHeader) return res.status(500).json({ error: 'Invitation service is not configured.' })
  const client = createClient(url, serviceKey, { auth: { persistSession: false } })
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: { user }, error: authError } = await client.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Please sign in again.' })
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'committee') return res.status(403).json({ error: 'Only Committee members can invite people.' })
  const { phone, role } = req.body || {}
  if (!/^\+[1-9]\d{7,14}$/.test(phone || '') || !validRole(role)) return res.status(400).json({ error: 'Use an E.164 phone number, for example +919876543210, and choose a role.' })
  const { error: inviteError } = await client.from('committee_invites').upsert({ phone, role, invited_by: user.id }, { onConflict: 'phone' })
  if (inviteError) return res.status(400).json({ error: inviteError.message })
  const { data: users } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = users?.users?.find((candidate) => candidate.phone === phone)
  if (!existing) {
    const { error } = await client.auth.admin.createUser({ phone, phone_confirm: false })
    if (error) return res.status(400).json({ error: error.message })
  }
  return res.status(200).json({ ok: true })
}
