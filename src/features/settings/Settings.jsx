import { useState } from 'react'
import { Card, Form, Button } from '../../components/ui'
import { requireSupabase } from '../../lib/supabase'
import { today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Settings({ data, add, update }) {
  const { toast } = useToast()
  const settings = data.settings?.[0] || {}

  const saveFestivalSettings = async (values) => {
    try {
      const err = settings.id
        ? await update('settings', settings.id, values)
        : await add('settings', values)
      if (err) {
        toast.error(err.message || 'Failed to save settings.')
      } else {
        toast.success('Festival settings updated.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.')
    }
  }

  const settingsFields = [
    { name: 'village_name', label: 'Village / Colony Name', default: settings.village_name || 'Vinayaka Vedika', required: true },
    { name: 'tagline', label: 'Festival Tagline', default: settings.tagline || 'Our village celebration, in one place.' },
    { name: 'festival_date', label: 'Festival Date (Vinayaka Chavithi)', type: 'date', default: settings.festival_date || today() },
    { name: 'upi_id', label: 'UPI Payment ID (for QR donations)', default: settings.upi_id || '' },
    { name: 'morning_aarti_time', label: 'Morning Aarti Time', type: 'time', default: settings.morning_aarti_time || '' },
    { name: 'evening_aarti_time', label: 'Evening Aarti Time', type: 'time', default: settings.evening_aarti_time || '' },
    { name: 'daily_schedule_note', label: 'Daily Schedule Note / Special Rules', default: settings.daily_schedule_note || '' },
    { name: 'em_doctor_name', label: 'Emergency Doctor Name', default: settings.em_doctor_name || '' },
    { name: 'em_doctor_phone', label: 'Emergency Doctor Phone', type: 'tel', default: settings.em_doctor_phone || '' },
    { name: 'em_police_phone', label: 'Police Station / Patrol Phone', type: 'tel', default: settings.em_police_phone || '' },
    { name: 'em_coord_name', label: 'Key Coordinator Name', default: settings.em_coord_name || '' },
    { name: 'em_coord_phone', label: 'Key Coordinator Phone', type: 'tel', default: settings.em_coord_phone || '' }
  ]

  return (
    <>
      <Card title="Committee & Festival Settings">
        <p className="muted">
          Update the village name, aarti timings, UPI payment details, and emergency contacts.
        </p>
        <Form
          submit="Save Festival Settings"
          onSubmit={saveFestivalSettings}
          fields={settingsFields}
        />
      </Card>

      <PasscodeSettings />
      <BackupButton data={data} />
    </>
  )
}

function PasscodeSettings() {
  const { toast } = useToast()
  const [passcode, setPasscode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSavePasscode = async (e) => {
    e.preventDefault()
    if (!passcode || passcode.trim().length < 6) {
      toast.error('Passcode must be at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      const client = requireSupabase()
      const { error } = await client.rpc('set_admin_passcode', {
        new_passcode: passcode.trim()
      })
      if (error) throw error
      toast.success('Admin passcode updated successfully!')
      setPasscode('')
    } catch (err) {
      toast.error(err.message || 'Could not update admin passcode.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Change Admin Passcode">
      <p className="muted">
        Change the shared passcode used to unlock committee editing. Must be at least 6 characters.
      </p>
      <form className="form" onSubmit={handleSavePasscode}>
        <label>
          <span>New Admin Passcode</span>
          <div className="password-input-wrap">
            <input
              required
              minLength={6}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new 6+ char passcode"
              value={passcode}
              disabled={busy}
              onChange={(e) => setPasscode(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        </label>

        <div className="form-actions">
          <Button type="submit" disabled={busy || !passcode.trim()}>
            {busy ? 'Updating…' : 'Update Passcode'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function BackupButton({ data }) {
  const { toast } = useToast()

  const handleDownload = () => {
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exported_at: new Date().toISOString(),
              festival_data: data
            },
            null,
            2
          )
        ],
        { type: 'application/json' }
      )
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `vinayaka-vedika-backup-${today()}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('JSON backup downloaded.')
    } catch {
      toast.error('Failed to create backup.')
    }
  }

  return (
    <Card title="Data Backup & Archival">
      <p className="muted">
        Download a complete, offline JSON copy of all committee records, donations, expenses, auction bids, and schedules for the village archive.
      </p>
      <Button kind="secondary" onClick={handleDownload}>
        📥 Download JSON Backup
      </Button>
    </Card>
  )
}

