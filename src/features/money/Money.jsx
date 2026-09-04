import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { Card, Empty, Form, Button } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { ExcelImportModal } from '../../components/ExcelImportModal'
import { Bidding } from './Bidding'
import { currency, fmtDate, tier, today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Money({ data, admin, add, update, remove, recordBid, closeBid }) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [selectedReceiptDonation, setSelectedReceiptDonation] = useState(null)
  const [selectedSponsor, setSelectedSponsor] = useState(null)
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [importSegment, setImportSegment] = useState('donations')

  const openExcelImport = (seg = 'donations') => {
    setImportSegment(seg)
    setExcelModalOpen(true)
  }

  const settings = data.settings?.[0] || {}
  const donations = data.donations || []
  const expenses = data.expenses || []
  const purchases = data.purchases || []
  const prasadSponsors = data.prasad_sponsors || []

  // Memoized totals
  const raised = useMemo(
    () => donations.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [donations]
  )
  const spent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  )
  const balance = useMemo(() => raised - spent, [raised, spent])

  const reusablePurchases = useMemo(
    () => purchases.filter((p) => p.reusable),
    [purchases]
  )
  const reusableWorth = useMemo(
    () => reusablePurchases.reduce((sum, p) => sum + Number(p.cost || 0), 0),
    [reusablePurchases]
  )

  const purchasesByYear = useMemo(() => {
    const groups = purchases.reduce((acc, item) => {
      const year = item.year || new Date().getFullYear()
      acc[year] = acc[year] || []
      acc[year].push(item)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => String(b).localeCompare(String(a)))
  }, [purchases])

  const topDonations = useMemo(() => {
    return [...donations]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 3)
  }, [donations])

  const filteredDonations = useMemo(() => {
    let list = donations.filter((d) =>
      (d.donor_name || '').toLowerCase().includes(search.toLowerCase())
    )
    return list.sort((a, b) => {
      // Keep pinned items at top unless sorting strictly by amount
      if (sort !== 'amount' && a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return sort === 'amount'
        ? Number(b.amount || 0) - Number(a.amount || 0)
        : String(b.date).localeCompare(String(a.date))
    })
  }, [donations, search, sort])

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

  // Field configurations
  const donationFields = [
    { name: 'donor_name', label: 'Contributor Name', required: true, placeholder: 'e.g. Anji Reddy' },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: '1', required: true, placeholder: '1001' },
    { name: 'date', label: 'Contribution Date', type: 'date', default: today(), required: true },
    { name: 'note', label: 'Special Note / Gotram / Dedication', placeholder: 'Optional note' },
    { name: 'pinned', label: 'Pin to Overview Showcase', type: 'checkbox' }
  ]

  const sponsorFields = [
    { name: 'sponsor_name', label: 'Sponsor Name / Family', required: true, placeholder: 'e.g. Srikanth & Family' },
    { name: 'date', label: 'Sponsorship Date', type: 'date', default: today(), required: true },
    { name: 'item', label: 'Prasad / Item Sponsored', required: true, placeholder: 'e.g. Morning Maha Prasadam (Pulihora), Fruits' },
    { name: 'note', label: 'Gotram / Dedication Note', placeholder: 'Optional dedication' }
  ]

  const expenseFields = [
    { name: 'category', label: 'Expense Category', required: true, placeholder: 'e.g. Tent & Lighting, Flowers, Prasadam' },
    { name: 'amount', label: 'Amount Spent (₹)', type: 'number', min: '1', required: true, placeholder: '5000' },
    { name: 'date', label: 'Payment Date', type: 'date', default: today(), required: true },
    { name: 'paid_to', label: 'Paid To (Vendor / Person)', required: true, placeholder: 'e.g. Sri Balaji Sound' },
    { name: 'note', label: 'Bill / Voucher / Details', placeholder: 'Optional details' }
  ]

  const purchaseFields = [
    { name: 'item', label: 'Asset / Item Name', required: true, placeholder: 'e.g. Brass Pooja Aarti Plate' },
    { name: 'category', label: 'Category', required: true, placeholder: 'e.g. Utensils, Audio, Lighting, Decoration' },
    { name: 'cost', label: 'Cost (₹)', type: 'number', min: '0', required: true, placeholder: '1500' },
    { name: 'year', label: 'Purchase Year', type: 'number', default: new Date().getFullYear(), required: true },
    { name: 'reusable', label: 'Reusable inventory (kept for next year)', type: 'checkbox', default: true },
    { name: 'condition_note', label: 'Condition / Storage Location', placeholder: 'e.g. Good condition, stored in temple locker' }
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
          ? `📌 ${d.donor_name} is now pinned to the Overview showcase!`
          : `Unpinned ${d.donor_name} from Overview.`
      )
      if (selectedReceiptDonation?.id === d.id) {
        setSelectedReceiptDonation({ ...d, pinned: nextPinned })
      }
    }
  }

  return (
    <>
      <div className="moneybar">
        <span>
          Collected <b>{currency.format(raised)}</b>
        </span>
        <span>
          Spent <b>{currency.format(spent)}</b>
        </span>
        <span>
          Balance <b>{currency.format(balance)}</b>
        </span>
      </div>

      {/* Donations & Contributions */}
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
              <small>All contributions are transparently recorded here.</small>
            </div>
          </div>
        )}

        <div className="filter-bar">
          <input
            value={search}
            placeholder="Search contributor by name..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Sort: Newest first (Pinned top)</option>
            <option value="amount">Sort: Highest amount</option>
          </select>

          {admin && (
            <Button
              kind="secondary"
              onClick={() => openExcelImport('donations')}
              title="Upload Excel or CSV file to extract and import donations in bulk"
            >
              📊 Bulk Excel Import
            </Button>
          )}
        </div>

        {topDonations.length > 0 && !search && (
          <div className="top-contributors">
            <b>🏆 Top Contributions:</b>
            <div className="top-tags">
              {topDonations.map((d) => (
                <span key={d.id} className="top-tag">
                  {d.donor_name} — <b>{currency.format(d.amount)}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="records-list">
          {filteredDonations.map((d) => (
            <article className={`record-item ${d.pinned ? 'pinned-donor-row' : ''}`} key={d.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{d.donor_name}</b>
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
                  {d.note && ` · 📝 ${d.note}`}
                </small>
              </div>

              <div className="record-actions-cell">
                <Button
                  type="button"
                  kind="receipt-action"
                  onClick={() => setSelectedReceiptDonation(d)}
                  title="View, download image, or print festive receipt"
                >
                  <span className="action-icon">📜</span>
                  <span className="action-label">Receipt & Card</span>
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
                        amount: Number(values.amount)
                      })
                    }
                    onDelete={() => remove('donations', d.id)}
                    deleteTitle="Delete Donation Record"
                    deleteMessage={`Delete contribution of ${currency.format(
                      d.amount
                    )} by ${d.donor_name}?`}
                  />
                )}
              </div>
            </article>
          ))}
        </div>

        {!filteredDonations.length && (
          <Empty>
            {search
              ? 'No contributions found matching your search.'
              : 'Contributions will appear here with full transparency.'}
          </Empty>
        )}

        {admin && (
          <div style={{ marginTop: '24px' }}>
            <h4>Log New Donation</h4>
            <Form
              submit="Log Donation"
              onSubmit={(v) =>
                add('donations', { ...v, amount: Number(v.amount) })
              }
              fields={donationFields}
            />
          </div>
        )}
      </Card>

      {/* Prasad & Bhandara Sponsors Section (Moved to Money) */}
      <Card
        title="Prasad & Bhandara Sponsors"
        action={
          admin && (
            <Button
              kind="secondary"
              size="small"
              onClick={() => openExcelImport('prasad_sponsors')}
              title="Upload Excel or CSV file to extract and import prasad sponsors in bulk"
            >
              📊 Bulk Excel Import
            </Button>
          )
        }
      >
        <p className="muted">
          Devotees sponsoring daily pooja prasad, annadanam, flowers, and offerings.
        </p>

        <div className="records-list">
          {prasadSponsors.map((s) => (
            <div className="record-item" key={s.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{s.sponsor_name}</b>
                  <span className="badge green">🍲 Seva Sponsor</span>
                  <strong>{s.item}</strong>
                </div>
                <small className="record-meta">
                  📅 {fmtDate(s.date)}
                  {s.note && ` · 📝 ${s.note}`}
                </small>
              </div>

              <div className="record-actions-cell">
                <Button
                  type="button"
                  kind="receipt-action"
                  onClick={() => setSelectedSponsor(s)}
                  title="View, download image card on Ganesha template, or share on WhatsApp"
                >
                  <span className="action-icon">📜</span>
                  <span className="action-label">Sponsor Card</span>
                </Button>

                {admin && (
                  <RecordActions
                    record={s}
                    fields={sponsorFields}
                    onSave={(values) => update('prasad_sponsors', s.id, values)}
                    onDelete={() => remove('prasad_sponsors', s.id)}
                    deleteTitle="Remove Sponsor Record"
                    deleteMessage={`Remove sponsorship record for ${s.sponsor_name}?`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {!prasadSponsors.length && (
          <Empty>Prasad & Bhandara sponsors will appear here.</Empty>
        )}

        {admin && (
          <div style={{ marginTop: '24px' }}>
            <h4>Add Prasad Sponsor</h4>
            <Form
              submit="Save Sponsor"
              onSubmit={(v) => add('prasad_sponsors', v)}
              fields={sponsorFields}
            />
          </div>
        )}
      </Card>

      {/* Expenses Section */}
      <Card
        title="Expenses & Payments"
        action={
          admin && (
            <Button
              kind="secondary"
              size="small"
              onClick={() => openExcelImport('expenses')}
              title="Upload Excel or CSV file to extract and import expenses in bulk"
            >
              📊 Bulk Excel Import
            </Button>
          )
        }
      >
        <p className="muted">
          All festival purchases, stage setups, sound, flowers, and pooja costs.
        </p>

        <div className="records-list">
          {expenses.map((e) => (
            <article className="record-item" key={e.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{e.category}</b>
                  <strong className="record-amount expense">
                    {currency.format(e.amount)}
                  </strong>
                </div>
                <small className="record-meta">
                  📅 {fmtDate(e.date)} · Paid to: <b>{e.paid_to}</b>
                  {e.note && ` · 📝 ${e.note}`}
                </small>
              </div>

              {admin && (
                <div className="record-actions-cell">
                  <RecordActions
                    record={e}
                    fields={expenseFields}
                    onSave={(values) =>
                      update('expenses', e.id, {
                        ...values,
                        amount: Number(values.amount)
                      })
                    }
                    onDelete={() => remove('expenses', e.id)}
                    deleteTitle="Delete Expense Record"
                    deleteMessage={`Delete expense of ${currency.format(
                      e.amount
                    )} for ${e.category}?`}
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        {!expenses.length && <Empty>No expenses logged yet.</Empty>}

        {admin && (
          <div style={{ marginTop: '24px' }}>
            <h4>Log New Expense</h4>
            <Form
              submit="Log Expense"
              onSubmit={(v) =>
                add('expenses', { ...v, amount: Number(v.amount) })
              }
              fields={expenseFields}
            />
          </div>
        )}
      </Card>

      {/* Purchases & Assets Section */}
      <Card title="Purchases & Reusable Assets">
        <div className="inventory-banner">
          ♻️ <b>{reusablePurchases.length} reusable items on hand</b> (est. worth{' '}
          <b>{currency.format(reusableWorth)}</b>)
        </div>

        <div className="purchases-by-year">
          {purchasesByYear.map(([year, items]) => {
            const yearTotal = items.reduce((s, i) => s + Number(i.cost || 0), 0)
            return (
              <div className="year-group" key={year}>
                <div className="year-header">
                  <h3>
                    Year {year}{' '}
                    <small>({items.length} assets · {currency.format(yearTotal)})</small>
                  </h3>
                </div>
                <div className="records-list">
                  {items.map((p) => (
                    <article className="record-item" key={p.id}>
                      <div className="record-main">
                        <div className="record-title-row">
                          <b>{p.item}</b>
                          <span className="badge amber">{p.category}</span>
                          {p.reusable && (
                            <span className="badge green">♻ Reusable</span>
                          )}
                          <strong className="record-amount">
                            {currency.format(p.cost)}
                          </strong>
                        </div>
                        <small className="record-meta">
                          Purchased in {p.year}
                          {p.condition_note && ` · 📍 ${p.condition_note}`}
                        </small>
                      </div>

                      {admin && (
                        <div className="record-actions-cell">
                          <RecordActions
                            record={p}
                            fields={purchaseFields}
                            onSave={(values) =>
                              update('purchases', p.id, {
                                ...values,
                                cost: Number(values.cost),
                                year: Number(values.year)
                              })
                            }
                            onDelete={() => remove('purchases', p.id)}
                            deleteTitle="Delete Asset"
                            deleteMessage={`Delete ${p.item} from purchases?`}
                          />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {!purchases.length && (
          <Empty>No permanent or reusable purchases logged yet.</Empty>
        )}

        {admin && (
          <div style={{ marginTop: '24px' }}>
            <h4>Record Asset Purchase</h4>
            <Form
              submit="Save Purchase"
              onSubmit={(v) =>
                add('purchases', {
                  ...v,
                  cost: Number(v.cost),
                  year: Number(v.year)
                })
              }
              fields={purchaseFields}
            />
          </div>
        )}
      </Card>

      <Bidding
        data={data}
        admin={admin}
        add={add}
        update={update}
        remove={remove}
        recordBid={recordBid}
        closeBid={closeBid}
      />

      {/* Festive Donor Receipt & Appreciation Template Modal */}
      {selectedReceiptDonation && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedReceiptDonation)}
          onClose={() => setSelectedReceiptDonation(null)}
          donation={selectedReceiptDonation}
          type="donation"
          settings={settings}
          admin={admin}
          onTogglePin={() => handleTogglePin(selectedReceiptDonation)}
        />
      )}

      {/* Festive Prasad Sponsor Appreciation Template Modal */}
      {selectedSponsor && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedSponsor)}
          onClose={() => setSelectedSponsor(null)}
          sponsor={selectedSponsor}
          type="sponsor"
          settings={settings}
          admin={admin}
        />
      )}

      {/* Universal Bulk Excel / CSV Data Import Modal */}
      {excelModalOpen && (
        <ExcelImportModal
          isOpen={excelModalOpen}
          onClose={() => setExcelModalOpen(false)}
          initialSegment={importSegment}
          portalData={data}
          onAddRecord={add}
          onBatchComplete={() => {
            if (toast?.success) toast.success('🎉 Excel import operation completed!')
          }}
        />
      )}
    </>
  )
}
