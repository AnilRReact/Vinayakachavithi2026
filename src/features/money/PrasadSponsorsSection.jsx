import React, { useState } from 'react'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { fmtDate, today } from '../../lib/formatters'
import { openDonationWhatsAppReceipt } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'

const PRASAD_PRESETS = [
  'Maha Laddu Prasadam',
  'Pulihora (Tamarind Rice)',
  'Chakra Pongali (Sweet Rice)',
  'Sundal / Boiled Chickpeas',
  'Kudumulu & Undrallu',
  'Special Annadanam (Lunch/Dinner)',
  'Fruits & Dry Fruits Basket',
  'Panchamrutham & Milk Seva'
]

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Add form states
  const [sponsorName, setSponsorName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(today())
  const [item, setItem] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const sponsorFields = [
    { name: 'sponsor_name', label: 'Sponsor Name / Family', required: true, placeholder: 'e.g. Srikanth & Family' },
    { name: 'phone', label: 'WhatsApp / Mobile Number', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Sponsorship Date', type: 'date', default: today(), required: true },
    { name: 'item', label: 'Prasad / Item Sponsored', required: true, placeholder: 'e.g. Morning Maha Prasadam (Pulihora), Fruits' },
    { name: 'note', label: 'Gotram / Dedication Note', placeholder: 'Optional dedication' }
  ]

  const handleOpenAdd = () => {
    setSponsorName('')
    setPhone('')
    setDate(today())
    setItem('')
    setNote('')
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanName = (sponsorName || '').trim()
    const cleanItem = (item || '').trim()

    if (!cleanName || !cleanItem) {
      toast.error('Please enter sponsor name and prasad item.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        sponsor_name: cleanName,
        phone: (phone || '').trim(),
        date: date || today(),
        item: cleanItem,
        note: (note || '').trim()
      }

      const err = await add('prasad_sponsors', payload)
      if (err) throw err

      toast.success(`🙏 Recorded Prasad sponsorship by ${cleanName}`)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not record prasad sponsor.')
    } finally {
      setIsSaving(false)
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
      villageName: settings.village_name || 'Sri Varasiddhi Vinayaka Utsava Samithi 2026'
    })
  }

  return (
    <>
      <Card
        title="Maha Prasadam & Seva Sponsors"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleOpenAdd}>
              ➕ Sponsor Prasadam
            </Button>
            <Button
              kind="secondary"
              onClick={() => onOpenExcelImport && onOpenExcelImport('prasad_sponsors')}
              title="Upload Excel or CSV file to extract and import prasad sponsors"
            >
              📊 Bulk Excel Import
            </Button>
          </div>
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

                <RecordActions
                  record={sp}
                  fields={sponsorFields}
                  onSave={(values) => update('prasad_sponsors', sp.id, values)}
                  onDelete={() => remove('prasad_sponsors', sp.id)}
                  deleteTitle="Delete Prasad Sponsor"
                  deleteMessage={`Delete sponsorship by ${sp.sponsor_name}?`}
                />
              </div>
            </article>
          ))}
        </div>

        {!prasadSponsors.length && (
          <Empty text="No Maha Prasadam sponsors recorded yet. Click 'Sponsor Prasadam' above." />
        )}
      </Card>

      {/* Add Prasad Sponsor Modal */}
      {isAddModalOpen && (
        <Modal
          title="Record Maha Prasadam Sponsor"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label>Sponsor Name / Devotee Family *</label>
              <input
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. Srikanth & Family"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Prasadam / Food Item Sponsored *</label>
              <input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Maha Laddu, Pulihora, Fruits"
                required
              />
              <div className="role-preset-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {PRASAD_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="role-chip"
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #fde68a',
                      background: item === p ? '#fef08a' : '#fffbeb',
                      cursor: 'pointer',
                      fontWeight: item === p ? '700' : '500'
                    }}
                    onClick={() => setItem(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Mobile / WhatsApp</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label>Date of Seva</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gotram / Special Notes (Optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Kashyapa Gotram, In Memory of Grandfather"
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Recording…' : 'Record Sponsorship'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
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
