import { useState } from 'react'
import { Modal, Button } from './ui'
import { currency, fmtDate, tier } from '../lib/formatters'
import { downloadFestivalCard } from '../lib/receiptCanvas'
import { openWhatsAppMessage } from '../lib/notifications'
import { useToast } from '../context/ToastContext'

export function ReceiptTemplateModal({
  isOpen,
  onClose,
  donation,
  sponsor,
  record: propRecord,
  type = 'donation', // 'donation' | 'sponsor' | 'auction'
  settings = {},
  admin = false,
  onTogglePin
}) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  // Resolve record whether passed as donation, sponsor, or record
  const record = propRecord || donation || sponsor
  if (!record) return null

  const resolvedType = sponsor ? 'sponsor' : type
  const villageName = settings.village_name || 'Vinayaka Vedika'
  const dateStr = fmtDate(record.date)
  const recordId = (record.id || '0000').slice(0, 6).toUpperCase()

  let personName = 'Devotee / Contributor'
  let cardTitle = 'DONATION APPRECIATION RECEIPT'
  let badgeLabel = '★ PATRON ★'
  let mainHighlight = ''
  let subLabel = 'Contributed Amount'
  let refLabel = `Receipt No: #VV-2026-${recordId}`
  const isPinned = Boolean(record.pinned)

  if (resolvedType === 'sponsor') {
    personName = record.sponsor_name || record.name || 'Devotee Sponsor'
    cardTitle = 'PRASAD & BHANDARA SPONSOR'
    badgeLabel = '★ SEVA SPONSOR ★'
    mainHighlight = record.item || 'Maha Prasadam'
    subLabel = 'Sponsored Item'
    refLabel = `Sponsor Ref: #PR-2026-${recordId}`
  } else if (resolvedType === 'auction') {
    personName = record.current_bidder || record.donor_name || record.name || 'Winning Bidder'
    cardTitle = 'DAY 3 AUCTION WINNER'
    badgeLabel = '★ AUCTION PATRON ★'
    mainHighlight = record.amount ? currency.format(record.amount) : (record.item_name || 'Winning Bid')
    subLabel = 'Winning Contribution'
    refLabel = `Auction Ref: #AUC-2026-${recordId}`
  } else {
    // Donation
    personName = record.donor_name || record.name || 'Generous Contributor'
    const donorTier = tier(record.amount || 0)
    cardTitle = 'DONATION APPRECIATION RECEIPT'
    badgeLabel = `★ ${donorTier.toUpperCase()} PATRON ★`
    mainHighlight = currency.format(record.amount || 0)
    subLabel = 'Contributed Amount'
    refLabel = `Receipt No: #VV-2026-${recordId}`
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const success = await downloadFestivalCard(record, settings, resolvedType)
      if (success) {
        toast.success('Festive appreciation card downloaded as PNG image!')
      } else {
        toast.error('Could not generate appreciation card image.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShareWhatsApp = () => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
    let message = ''

    if (resolvedType === 'sponsor') {
      message = `🙏 *PRASAD SPONSOR CARD — ${villageName} 2026*\n\nReceived with heartfelt gratitude from:\n👤 *${personName}*\n🍲 *Item Sponsored:* ${record.item}\n📅 *Date:* ${dateStr}\n#️⃣ *${refLabel}*${
        record.note ? `\n📝 *Gotram / Dedication:* ${record.note}` : ''
      }\n\n“May Lord Vighnaharta Ganesha bless you and your family with peace, health, and prosperity.” 🙏\n\n🌐 *Portal:* ${portalUrl}`
    } else {
      message = `🙏 *DONATION RECEIPT — ${villageName} 2026*\n\nReceived with heartfelt gratitude from:\n👤 *${personName}*\n💰 *Amount:* ${mainHighlight} (${badgeLabel})\n📅 *Date:* ${dateStr}\n#️⃣ *${refLabel}*${
        record.note ? `\n📝 *Gotram / Note:* ${record.note}` : ''
      }\n\n“May Lord Vighnaharta Ganesha bless you and your family with peace, health, and prosperity.” 🙏\n\n🌐 *Portal:* ${portalUrl}`
    }

    openWhatsAppMessage('', message)
    toast.success('WhatsApp opened with formatted appreciation card!')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedType === 'sponsor' ? 'Prasad Sponsor Appreciation Card' : 'Festival Donation Receipt & Card'}
      maxWidth="820px"
    >
      {/* Visual Festive Receipt Template using User's Ganesha Backdrop */}
      <div className="ganesha-template-outer" id="printable-receipt">
        <div className="ganesha-template-card">
          {/* Background Image is set via CSS / inline on .ganesha-template-card */}
          <div className="ganesha-template-overlay">
            {/* Left side is reserved for Lord Ganesha idol */}
            <div className="ganesha-left-spacer" aria-hidden="true" />

            {/* Right side contains the text presentation */}
            <div className="ganesha-right-panel">
              <div className="ganesha-mantra-line">
                <span>🌿 ॐ శ్రీ గణేశాయ నమః 🌿</span>
              </div>

              <h2 className="ganesha-village-title">🪔 {villageName} 🪔</h2>
              <h3 className="ganesha-card-subtitle">{cardTitle}</h3>

              <div className="ganesha-meta-bar">
                <span>{refLabel}</span>
                <span>📅 {dateStr}</span>
              </div>

              <div className="ganesha-recipient-wrap">
                <p className="ganesha-prompt">Received with devotion & gratitude from:</p>
                <h1 className="ganesha-person-name">{personName}</h1>
                <span className="ganesha-tier-pill">{badgeLabel}</span>
              </div>

              <div className="ganesha-highlight-box">
                <span className="ganesha-highlight-label">{subLabel}</span>
                <strong className="ganesha-highlight-val">{mainHighlight}</strong>
              </div>

              {record.note && (
                <div className="ganesha-note-line">
                  <span>📝 Gotram / Purpose: “{record.note}”</span>
                </div>
              )}

              <p className="ganesha-blessing-quote">
                “May Lord Vighnaharta Ganesha bestow boundless peace, health, joy, and prosperity upon you and your family.” 🙏
              </p>

              <div className="ganesha-footer-seal">
                <span className="ganesha-verified">✓ Verified Official Record</span>
                <span className="ganesha-sign">Utsava Committee 🙏</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="receipt-actions-toolbar">
        <div className="receipt-left-actions">
          {admin && onTogglePin && resolvedType === 'donation' && (
            <Button
              type="button"
              kind={isPinned ? 'pinned-action' : 'secondary'}
              onClick={onTogglePin}
              title={isPinned ? 'Unpin from Overview' : 'Pin to Overview showcase'}
            >
              <span aria-hidden="true">{isPinned ? '📌' : '📍'}</span>
              <span>{isPinned ? 'Pinned to Overview' : 'Pin to Overview'}</span>
            </Button>
          )}
        </div>

        <div className="receipt-right-actions">
          <Button
            type="button"
            kind="whatsapp-action"
            onClick={handleShareWhatsApp}
            title="Share appreciation card via WhatsApp"
          >
            <span>💬 WhatsApp</span>
          </Button>

          <Button
            type="button"
            kind="secondary"
            onClick={handlePrint}
            title="Print receipt"
          >
            <span>🖨️ Print</span>
          </Button>

          <Button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            title="Download high-resolution image card (.PNG)"
          >
            <span>{isDownloading ? 'Generating…' : '📥 Download Image'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
