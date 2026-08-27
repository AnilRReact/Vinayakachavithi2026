import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Called by Vercel Cron every five minutes. It sends only within 30 ± 5 minutes
// of an activity's explicit IST start time and records every delivery once.
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error:'Unauthorized' })
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return res.status(503).json({ error:'Reminder service is not configured.' })
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
  const db = createClient(url, serviceKey, { auth:{persistSession:false} })
  const { data: activities, error } = await db.from('activities').select('id,title,date,start_time,location').not('start_time','is',null).gte('date', new Date().toISOString().slice(0,10))
  if (error) return res.status(500).json({ error:error.message })
  const now = Date.now(), selected = activities.filter((activity) => { const start = new Date(`${activity.date}T${activity.start_time}+05:30`).getTime(); const minutes = (start - now) / 60000; return minutes >= 25 && minutes <= 35 })
  const { data: subscriptions } = await db.from('push_subscriptions').select('id,endpoint,p256dh,auth')
  let sent = 0
  for (const activity of selected) for (const subscription of subscriptions || []) {
    const { data: delivery } = await db.from('push_deliveries').insert({ activity_id:activity.id, subscription_id:subscription.id }).select('id').maybeSingle()
    if (!delivery) continue
    try { await webpush.sendNotification({ endpoint:subscription.endpoint, keys:{p256dh:subscription.p256dh,auth:subscription.auth} }, JSON.stringify({ title:`🪔 ${activity.title}`, body:`Starts in about 30 minutes${activity.location ? ` · ${activity.location}` : ''}`, url:'/', tag:`activity-${activity.id}` })); sent++ }
    catch (pushError) { await db.from('push_deliveries').delete().eq('id',delivery.id); if ([404,410].includes(pushError.statusCode)) await db.from('push_subscriptions').delete().eq('id',subscription.id) }
  }
  return res.status(200).json({ sent, activities:selected.length })
}
