import React, { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { Card, Empty, Form, Button } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { OfficialReceiptModal } from '../../components/OfficialReceiptModal'
import { currency, fmtDate, tier, today } from '../../lib/formatters'
import { openDonationWhatsAppReceipt } from '../../lib/whatsapp'
import { syncNewDonation } from '../../lib/googleSheetsSync'
import { useToast } from '../../context/ToastContext'

export function DonationsSection({
  donations = [],
  settings = {},
  admin = false,
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
        settings.village_name || 'Vinayaka Vedika'
      )}&cu=INR`
      QRCode.toDataURL(upiUrl, { width: 180, margin: 1 })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(''))
    } else {
      setQrCodeDataUrl('')
    }
  }, [settings.upi_id, settings.village_name])

  // Donation form fields
  const donationFields = [
    { name: 'donor_name', label: 'Contributor Name', required: true, placeholder: 'e.g. Anji Reddy' },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: '1', required: true, placeholder: '1116' },
    { name: 'phone', label: 'WhatsApp / Mobile Number', placeholder: 'e.g. 9876543210' },
    { name: 'date', label: 'Contribution Date', type: 'date', default: today(), required: true },
    { name: 'note', label: 'Gotram / Special Note', placeholder: 'Optional dedication' },
    { name: 'payment_mode', label: 'Payment Mode', type: 'select', options: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Paytm', 'Bank Transfer'], default: 'Cash' },
    { name: 'pinned', label: 'Pin to Overview Showcase', type: 'checkbox' }
  ]

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

  const handleAddDonation = async (values) => {
    const payload = {
      ...values,
      donor_name: values.donor_name || values.name,
      amount: Number(values.amount)
    }
    const err = await add('donations', payload)
    if (err) {
      toast.error(err.message || 'Could not record donation.')
    } else {
      toast.success(`🙏 Recorded donation of ₹${payload.amount} by ${payload.donor_name}`)
      // Live Google Sheets Auto-Sync in background
      syncNewDonation(payload)
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
      villageName: settings.festival_title || 'శ్రీ వరసిద్ధి వినాయక ఉత్సవ సమితి 2026'
    })
  }

  return (
    <>
      <Card
        title="Donations & Contributions"
        action={settings.upi_id && <span className="upi-badge">⚡ UPI Enabled</span>}
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

          {admin && (
            <Button
              kind="secondary"
              onClick={() => onOpenExcelImport('donations')}
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
            const donorName = d.donor_name || d.name || 'Anonymous'
            return (
              <article className={`record-item ${d.pinned ? 'pinned-donor-row' : ''}`} key={d.id}>
                <div className="record-main">
                  <div className="record-title-row">
                    <b>{donorName}</b>
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
                    {d.phone && ` · 📞 ${d.phone}`}
                    {d.payment_mode && ` · 💳 ${d.payment_mode}`}
                    {d.note && ` · 📝 ${d.note}`}
                  </small>
                </div>

                <div className="record-actions-cell">
                  {/* 1-Click WhatsApp Instant Receipt */}
                  <button
                    type="button"
                    className="btn-wa-receipt"
                    onClick={() => handleSendWhatsApp(d)}
                    title="Send WhatsApp instant receipt to donor"
                  >
                    📲 <span>WhatsApp</span>
                  </button>

                  {/* 1-Click Official Printable Receipt with QR */}
                  <button
                    type="button"
                    className="btn-formal-receipt"
                    onClick={() =>
                      setOfficialReceiptDonation({
                        ...d,
                        name: donorName,
                        amount: d.amount
                      })
                    }
                    title="Open official printable temple receipt with QR code"
                  >
                    🖨️ <span>Print Receipt</span>
                  </button>

                  {/* Festive Golden Card */}
                  <Button
                    type="button"
                    kind="receipt-action"
                    onClick={() => setCardDonation(d)}
                    title="View & download 4K golden donor appreciation card"
                  >
                    <span className="action-icon">🎨</span>
                    <span className="action-label">Card</span>
                  </Button>

                  {admin && (
                    <Button
                      type="button"
                      kind={d.pinned ? 'pinned-toggle-active' : 'pinned-toggle-btn'}
                      onClick={() => handleTogglePin(d)}
                      title={d.pinned ? 'Unpin from Overview' : 'Pin to Overview Showcase'}
                    >
                      <span className="action-icon">{d.pinned ? '📌' : '📍'}</span>
                      <span className="action-label">{d.pinned ? 'Pinned' : 'Pin'}</span>
                    </Button>
                  )}

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
                      )} by ${donorName}?`}
                    />
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
                : 'No donations recorded yet.'
            }
          />
        )}
      </Card>

      {/* Admin Add Donation Form with Quick Amount Buttons */}
      {admin && (
        <Card title="Record New Contribution">
          <Form
            fields={donationFields}
            onSubmit={handleAddDonation}
            submitLabel="Record Contribution (విరాళం నమోదు)"
          />
        </Card>
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
