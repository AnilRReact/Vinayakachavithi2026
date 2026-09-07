import { useMemo, useState } from 'react'
import { Card, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { ProcessionTracker } from './ProcessionTracker'
import { fmtDate, escapeIcs, activityClass, today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Schedule({ data, admin, add, update, remove }) {
  const { toast } = useToast()
  const [selectedActivityForCard, setSelectedActivityForCard] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [startTime, setStartTime] = useState('07:30')
  const [endTime, setEndTime] = useState('09:30')
  const [location, setLocation] = useState('Main Village Pandal Stage')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const settings = data.settings?.[0] || {}
  const activities = data.activities || []

  const activityFields = [
    { name: 'title', label: 'Activity / Event Name', required: true, placeholder: 'e.g. Maha Ganapathi Pooja, Cultural Night' },
    { name: 'date', label: 'Event Date', type: 'date', default: today(), required: true },
    { name: 'start_time', label: 'Start Time (IST)', type: 'time' },
    { name: 'end_time', label: 'End Time (IST)', type: 'time' },
    { name: 'location', label: 'Location / Venue', placeholder: 'e.g. Main Pandal Stage' },
    { name: 'description', label: 'Description & Details', type: 'textarea', placeholder: 'Special pooja rituals, chief guests, instructions...' }
  ]

  const groups = ['Live today', 'Upcoming', 'Past']

  const groupedActivities = useMemo(() => {
    return groups.map((group) => {
      const items = activities
        .filter((item) => activityClass(item) === group)
        .sort((a, b) =>
          group === 'Past'
            ? b.date.localeCompare(a.date)
            : a.date.localeCompare(b.date)
        )
      return { group, items }
    })
  }, [activities])

  const stamp = (d, t) => {
    return `${d.replaceAll('-', '')}T${(t || '00:00').replace(':', '')}00`
  }

  const googleLink = (a) => {
    const start = stamp(a.date, a.start_time || '09:00')
    const end = stamp(a.date, a.end_time || a.start_time || '10:00')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      a.title
    )}&dates=${start}/${end}&ctz=Asia%2FKolkata&location=${encodeURIComponent(
      a.location || ''
    )}&details=${encodeURIComponent(a.description || '')}`
  }

  const downloadIcs = (a) => {
    try {
      const start = stamp(a.date, a.start_time || '09:00')
      const end = stamp(a.date, a.end_time || a.start_time || '10:00')
      const body = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Vinayaka Vedika//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@vinayaka-vedika`,
        `DTSTAMP:${stamp(today(), '00:00')}Z`,
        `DTSTART;TZID=Asia/Kolkata:${start}`,
        `DTEND;TZID=Asia/Kolkata:${end}`,
        `SUMMARY:${escapeIcs(a.title)}`,
        `LOCATION:${escapeIcs(a.location)}`,
        `DESCRIPTION:${escapeIcs(a.description)}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Festival reminder (30 mins before)',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n')

      const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${a.title.toLowerCase().replace(/[^a-z0-9]/gi, '-')}.ics`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Calendar event (.ics) with 30-min reminder downloaded.')
    } catch {
      toast.error('Failed to download calendar reminder.')
    }
  }

  const handleOpenAdd = () => {
    setTitle('')
    setDate(today())
    setStartTime('07:30')
    setEndTime('09:30')
    setLocation('Main Village Pandal Stage')
    setDescription('')
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanTitle = (title || '').trim()

    if (!cleanTitle) {
      toast.error('Please enter the event / pooja name.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: cleanTitle,
        date: date || today(),
        start_time: startTime || '07:30',
        end_time: endTime || '09:30',
        location: (location || '').trim(),
        description: (description || '').trim()
      }

      const err = await add('activities', payload)
      if (err) throw err

      toast.success(`Added "${cleanTitle}" to festival schedule!`)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not add event to schedule.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Shobha Yatra & Nimajjanam Route Tracker */}
      <ProcessionTracker
        settings={settings}
        admin={admin}
        onUpdateSettings={(v) => settings.id && update('settings', settings.id, v)}
      />

      <Card
        title="Pandal Schedule & Daily Timings"
        action={
          <Button onClick={handleOpenAdd}>
            ➕ Add Event / Pooja
          </Button>
        }
      >
        {settings.daily_schedule_note ? (
          <div className="schedule-pandal-note">
            <b>Daily Schedule & Pandal Instructions:</b>
            <p>{settings.daily_schedule_note}</p>
          </div>
        ) : (
          <p className="muted">
            All morning poojas, evening bhajans, laddu auctions, and procession timings.
          </p>
        )}

        <div className="activities-container">
          {groupedActivities.map(({ group, items }) => (
            <div className={`activity-group ${group.toLowerCase().replace(' ', '-')}`} key={group}>
              <h3>
                {group === 'Live today' ? '🔴 Live today' : group}{' '}
                <small>({items.length})</small>
              </h3>

              <div className="activity-list">
                {items.map((activity) => (
                  <article className="activity-card" key={activity.id}>
                    <div className="activity-header">
                      <div className="activity-title-row">
                        <h4>{activity.title}</h4>
                        <span className={`status-pill ${activityClass(activity).toLowerCase().replace(' ', '-')}`}>
                          {activityClass(activity)}
                        </span>
                      </div>
                      <p className="activity-meta">
                        📅 <b>{fmtDate(activity.date)}</b>
                        {activity.start_time && (
                          <span> · ⏰ {activity.start_time}{activity.end_time ? ` to ${activity.end_time}` : ''} (IST)</span>
                        )}
                        {activity.location && <span> · 📍 {activity.location}</span>}
                      </p>
                    </div>

                    {activity.description && (
                      <p className="activity-desc">{activity.description}</p>
                    )}

                    <div className="activity-footer">
                      <div className="calendar-actions">
                        <Button
                          type="button"
                          kind="receipt-action"
                          size="small"
                          onClick={() => setSelectedActivityForCard(activity)}
                          title="View, download, or share Pooja/Event Invitation Card on Ganesha template"
                        >
                          <span className="action-icon">📜</span>
                          <span className="action-label">Invitation Card</span>
                        </Button>

                        <a
                          href={googleLink(activity)}
                          target="_blank"
                          rel="noreferrer"
                          className="calendar-btn google"
                          title="Add to Google Calendar"
                        >
                          📅 Google Calendar
                        </a>
                        <button
                          type="button"
                          className="calendar-btn ics"
                          onClick={() => downloadIcs(activity)}
                          title="Download .ics with 30-min alarm for Apple / Outlook"
                        >
                          📥 .ics (30m alarm)
                        </button>
                      </div>

                      <RecordActions
                        record={activity}
                        fields={activityFields}
                        onSave={(values) => update('activities', activity.id, values)}
                        onDelete={() => remove('activities', activity.id)}
                        deleteTitle="Remove Activity"
                        deleteMessage={`Are you sure you want to remove "${activity.title}"?`}
                      />
                    </div>
                  </article>
                ))}

                {!items.length && (
                  <p className="empty-group-text">No {group.toLowerCase()} activities scheduled.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <Modal
          title="Add Pooja / Festival Event"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label>Pooja / Event Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sri Maha Ganapathi Homam & Abhishekham"
                autoFocus
                required
              />
            </div>

            <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location / Venue</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main Village Pandal Stage"
              />
            </div>

            <div className="form-group">
              <label>Description & Ritual Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Special kumkuma archana, prasadam distribution, chief guest arrival..."
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Adding…' : 'Add to Schedule'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Universal Pooja & Event Invitation Card Modal */}
      {selectedActivityForCard && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedActivityForCard)}
          onClose={() => setSelectedActivityForCard(null)}
          activity={selectedActivityForCard}
          type="activity"
          settings={settings}
          admin={admin}
        />
      )}
    </>
  )
}
