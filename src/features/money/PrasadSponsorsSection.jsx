import React, { useState } from 'react'
import { Card, Empty, Form, Button } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { fmtDate, today } from '../../lib/formatters'
import { openDonationWhatsAppReceipt } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'

export function PrasadSponsorsSection({
  prasadSponsors = [],
  settings = {},
  admin = false,
  add,
  update,
  remove,
  onOpenExcelImport
}) {
  const { toast } = useToast()
  const [selectedSponsor, setSelectedSponsor] = useState(null)

  const sponsorFields = [
    { name: 'sponsor_name', label: 'Sponsor Name / Family', required: true, placeholder: 'e.g. Srikanth & Family' },
    { name: 'phone', label: 'WhatsApp / Mobile Number', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Sponsorship Date', type: 'date', default: today(), required: true },
    { name: 'item', label: 'Prasad / Item Sponsored', required: true, placeholder: 'e.g. Morning Maha Prasadam (Pulihora), Fruits' },
    { name: 'note', label: 'Gotram / Dedication Note', placeholder: 'Optional dedication' }
  ]

  const handleAddSponsor = async (values) => {
    const err = await add('prasad_sponsors', values)
    if (err) {
      toast.error(err.message || 'Could not record prasad sponsor.')
    } else {
      toast.success(`🙏 Recorded Prasad sponsorship by ${values.sponsor_name}`)
    }
  }

  const handleWhatsApp = (sp) => {
    openDonationWhatsAppReceipt({
      donor: { name: sp.sponsor_name, phone: sp.phone },
      amount: 'Prasad Seva',
      receiptNo: sp.id,
      paymentMode: 'Maha Prasadam Sponsorship',
      gotram: sp.note,
      date: fmtDate(sp.date),
      villageName: settings.festival_title || 'శ్రీ వరసిద్ధి వినాయక ఉత్సవ సమితి 2026'
    })
  }

  return (
    <>
      <Card
        title="Maha Prasadam & Seva Sponsors"
        action={
          admin && (
            <Button
              kind="secondary"
              onClick={() => onOpenExcelImport('prasad_sponsors')}
              title="Upload Excel or CSV file to extract and import prasad sponsors"
            >
              📊 Bulk Excel Import
            </Button>
          )
        }
      >
        <div className="records-list">
          {prasadSponsors.map((sp) => (
            <article className="record-item" key={sp.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{sp.sponsor_name}</b>
                  <span className="badge badge-prasad">🍯 {sp.item}</span>
                </div>
                <small className="record-meta">
                  📅 {fmtDate(sp.date)}
                  {sp.phone && ` · 📞 ${sp.phone}`}
                  {sp.note && ` · 📝 ${sp.note}`}
                </small>
              </div>

              <div className="record-actions-cell">
                <button
                  type="button"
                  className="btn-wa-receipt"
                  onClick={() => handleWhatsApp(sp)}
                  title="Send WhatsApp acknowledgment to sponsor"
                >
                  📲 <span>WhatsApp</span>
                </button>

                <Button
                  type="button"
                  kind="receipt-action"
                  onClick={() => setSelectedSponsor(sp)}
                  title="View & download Prasad Sponsor Blessing Card"
                >
                  <span className="action-icon">📜</span>
                  <span className="action-label">Blessing Card</span>
                </Button>

                {admin && (
                  <RecordActions
                    record={sp}
                    fields={sponsorFields}
                    onSave={(values) => update('prasad_sponsors', sp.id, values)}
                    onDelete={() => remove('prasad_sponsors', sp.id)}
                    deleteTitle="Delete Prasad Sponsor"
                    deleteMessage={`Delete sponsorship by ${sp.sponsor_name}?`}
                  />
                )}
              </div>
            </article>
          ))}
        </div>

        {!prasadSponsors.length && (
          <Empty text="No Maha Prasadam sponsors recorded yet." />
        )}
      </Card>

      {admin && (
        <Card title="Record Prasad Sponsorship">
          <Form
            fields={sponsorFields}
            onSubmit={handleAddSponsor}
            submitLabel="Record Sponsor"
          />
        </Card>
      )}

      {selectedSponsor && (
        <ReceiptTemplateModal
          donation={{
            id: selectedSponsor.id,
            donor_name: selectedSponsor.sponsor_name,
            amount: 'Prasadam Seva',
            date: selectedSponsor.date,
            note: `${selectedSponsor.item}${selectedSponsor.note ? ` · ${selectedSponsor.note}` : ''}`
          }}
          settings={settings}
          onClose={() => setSelectedSponsor(null)}
        />
      )}
    </>
  )
}

