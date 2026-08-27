import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Modal } from '../../components/ui'
import { openWhatsAppMessage } from '../../lib/notifications'
import { useToast } from '../../context/ToastContext'

const DEFAULT_STOPS = [
  {
    id: '1',
    title: 'Pandal Maha Aarti & Rath Yatra Start',
    landmark: 'Main Pandal Stage',
    status: 'completed',
    time: '04:00 PM',
    note: 'Maha Harathi & coconut breaking ceremony'
  },
  {
    id: '2',
    title: 'Main Bazaar & Dappu Dance Showcase',
    landmark: 'Bazaar Cross Road',
    status: 'current',
    time: '05:30 PM',
    note: 'Youth cultural dance & Dappu performances underway'
  },
  {
    id: '3',
    title: 'Sri Hanuman Temple / Old Well Cross',
    landmark: 'Temple Street',
    status: 'upcoming',
    time: '07:00 PM',
    note: 'Special Prasadam distribution point'
  },
  {
    id: '4',
    title: 'Lake Road & Fireworks Spectacle',
    landmark: 'Ghat Entry Arch',
    status: 'upcoming',
    time: '08:30 PM',
    note: 'Grand fireworks display before Visarjan'
  },
  {
    id: '5',
    title: 'Sacred Nimajjanam & Visarjan Ceremony',
    landmark: 'Immersion Lake Ghat',
    status: 'upcoming',
    time: '09:30 PM',
    note: 'Holy Visarjan with divine prayers & chants'
  }
]

