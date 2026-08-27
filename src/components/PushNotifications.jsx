import { useEffect, useState } from 'react'
import { Button } from './ui'

/** Opt-in browser push control with safe VAPID key validation. */
export function PushNotifications({ session }) {
  const [supported, setSupported] = useState(false)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

  useEffect(() => {
    const isPushAvailable =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      Boolean(vapidKey) &&
      vapidKey !== 'your-vapid-public-key'

    setSupported(isPushAvailable)
  }, [vapidKey])

  if (!supported) return null

  const enable = async () => {
    setState('working')
    setMessage('')
    try {
      const appKeyBytes = base64UrlToBytes(vapidKey)
      if (!appKeyBytes) {
        throw new Error('Push notification keys are not configured on this server yet.')
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notifications were not allowed. You can enable them in browser settings.')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKeyBytes
      })

      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(subscription.toJSON())
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.error || 'Could not save notification preference.')
      }

      setState('enabled')
      setMessage('Reminders are on. We will notify you before upcoming activities.')
    } catch (error) {
      setState('idle')
      setMessage(error.message)
    }
  }

  return (
    <div className="push-control">
      <span>🔔 Get activity reminders</span>
      <Button
        kind="secondary"
        size="small"
        disabled={state === 'working' || state === 'enabled'}
        onClick={enable}
      >
        {state === 'enabled' ? 'Reminders on' : state === 'working' ? 'Enabling…' : 'Enable'}
      </Button>
      {message && <small>{message}</small>}
    </div>
  )
}

function base64UrlToBytes(value) {
  if (!value || typeof value !== 'string' || value.includes('your-vapid')) return null
  try {
    const padding = '='.repeat((4 - (value.length % 4)) % 4)
    const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'))
    return Uint8Array.from(raw, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}
