import { useState } from 'react'
import { Modal, Button } from './ui'
import { currency, fmtDate, tier } from '../lib/formatters'
import { downloadFestivalCard, shareFestivalCardImage } from '../lib/receiptCanvas'
import { openWhatsAppMessage } from '../lib/notifications'
import { useToast } from '../context/ToastContext'
import ganeshaBg from '../assets/ganesha-template-bg.jpg'

export function ReceiptTemplateModal({
  isOpen,
  onClose,
  donation,
  sponsor,
  volunteer,
  notice,
  activity,
  award,
  nominee,
  record: propRecord,
  type = 'donation',
  settings = {},
  admin = false,
  onTogglePin
}) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  // Resolve record & type
  const record =
    propRecord || donation || sponsor || volunteer || notice || activity || award || nominee
  if (!record) return null

  let resolvedType = type
  if (sponsor) resolvedType = 'sponsor'
  else if (volunteer) resolvedType = 'volunteer'
  else if (notice) resolvedType = 'notice'
  else if (activity) resolvedType = 'activity'
  else if (award) resolvedType = 'award'
  else if (nominee) resolvedType = 'nominee'

  const villageName = settings.village_name || 'Vinayaka Vedika'
  const dateStr = fmtDate(record.date)
  const recordId = (record.id || '0000').slice(0, 6).toUpperCase()

  let personName = 'Devotee / Contributor'
  let cardTitle = 'DONATION APPRECIATION RECEIPT'
  let badgeLabel = '★ PATRON ★'
  let mainHighlight = ''
  let subLabel = 'Contributed Amount'
  let refLabel = `Receipt No: #VV-2026-${recordId}`
  let promptText = 'Received with devotion & gratitude from:'
  let noteText = record.note ? `“${record.note}”` : ''
  let blessingQuote =
    '“May Lord Vighnaharta Ganesha bestow boundless peace, health, joy, and prosperity upon you and your family.” 🙏'

  const isPinned = Boolean(record.pinned)

  if (resolvedType === 'sponsor') {
    personName = record.sponsor_name || record.name || 'Devotee Sponsor'
    cardTitle = 'PRASAD & BHANDARA SPONSOR'
    badgeLabel = '★ SEVA SPONSOR ★'
    mainHighlight = record.item || 'Maha Prasadam'
    subLabel = 'Sponsored Item'
    refLabel = `Sponsor Ref: #PR-2026-${recordId}`
    promptText = 'Sponsored with devotion by:'
  } else if (resolvedType === 'volunteer') {
    personName = record.name || 'Dedicated Volunteer'
    cardTitle = 'VOLUNTEER SEVA DUTY PASS'
    badgeLabel = '★ UTSAVA SEVA VOLUNTEER ★'
    mainHighlight = record.duty || 'Festival Seva'
    subLabel = 'Assigned Seva Duty'
    refLabel = `Seva ID: #VOL-2026-${recordId}`
    promptText = 'Official festival seva assigned to:'
    noteText = `Duty Date: ${dateStr}${record.contact ? ` · 📞 ${record.contact}` : ''}`
    blessingQuote =
      '“May Lord Ganesha shower divine grace upon you for your selfless service and devotion to the community.” 🙏'
  } else if (resolvedType === 'notice') {
    personName = villageName
    cardTitle = 'OFFICIAL PANDAL ANNOUNCEMENT'
    badgeLabel = record.pinned ? '★ PINNED ANNOUNCEMENT ★' : '★ PUBLIC NOTICE ★'
    mainHighlight = record.message || 'Festival Announcement'
    subLabel = 'Announcement Details'
    refLabel = `Notice Ref: #NOT-2026-${recordId}`
    promptText = 'Official announcement for all devotees:'
    noteText = `Published on: ${dateStr}`
    blessingQuote =
      '“Ganapathi Bappa Morya! All devotees and families are warmly welcome to join the festivities.” 🙏'
  } else if (resolvedType === 'activity' || resolvedType === 'event') {
    personName = record.title || 'Festival Event'
    cardTitle = 'POOJA & EVENT INVITATION'
    badgeLabel = '★ CORDIAL INVITATION ★'
    mainHighlight = `📅 ${dateStr}${record.start_time ? ` at ${record.start_time}` : ''}`
    subLabel = 'Event Timing (IST)'
    refLabel = `Event Ref: #EVT-2026-${recordId}`
    promptText = 'You and your family are cordially invited to:'
    noteText = `📍 Venue: ${record.location || villageName} ${record.description ? `· ${record.description}` : ''}`
    blessingQuote =
      '“Join the sacred rituals and receive the divine blessings of Lord Vighnaharta Sri Ganesha.” 🙏'
  } else if (resolvedType === 'award') {
    personName = record.recipient || 'Honoured Devotee'
    cardTitle = 'SEVA PURASKAR · RECOGNITION AWARD'
    badgeLabel = `★ ${record.year || '2026'} FESTIVAL HONOUR ★`
    mainHighlight = `🏆 ${record.title || 'Seva Puraskar'}`
    subLabel = 'Conferred Honour'
    refLabel = `Award Ref: #AWD-2026-${recordId}`
    promptText = 'Presented in recognition of distinguished service to:'
    noteText = record.note ? `Citation: “${record.note}”` : ''
    blessingQuote =
      '“In deep appreciation for your invaluable dedication, generosity, and devotion to our village celebration.” 🙏'
  } else if (resolvedType === 'nominee') {
    personName = record.name || 'Pandal Mandali'
    cardTitle = 'BEST PANDAL RECOGNITION'
    badgeLabel = '★ UTSAVA PANDAL COMPETITION ★'
    mainHighlight = `🎪 ${record.name}`
    subLabel = 'Nominated Mandali'
    refLabel = `Entry Ref: #PAN-2026-${recordId}`
    promptText = 'Official festival pandal nominee:'
    noteText = record.note ? `Theme: “${record.note}”` : ''
    blessingQuote =
      '“May Lord Ganesha bless your youth mandali with boundless energy, harmony, and grand success.” 🙏'
  } else if (resolvedType === 'auction') {
    personName = record.current_bidder || record.donor_name || record.name || 'Winning Bidder'
    cardTitle = 'DAY 3 AUCTION WINNER'
    badgeLabel = '★ AUCTION PATRON ★'
    mainHighlight = record.amount ? currency.format(record.amount) : (record.item_name || 'Winning Bid')
    subLabel = 'Winning Contribution'
    refLabel = `Auction Ref: #AUC-2026-${recordId}`
    promptText = 'Sacred prasadam / laddu auction awarded to:'
    noteText = record.item_name ? `Item: ${record.item_name}` : ''
    blessingQuote =
      '“May the sacred prasadam bring health, prosperity, and immense auspiciousness to your home.” 🙏'
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
        toast.success('Festive card downloaded as high-resolution PNG image!')
      } else {
        toast.error('Could not generate image card.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const [isSharing, setIsSharing] = useState(false)

  const handleShareWhatsApp = async () => {
    setIsSharing(true)
    try {
      const res = await shareFestivalCardImage(record, settings, resolvedType)
      if (res.error) {
        toast.error(`Could not share image: ${res.error}`)
      } else if (res.sharedDirectly) {
        toast.success('Festive image shared successfully to WhatsApp!')
      } else if (res.downloaded) {
        toast.success('Image downloaded! WhatsApp opened to send the image.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${cardTitle}`}
      maxWidth="820px"
    >
      {/* Visual Festive Template using User's Ganesha Backdrop */}
      <div className="ganesha-template-outer" id="printable-receipt">
        <div
          className="ganesha-template-card"
          style={{
            backgroundImage: `url("${ganeshaBg}")`,
            backgroundColor: '#380604'
          }}
        >
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
                <p className="ganesha-prompt">{promptText}</p>
                <h1 className="ganesha-person-name">{personName}</h1>
                <span className="ganesha-tier-pill">{badgeLabel}</span>
              </div>

              <div className="ganesha-highlight-box">
                <span className="ganesha-highlight-label">{subLabel}</span>
                <strong className="ganesha-highlight-val">{mainHighlight}</strong>
              </div>

              {noteText && (
                <div className="ganesha-note-line">
                  <span>{noteText}</span>
                </div>
              )}

              <p className="ganesha-blessing-quote">{blessingQuote}</p>

              <div className="ganesha-footer-seal">
                <span className="ganesha-verified">✓ Verified Official Record</span>
                <span className="ganesha-sign">Utsava Committee 🙏</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar: Only WhatsApp and Download Image */}
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
            disabled={isSharing}
            onClick={handleShareWhatsApp}
            title="Share image card directly via WhatsApp"
          >
            <span>{isSharing ? 'Preparing Image…' : '💬 WhatsApp Image'}</span>
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

export const FestivalTemplateModal = ReceiptTemplateModal