export function ProcessionTracker({ settings = {}, admin = false, onUpdateSettings }) {
  const { toast } = useToast()
  const villageName = settings.village_name || 'Vinayaka Vedika'

  // Load saved stops from settings or local storage
  const [stops, setStops] = useState(() => {
    try {
      if (settings.procession_stops) {
        return typeof settings.procession_stops === 'string'
          ? JSON.parse(settings.procession_stops)
          : settings.procession_stops
      }
      const local = localStorage.getItem('vv_procession_stops')
      if (local) return JSON.parse(local)
    } catch {
      // ignore
    }
    return DEFAULT_STOPS
  })

  const [isLiveMode, setIsLiveMode] = useState(() => {
    try {
      if (typeof settings.procession_live !== 'undefined') {
        return Boolean(settings.procession_live)
      }
      const local = localStorage.getItem('vv_procession_live')
      return local === 'true'
    } catch {
      return true
    }
  })

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [customLiveNote, setCustomLiveNote] = useState('')
  const [editingStop, setEditingStop] = useState(null)

  // Save changes helper
  const saveProcessionState = async (newStops, newLiveMode) => {
    setStops(newStops)
    setIsLiveMode(newLiveMode)
    try {
      localStorage.setItem('vv_procession_stops', JSON.stringify(newStops))
      localStorage.setItem('vv_procession_live', String(newLiveMode))
      if (onUpdateSettings && settings.id) {
        await onUpdateSettings({
          procession_stops: JSON.stringify(newStops),
          procession_live: newLiveMode
        })
      }
    } catch {
      // ignore
    }
  }

  // Active / Current stop
  const currentStop = useMemo(() => {
    return stops.find((s) => s.status === 'current') || stops[0]
  }, [stops])

  const nextStop = useMemo(() => {
    const currIdx = stops.findIndex((s) => s.status === 'current')
    if (currIdx >= 0 && currIdx < stops.length - 1) {
      return stops[currIdx + 1]
    }
    return null
  }, [stops])

  const progressPercent = useMemo(() => {
    const completedCount = stops.filter((s) => s.status === 'completed').length
    const currentBonus = stops.some((s) => s.status === 'current') ? 0.5 : 0
    return Math.min(100, Math.round(((completedCount + currentBonus) / stops.length) * 100))
  }, [stops])

  const handleSetCurrent = (stopId) => {
    if (!admin) return
    const newStops = stops.map((s, idx) => {
      const targetIdx = stops.findIndex((x) => x.id === stopId)
      if (idx < targetIdx) return { ...s, status: 'completed' }
      if (s.id === stopId) return { ...s, status: 'current' }
      return { ...s, status: 'upcoming' }
    })
    saveProcessionState(newStops, isLiveMode)
    const target = stops.find((s) => s.id === stopId)
    toast.success(`📍 Chariot location updated to: ${target?.title}`)
  }

  const handleToggleLive = () => {
    const next = !isLiveMode
    saveProcessionState(stops, next)
    toast.success(next ? '🚛 Live Shobha Yatra Tracking Activated!' : 'Procession tracking paused.')
  }

  const handleShareWhatsApp = () => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const msg = `🚛 *SHOBHA YATRA & NIMAJJANAM LIVE UPDATE* 🪔\n*${villageName} 2026*\n\n📍 *Current Location:* ${currentStop.title}\n📌 *Landmark:* ${currentStop.landmark}\n🕒 *Time:* ${currentStop.time}\n✨ *Status:* ${currentStop.note}${
      nextStop ? `\n\n⏳ *Next Destination:* ${nextStop.title} (${nextStop.landmark} · ETA: ${nextStop.time})` : ''
    }\n📊 *Route Progress:* ${progressPercent}% Completed\n\n🌐 *Track live route on portal:* ${portalUrl}\nGanapathi Bappa Morya! 🙏`

    openWhatsAppMessage('', msg)
    toast.success('WhatsApp opened with live procession route update!')
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🚛</span>
            <span>Shobha Yatra & Nimajjanam Route Tracker</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLiveMode ? (
              <span className="live-pulsing-badge" style={{ background: '#dc2626', color: '#fff', fontSize: '0.74rem', padding: '3px 8px', borderRadius: '999px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                LIVE PROCESSION
              </span>
            ) : (
              <span style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '0.74rem', padding: '3px 8px', borderRadius: '999px', fontWeight: '700' }}>
                SCHEDULED ROUTE
              </span>
            )}
            {admin && (
              <Button
                type="button"
                size="small"
                kind={isLiveMode ? 'secondary' : 'primary'}
                onClick={handleToggleLive}
              >
                {isLiveMode ? 'Pause Live Mode' : 'Go Live 🔴'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <p className="muted" style={{ marginTop: '-4px' }}>
        Track the live route, landmarks, and immersion timings of Lord Ganesha&apos;s grand chariot procession.
      </p>

      {/* Progress Bar */}
      <div style={{ margin: '14px 0 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: '#7c2414' }}>
          <span>Route Progression</span>
          <span>{progressPercent}% to Immersion Ghat</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#f3e8d7', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #d7952f, #dc2626)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Current Location Highlight Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #380604 0%, #68110b 100%)',
          color: '#fff',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '2px solid #d7952f',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fed7aa', fontWeight: '800' }}>
              📍 CURRENT CHARIOT LANDMARK
            </span>
            <h3 style={{ margin: '4px 0 2px', fontSize: '1.2rem', color: '#fff' }}>
              {currentStop.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#ffe5b4' }}>
              🏛️ <b>{currentStop.landmark}</b> · 🕒 Expected/Reached: <b>{currentStop.time}</b>
            </p>
            {currentStop.note && (
              <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#ffedd5', fontStyle: 'italic' }}>
                “{currentStop.note}”
              </p>
            )}
          </div>

          <Button
            type="button"
            kind="whatsapp-action"
            onClick={handleShareWhatsApp}
            title="Share live chariot location on WhatsApp"
          >
            <span>💬 Share Live Location</span>
          </Button>
        </div>
      </div>

      {/* Vertical Milestone Route Timeline */}
      <div className="procession-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        {stops.map((stop, idx) => {
          const isCurrent = stop.status === 'current'
          const isCompleted = stop.status === 'completed'

          return (
            <div
              key={stop.id}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: isCurrent ? '#fef2f2' : isCompleted ? '#f0fdf4' : '#fafaf9',
                border: isCurrent ? '2px solid #dc2626' : isCompleted ? '1px solid #bbf7d0' : '1px solid #e7e5e4',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Step indicator */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                  background: isCurrent ? '#dc2626' : isCompleted ? '#16a34a' : '#d6d3d1',
                  color: '#ffffff',
                  boxShadow: isCurrent ? '0 0 10px rgba(220, 38, 38, 0.5)' : 'none'
                }}
              >
                {isCompleted ? '✓' : isCurrent ? '📍' : idx + 1}
              </div>

              {/* Stop info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                  <strong style={{ fontSize: '0.96rem', color: isCurrent ? '#991b1b' : isCompleted ? '#166534' : '#292524' }}>
                    {stop.title}
                  </strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#78716c' }}>
                    🕒 {stop.time}
                  </span>
                </div>

                <div style={{ fontSize: '0.84rem', color: '#57534e', marginTop: '2px' }}>
                  🏛️ Landmark: <b>{stop.landmark}</b>
                </div>

                {stop.note && (
                  <div style={{ fontSize: '0.8rem', color: '#78716c', marginTop: '3px' }}>
                    📝 {stop.note}
                  </div>
                )}
              </div>

              {/* Admin quick check-in button */}
              {admin && !isCurrent && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    type="button"
                    size="small"
                    kind="secondary"
                    onClick={() => handleSetCurrent(stop.id)}
                    title="Set chariot location here"
                  >
                    📍 Set Current
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
