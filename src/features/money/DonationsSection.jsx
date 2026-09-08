import React, { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { OfficialReceiptModal } from '../../components/OfficialReceiptModal'
import { currency, fmtDate, tier, today } from '../../lib/formatters'
import { openDonationWhatsAppReceipt } from '../../lib/whatsapp'
import { syncNewDonation } from '../../lib/googleSheetsSync'
import { useToast } from '../../context/ToastContext'

const QUICK_AMOUNTS = [501, 1116, 2116, 5116, 10001, 25000]

export function DonationsSection({
  donations = [],
  settings = {},
  admin = false,
  authorized = false,
  add,
  update,
  remove,
  onOpenExcelImport
}) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')
  const [filterTier, setFilterTier] = useState('ALL')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [cardDonation, setCardDonation] = useState(null)
  const [officialReceiptDonation, setOfficialReceiptDonation] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Add donation form state
  const [donorName, setDonorName] = useState('')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [pinned, setPinned] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Top contributions
  const topDonations = useMemo(() => {
    return [...donations]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 3)
  }, [donations])

  // Filter & sort logic
  const filteredDonations = useMemo(() => {
    let list = donations.filter((d) => {
      const matchSearch =
        (d.donor_name || d.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.note || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.phone || '').includes(search)
      if (!matchSearch) return false

      if (filterTier === 'VIP') return Number(d.amount || 0) >= 5000
      if (filterTier === 'PATRON') return Number(d.amount || 0) >= 2000 && Number(d.amount || 0) < 5000
      if (filterTier === 'SUPPORTER') return Number(d.amount || 0) < 2000
      return true
    })

    return list.sort((a, b) => {
      if (sort !== 'amount' && a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return sort === 'amount'
        ? Number(b.amount || 0) - Number(a.amount || 0)
        : String(b.date).localeCompare(String(a.date))
    })
  }, [donations, search, sort, filterTier])

  // Generate UPI QR Code
  useEffect(() => {
    if (settings.upi_id) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(
        settings.upi_id
      )}&pn=${encodeURIComponent(
        settings.village_name || 'Vinayaka Vedika 2026'
      )}&cu=INR`
      QRCode.toDataURL(upiUrl, { width: 180, margin: 1 })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(''))
    } else {
      setQrCodeDataUrl('')
    }
  }, [settings.upi_id, settings.village_name])

  const handleOpenAdd = () => {
    setDonorName('')
    setAmount('')
    setPhone('')
    setDate(today())
    setNote('')
    setPaymentMode('Cash')
    setPinned(false)
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanName = (donorName || '').trim()
    const numAmount = Number(amount)

    if (!cleanName || !numAmount || numAmount <= 0) {
      toast.error('Please enter donor name and valid contribution amount.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        donor_name: cleanName,
        amount: numAmount,
        phone: (phone || '').trim(),
        date: date || today(),
        note: (note || '').trim(),
        payment_mode: paymentMode,
        pinned
      }

      const err = await add('donations', payload)
      if (err) throw err

      toast.success(`🙏 Recorded donation of ₹${numAmount} by ${cleanName}`)
      syncNewDonation(payload)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not record donation.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePin = async (d) => {
    const nextPinned = !d.pinned
    const err = await update('donations', d.id, {
      ...d,
      amount: Number(d.amount),
      pinned: nextPinned
    })
    if (err) {
      toast.error(err.message || 'Could not update pin status.')
    } else {
      toast.success(
        nextPinned
          ? `📌 ${d.donor_name || d.name} is now pinned to the Overview showcase!`
          : `Unpinned ${d.donor_name || d.name} from Overview.`
      )
    }
  }

  const handleSendWhatsApp = (d) => {
    openDonationWhatsAppReceipt({
      donor: {
        name: d.donor_name || d.name,
        phone: d.phone || d.mobile
      },
      amount: d.amount,
      receiptNo: d.id,
      paymentMode: d.payment_mode || 'Cash',
      gotram: d.note,
      date: fmtDate(d.date),
      villageName: settings.village_name || 'Sri Varasiddhi Vinayaka Utsava Samithi 2026'
    })
  }

  const donationFields = [
    { name: 'donor_name', label: 'Contributor Name', required: true, placeholder: 'e.g. Anji Reddy' },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: '1', required: true, placeholder: '1116' },
    { name: 'phone', label: 'WhatsApp / Mobile Number', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Contribution Date', type: 'date', default: today(), required: true },
    { name: 'note', label: 'Gotram / Special Note', placeholder: 'Optional dedication' },
    { name: 'payment_mode', label: 'Payment Mode', type: 'select', options: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Paytm', 'Bank Transfer'], default: 'Cash' },
    { name: 'pinned', label: 'Pin to Overview Showcase', type: 'checkbox' }
  ]

  return (
    <>
      <Card
        title="Donations & Contributions"
        action={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button onClick={handleOpenAdd}>
              ➕ Record Contribution
            </Button>
            {settings.upi_id && <span className="upi-badge">⚡ UPI Enabled</span>}
          </div>
        }
      >
        {settings.upi_id && (
          <div className="upi">
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="Scan QR to donate" className="upi-qr" />
            )}
            <div className="upi-details">
              <span>Scan QR with PhonePe / GPay / Paytm</span>
              <div className="upi-id-row">
                <b>UPI ID: {settings.upi_id}</b>
                <button
                  type="button"
                  className="copy-upi-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.upi_id)
                    toast.success(`Copied UPI ID: ${settings.upi_id}`)
                  }}
                  title="Copy UPI ID to clipboard"
                >
                  📋 Copy
                </button>
              </div>
              <small>All contributions are transparently recorded and audited here.</small>
            </div>
          </div>
        )}

        {/* Filter and Actions Bar */}
        <div className="filter-bar">
          <input
            value={search}
            placeholder="Search by name, phone or notes..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Sort: Newest first (Pinned top)</option>
            <option value="amount">Sort: Highest amount</option>
          </select>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="ALL">All Donations</option>
            <option value="VIP">VIP (₹5,000+)</option>
            <option value="PATRON">Patron (₹2,000–₹4,999)</option>
            <option value="SUPPORTER">Supporter (&lt; ₹2,000)</option>
          </select>

          {(admin || authorized) && (
            <Button
              kind="secondary"
              onClick={() => onOpenExcelImport && onOpenExcelImport('donations')}
              title="Upload Excel or CSV file to extract and import donations in bulk"
            >
              📊 Bulk Excel Import
            </Button>
          )}
        </div>

        {/* Top Contributors Banner */}
        {topDonations.length > 0 && !search && filterTier === 'ALL' && (
          <div className="top-contributors">
            <b>🏆 Top Contributions:</b>
            <div className="top-tags">
              {topDonations.map((d) => (
                <span key={d.id} className="top-tag">
                  {d.donor_name || d.name} — <b>{currency.format(d.amount)}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Donations List */}
        <div className="records-list">
          {filteredDonations.map((d) => {
            const donorNameStr = d.donor_name || d.name || 'Anonymous'
            const isUnlocked = admin || authorized

            return (
              <article className={`record-item ${d.pinned ? 'pinned-donor-row' : ''}`} key={d.id}>
                <div className="record-main">
                  <div className="record-title-row">
                    <b>{donorNameStr}</b>
                    {d.pinned && (
                      <span className="pinned-badge-chip">📌 Pinned to Overview</span>
                    )}
                    <span className={`badge ${tier(d.amount).toLowerCase()}`}>
                      {tier(d.amount)}
                    </span>
                    <strong className="record-amount">
                      {currency.format(d.amount)}
                    </strong>
                  </div>
                  <small className="record-meta">
                    📅 {fmtDate(d.date)}
                    {isUnlocked ? (
                      <>
                        {d.phone && ` · 📞 ${d.phone}`}
                        {d.payment_mode && ` · 💳 ${d.payment_mode}`}
                        {d.note && ` · 📝 ${d.note}`}
                      </>
                    ) : (
                      <span className="lock-protected-note"> · 🔒 Contact & Notes Protected</span>
                    )}
                  </small>
                </div>

                {/* Actions: Full tools for Authorized/Admin, Clean Devotee Card for Guests */}
                <div className="record-actions-cell">
                  {isUnlocked ? (
                    <>
                      {/* 1-Click WhatsApp Instant Receipt */}
                      <button
                        type="button"
                        className="btn-wa-receipt"
                        onClick={() => handleSendWhatsApp(d)}
                        title="Send WhatsApp instant receipt to donor"
                      >
                        <span className="action-icon">📲</span>
                        <span className="action-label">WhatsApp</span>
                      </button>

                      {/* 1-Click Official Printable Receipt with QR */}
                      <button
                        type="button"
                        className="btn-formal-receipt"
                        onClick={() =>
                          setOfficialReceiptDonation({
                            ...d,
                            name: donorNameStr,
                            amount: d.amount
                          })
                        }
                        title="Open official printable temple receipt with QR code"
                      >
                        <span className="action-icon">🖨️</span>
                        <span className="action-label">Receipt</span>
                      </button>

                      {/* Festive Golden Card */}
                      <Button
                        type="button"
                        kind="receipt-action"
                        onClick={() => setCardDonation(d)}
                        title="View & download golden donor appreciation card"
                      >
                        <span className="action-icon">🎨</span>
                        <span className="action-label">Card</span>
                      </Button>

                      <Button
                        type="button"
                        kind={d.pinned ? 'pinned-toggle-active' : 'pinned-toggle-btn'}
                        onClick={() => handleTogglePin(d)}
                        title={d.pinned ? 'Unpin from Overview' : 'Pin to Overview Showcase'}
                      >
                        <span className="action-icon">{d.pinned ? '📌' : '📍'}</span>
                        <span className="action-label">{d.pinned ? 'Pinned' : 'Pin'}</span>
                      </Button>

                      {admin && (
                        <RecordActions
                          record={d}
                          fields={donationFields}
                          onSave={(values) =>
                            update('donations', d.id, {
                              ...values,
                              donor_name: values.donor_name || values.name,
                              amount: Number(values.amount)
                            })
                          }
                          onDelete={() => remove('donations', d.id)}
                          deleteTitle="Delete Donation Record"
                          deleteMessage={`Delete contribution of ${currency.format(
                            d.amount
                          )} by ${donorNameStr}?`}
                        />
                      )}
                    </>
                  ) : (
                    /* Devotee View */
                    <Button
                      type="button"
                      kind="receipt-action"
                      onClick={() => setCardDonation(d)}
                      title="View auspicious donor appreciation card"
                    >
                      <span className="action-icon">🎨</span>
                      <span className="action-label">Blessing Card</span>
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {!filteredDonations.length && (
          <Empty
            text={
              search
                ? `No donations matching "${search}".`
                : 'No donations recorded yet. Click "Record Contribution" above.'
            }
          />
        )}
      </Card>

      {/* Add Donation Modal */}
      {isAddModalOpen && (
        <Modal
          title="Record New Contribution / Chanda"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>👤 Devotee / Contributor Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Ramesh Reddy"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>💰 Donation Amount (₹)</span>
                <span className="req-star">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1116"
                required
              />
              <div className="role-preset-chips">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`role-chip ${Number(amount) === amt ? 'selected' : ''}`}
                    onClick={() => setAmount(String(amt))}
                  >
                    ₹{amt.toLocaleString()}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>💳 Payment Mode</span>
                </label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="GPay">GPay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>📅 Date</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>🪔 Gotram / Dedication Note</span>
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. For Family Well-being"
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '6px', background: '#fffbeb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fef08a' }}>
              <input
                type="checkbox"
                id="pin-donation"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                style={{ width: '18px', height: '18px', margin: 0 }}
              />
              <label htmlFor="pin-donation" style={{ margin: 0, cursor: 'pointer', fontWeight: '600', color: '#92400e', fontSize: '0.86rem' }}>
                📌 Feature on Overview Showcase (Pinned Patron)
              </label>
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Recording…' : 'Record Contribution'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Festive Appreciation Card Modal */}
      {cardDonation && (
        <ReceiptTemplateModal
          donation={cardDonation}
          settings={settings}
          onClose={() => setCardDonation(null)}
        />
      )}

      {/* Official Printable Receipt Modal with QR */}
      {officialReceiptDonation && (
        <OfficialReceiptModal
          donation={officialReceiptDonation}
          settings={settings}
          onClose={() => setOfficialReceiptDonation(null)}
        />
      )}
    </>
  )
}
