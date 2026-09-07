import React, { useState } from 'react'
import { Card, Empty, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { IdCardModal } from '../../components/IdCardModal'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { fmtDate, today } from '../../lib/formatters'
import { openVolunteerDutyWhatsApp } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'

const DUTY_PRESETS = [
  'Prasadam Distribution',
  'Pandal & Stage Setup',
  'Queue & Darshan Management',
  'Aarti & Pooja Assistance',
  'Sound & Lighting In-Charge',
  'Water & Refreshment Seva',
  'Nimajjanam & Procession Lead',
  'Security & Parking'
]

export function VolunteerManager({
  volunteers = [],
  settings = {},
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()
  const villageName = settings.festival_title || settings.village_name || 'Vinayaka Vedika 2026'

  const [selectedVolunteerForId, setSelectedVolunteerForId] = useState(null)
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Add form states
  const [name, setName] = useState('')
  const [duty, setDuty] = useState('')
  const [contact, setContact] = useState('')
  const [date, setDate] = useState(today())
  const [shiftTime, setShiftTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const volunteerFields = [
    { name: 'name', label: 'Volunteer Name', required: true, placeholder: 'e.g. Shiva Reddy' },
    { name: 'duty', label: 'Assigned Duty', required: true, placeholder: 'e.g. Prasadam Distribution, Stage Management' },
    { name: 'contact', label: 'Mobile / WhatsApp Number', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Service Date', type: 'date', default: today(), required: true },
    { name: 'shift_time', label: 'Shift Time', placeholder: 'e.g. 06:00 PM – 10:00 PM' }
  ]

  const handleOpenAdd = () => {
    setName('')
    setDuty('')
    setContact('')
    setDate(today())
    setShiftTime('')
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanName = (name || '').trim()
    const cleanDuty = (duty || '').trim()
    const cleanContact = (contact || '').trim()

    if (!cleanName || !cleanDuty) {
      toast.error('Please enter volunteer name and assigned duty.')
      return
    }

    setIsSaving(true)
    try {
      const err = await add('volunteers', {
        name: cleanName,
        duty: cleanDuty,
        contact: cleanContact,
        date: date || today(),
        shift_time: (shiftTime || '').trim()
      })

      if (err) throw err

      toast.success(`Registered volunteer ${cleanName} for ${cleanDuty}`)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not register volunteer.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendDutyWhatsApp = (vol) => {
    openVolunteerDutyWhatsApp({
      name: vol.name,
      phone: vol.contact,
      duty: vol.duty,
      shiftTime: vol.shift_time,
      date: fmtDate(vol.date),
      villageName
    })
  }

  return (
    <>
      <Card
        title="Volunteer Shifts & Seva Rosters"
        action={
          <Button onClick={handleOpenAdd}>
            ➕ Assign Volunteer
          </Button>
        }
      >
        <div className="records-list">
          {volunteers.map((vol) => (
            <article className="record-item" key={vol.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{vol.name}</b>
                  <span className="badge badge-volunteer">🤝 {vol.duty}</span>
                </div>
                <small className="record-meta">
                  📅 {fmtDate(vol.date)}
                  {vol.shift_time && ` · ⏰ ${vol.shift_time}`}
                  {vol.contact && ` · 📞 ${vol.contact}`}
                </small>
              </div>

              <div className="record-actions-cell">
                {/* 1-Click WhatsApp Duty Alert */}
                <button
                  type="button"
                  className="btn-wa-receipt"
                  onClick={() => handleSendDutyWhatsApp(vol)}
                  title="Send 1-Click WhatsApp duty reminder to volunteer"
                >
                  <span className="action-icon">📲</span>
                  <span className="action-label">WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="btn-formal-receipt"
                  onClick={() =>
                    setSelectedVolunteerForId({
                      name: vol.name,
                      role: `Volunteer - ${vol.duty}`,
                      phone: vol.contact
                    })
                  }
                  title="Generate Volunteer ID Card"
                >
                  <span className="action-icon">🪪</span>
                  <span className="action-label">ID Card</span>
                </button>

                <Button
                  type="button"
                  kind="receipt-action"
                  onClick={() =>
                    setSelectedTemplateItem({
                      id: vol.id,
                      name: vol.name,
                      role: `Sevak - ${vol.duty}`
                    })
                  }
                  title="Generate Volunteer Certificate"
                >
                  <span className="action-icon">📜</span>
                  <span className="action-label">Certificate</span>
                </Button>

                <RecordActions
                  record={vol}
                  fields={volunteerFields}
                  onSave={(values) => update('volunteers', vol.id, values)}
                  onDelete={() => remove('volunteers', vol.id)}
                  deleteTitle="Remove Volunteer"
                  deleteMessage={`Remove ${vol.name} from volunteer list?`}
                />
              </div>
            </article>
          ))}
        </div>

        {!volunteers.length && (
          <Empty text="No volunteers assigned yet. Click 'Assign Volunteer' above to register seva team." />
        )}
      </Card>

      {/* Add Volunteer Modal */}
      {isAddModalOpen && (
        <Modal
          title="Assign Volunteer Seva Duty"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>👤 Volunteer Full Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shiva Reddy"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>🪔 Assigned Seva Duty</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={duty}
                onChange={(e) => setDuty(e.target.value)}
                placeholder="e.g. Prasadam Distribution"
                required
              />
              <div className="role-preset-chips">
                {DUTY_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`role-chip ${duty === d ? 'selected' : ''}`}
                    onClick={() => setDuty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>📱 Mobile / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>📅 Service Date</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>⏰ Shift Timing (Optional)</span>
              </label>
              <input
                value={shiftTime}
                onChange={(e) => setShiftTime(e.target.value)}
                placeholder="e.g. 06:00 PM – 10:00 PM"
              />
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Assigning…' : 'Assign Duty'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ID Card Modal */}
      {selectedVolunteerForId && (
        <IdCardModal
          member={selectedVolunteerForId}
          settings={settings}
          onClose={() => setSelectedVolunteerForId(null)}
        />
      )}

      {/* Certificate Modal */}
      {selectedTemplateItem && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedTemplateItem)}
          onClose={() => setSelectedTemplateItem(null)}
          record={selectedTemplateItem}
          type="volunteer"
          settings={settings}
          admin={admin}
        />
      )}
    </>
  )
}
