import React, { useState } from 'react'
import { Card, Empty, Form, Button } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { IdCardModal } from '../../components/IdCardModal'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { fmtDate, today } from '../../lib/formatters'
import { openVolunteerDutyWhatsApp } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'

export function VolunteerManager({
  volunteers = [],
  settings = {},
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()
  const villageName = settings.festival_title || settings.village_name || 'శ్రీ వినాయక ఉత్సవ సమితి 2026'

  const [selectedVolunteerForId, setSelectedVolunteerForId] = useState(null)
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null)

  const volunteerFields = [
    { name: 'name', label: 'Volunteer Name (వాలంటీర్ పేరు)', required: true, placeholder: 'e.g. Shiva Reddy' },
    { name: 'duty', label: 'Assigned Duty (సేవా బాధ్యత)', required: true, placeholder: 'e.g. Prasadam Distribution, Stage Management' },
    { name: 'contact', label: 'Mobile / WhatsApp No (ఫోన్ నం)', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Service Date (తేదీ)', type: 'date', default: today(), required: true },
    { name: 'shift_time', label: 'Shift Time (సమయం)', placeholder: 'e.g. 06:00 PM – 10:00 PM' }
  ]

  const handleAddVolunteer = async (values) => {
    const err = await add('volunteers', values)
    if (err) {
      toast.error(err.message || 'Could not register volunteer.')
    } else {
      toast.success(`Registered volunteer ${values.name} for ${values.duty}`)
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
      <Card title="Volunteer Shifts & Seva Rosters">
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
                  📲 <span>Duty Alert</span>
                </button>

                <button
                  type="button"
                  className="committee-action-btn id"
                  onClick={() =>
                    setSelectedVolunteerForId({
                      name: vol.name,
                      role: `Volunteer - ${vol.duty}`,
                      phone: vol.contact
                    })
                  }
                  title="Generate Volunteer ID Card"
                >
                  🪪 ID Card
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

                {admin && (
                  <RecordActions
                    record={vol}
                    fields={volunteerFields}
                    onSave={(values) => update('volunteers', vol.id, values)}
                    onDelete={() => remove('volunteers', vol.id)}
                    deleteTitle="Remove Volunteer"
                    deleteMessage={`Remove ${vol.name} from volunteer list?`}
                  />
                )}
              </div>
            </article>
          ))}
        </div>

        {!volunteers.length && (
          <Empty text="No volunteers assigned yet. Add volunteers below." />
        )}
      </Card>

      {admin && (
        <Card title="Assign Volunteer Duty (వాలంటీర్ నియామకం)">
          <Form
            fields={volunteerFields}
            onSubmit={handleAddVolunteer}
            submitLabel="Assign Volunteer (సేవకుడిని కేటాయించండి)"
          />
        </Card>
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
