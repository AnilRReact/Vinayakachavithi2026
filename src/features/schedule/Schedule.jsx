import { useMemo } from 'react'
import { Card, Form } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { fmtDate, escapeIcs, activityClass, today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Schedule({ data, admin, add, update, remove }) {
  const { toast } = useToast()
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

  const stamp = (date, time) => {
    return `${date.replaceAll('-', '')}T${(time || '00:00').replace(':', '')}00`
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

  return (
    <>
      <Card title="Pandal Schedule & Daily Timings">
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
                        <a
                          href={googleLink(activity)}
                          target="_blank"
                          rel="noreferrer"
                          className="calendar-btn google"
                          title="Add to Google Calendar"
                        >
                          📅 Add to Google Calendar
                        </a>
                        <button
                          type="button"
                          className="calendar-btn ics"
                          onClick={() => downloadIcs(activity)}
                          title="Download .ics with 30-min alarm for Apple / Outlook"
                        >
                          📥 Download .ics (30m reminder)
                        </button>
                      </div>

                      {admin && (
                        <RecordActions
                          record={activity}
                          fields={activityFields}
                          onSave={(values) => update('activities', activity.id, values)}
                          onDelete={() => remove('activities', activity.id)}
                          deleteTitle="Remove Activity"
                          deleteMessage={`Are you sure you want to remove "${activity.title}"?`}
                        />
                      )}
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

      {admin && (
        <Card title="Add Event / Activity">
          <Form
            submit="Add to Schedule"
            onSubmit={(v) => add('activities', v)}
            fields={activityFields}
          />
        </Card>
      )}
    </>
  )
}
