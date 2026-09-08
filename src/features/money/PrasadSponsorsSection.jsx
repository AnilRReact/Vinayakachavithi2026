import React, { useState } from 'react'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { fmtDate, today } from '../../lib/formatters'
import { openDonationWhatsAppReceipt } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'

const PRASAD_PRESETS = [
  'Maha Annadanam (అన్నదానం)',
  '108 Modaks & Dry Fruit Laddu',
  'Pulihora (Tamarind Rice)',
  'Chakra Pongali (Sweet Rice)',
  'Sundal / Boiled Chickpeas',
  'Kudumulu & Undrallu',
  'Fruits & Dry Fruits Basket',
  'Panchamrutham & Milk Seva'
]

export function PrasadSponsorsSection({
  prasadSponsors = [],
  settings = {},
  admin = false,
  authorized = false,
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
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(today())
  const [item, setItem] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const sponsorFields = [
    { name: 'sponsor_name', label: 'Sponsor Name / Family', required: true, placeholder: 'e.g. Srikanth & Family' },
    { name: 'amount', label: 'Sponsorship Amount (₹ - Optional)', type: 'number', placeholder: 'e.g. 5000' },
    { name: 'phone', label: 'WhatsApp / Mobile Number', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Sponsorship Date', type: 'date', default: today(), required: true },
    { name: 'item', label: 'Prasad / Item Sponsored', required: true, placeholder: 'e.g. Maha Annadanam, Fruits' },
    { name: 'note', label: 'Gotram / Dedication Note', placeholder: 'Optional dedication' }
  ]

  const handleOpenAdd = () => {
    setSponsorName('')
    setAmount('')
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
    const numAmount = Number(amount) || 0

    if (!cleanName || !cleanItem) {
      toast.error('Please enter sponsor name and prasad item.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        sponsor_name: cleanName,
        amount: numAmount,
        phone: (phone || '').trim(),
        date: date || today(),
        item: cleanItem,
        note: (note || '').trim()
      }

      const err = await add('prasad_sponsors', payload)
      if (err) throw err

      // If an amount was provided, also automatically save into donations so it counts in collections!
      if (numAmount > 0) {
        try {
          await add('donations', {
            donor_name: cleanName,
            amount: numAmount,
            phone: (phone || '').trim(),
            date: date || today(),
            note: note ? `Prasadam Sponsor (${cleanItem}): ${note}` : `Prasadam Sponsor (${cleanItem})`,
            payment_mode: 'Cash / UPI',
            is_prasad_sponsor: true,
            prasad_item: cleanItem
          })
        } catch {}
      }

      toast.success(
        numAmount > 0
          ? `🙏 Recorded ₹${numAmount.toLocaleString()} Prasad sponsorship by ${cleanName} (Added to Collections)!`
          : `🙏 Recorded Prasad sponsorship by ${cleanName}`
      )
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
      amount: sp.amount ? `₹ ${Number(sp.amount).toLocaleString()} (${sp.item})` : sp.item,
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
        title="Maha Prasadam & Seva Sponsors (ప్రసాద దాతలు)"
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button onClick={handleOpenAdd}>
              ➕ Sponsor Prasadam
            </Button>
            {(admin || authorized) && (
              <Button
                kind="secondary"
                onClick={() => onOpenExcelImport && onOpenExcelImport('prasad_sponsors')}
                title="Upload Excel or CSV file to extract and import prasad sponsors"
              >
                📊 Bulk Excel Import
              </Button>
            )}
          </div>
        }
      >
        <div className="records-list">
          {prasadSponsors.map((sp) => (
            <article className="record-item sponsor-record-item" key={sp.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{sp.sponsor_name}</b>
                  <span className="badge badge-prasad">🍯 {sp.item}</span>
                  {Number(sp.amount || 0) > 0 && (
                    <strong className="record-amount prasad-amount">
                      ₹ {Number(sp.amount).toLocaleString()}
                    </strong>
                  )}
                </div>
                <small className="record-meta">
                  📅 {fmtDate(sp.date)}
                  {(admin || authorized) ? (
                    <>
                      {sp.phone && ` · 📞 ${sp.phone}`}
                      {sp.note && ` · 📝 ${sp.note}`}
                    </>
                  ) : (
                    <span className="lock-protected-note"> · 🔒 Contact Protected</span>
                  )}
                </small>
              </div>

              <div className="record-actions-cell">
                {(admin || authorized) ? (
                  <>
                    <button
                      type="button"
                      className="btn-wa-receipt"
                      onClick={() => handleWhatsApp(sp)}
                      title="Send WhatsApp receipt to sponsor"
                    >
                      <span className="action-icon">📲</span>
                      <span className="action-label">WhatsApp</span>
                    </button>

                    <Button
                      type="button"
                      kind="receipt-action"
                      onClick={() =>
                        setSelectedSponsor({
                          donor_name: sp.sponsor_name,
                          amount: sp.amount ? `₹ ${Number(sp.amount).toLocaleString()}` : sp.item,
                          note: sp.note || `Prasadam Seva: ${sp.item}`,
                          date: sp.date,
                          phone: sp.phone
                        })
                      }
                      title="View auspicious sponsor blessing card"
                    >
                      <span className="action-icon">🎨</span>
                      <span className="action-label">Card</span>
                    </Button>

                    {admin && (
                      <RecordActions
                        record={sp}
                        fields={sponsorFields}
                        onSave={(values) =>
                          update('prasad_sponsors', sp.id, {
                            ...values,
                            amount: Number(values.amount || 0)
                          })
                        }
                        onDelete={() => remove('prasad_sponsors', sp.id)}
                        deleteTitle="Delete Prasadam Sponsor"
                        deleteMessage={`Delete sponsorship by ${sp.sponsor_name}?`}
                      />
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    kind="receipt-action"
                    onClick={() =>
                      setSelectedSponsor({
                        donor_name: sp.sponsor_name,
                        amount: sp.amount ? `₹ ${Number(sp.amount).toLocaleString()}` : sp.item,
                        note: sp.note || `Prasadam Seva: ${sp.item}`,
                        date: sp.date
                      })
                    }
                    title="View auspicious sponsor blessing card"
                  >
                    <span className="action-icon">🎨</span>
                    <span className="action-label">Blessing Card</span>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>

        {!prasadSponsors.length && (
          <Empty text="No prasadam sponsors recorded yet. Click 'Sponsor Prasadam' above." />
        )}
      </Card>

      {/* Add Prasadam Sponsor Modal */}
      {isAddModalOpen && (
        <Modal
          title="Sponsor Maha Prasadam / Annadanam"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>👤 Devotee / Sponsor Family Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                required
                placeholder="e.g. Srikanth & Family"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>🍯 Prasadam / Food Item Sponsored</span>
                <span className="req-star">*</span>
              </label>
              <input
                required
                placeholder="e.g. Maha Annadanam, 108 Modaks, Pulihora"
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
              <div className="role-preset-chips">
                {PRASAD_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`role-chip ${item === preset ? 'selected' : ''}`}
                    onClick={() => setItem(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>💰 Sponsorship Contribution Amount (₹ - Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5000 (auto-adds to total collections)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="numeric"
                />
                {Number(amount) > 0 && (
                  <small style={{ color: '#15803d', fontWeight: '600' }}>
                    ✓ This ₹{Number(amount).toLocaleString()} will be automatically added to Total Collections!
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>📱 Mobile / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>📅 Seva Date</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>🪔 Gotram / Dedication Note</span>
                </label>
                <input
                  placeholder="e.g. Kashyapa Gotram / Family Seva"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Recording…' : 'Record Sponsorship'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Blessing Card Modal */}
      {selectedSponsor && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedSponsor)}
          onClose={() => setSelectedSponsor(null)}
          donation={selectedSponsor}
          settings={settings}
          admin={admin}
        />
      )}
    </>
  )
}
