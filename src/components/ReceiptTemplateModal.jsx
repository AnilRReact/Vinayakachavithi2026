import { useState, useEffect } from 'react'
import { Modal, Button } from './ui'
import {
  generateFestivalCard,
  downloadFestivalCard,
  shareFestivalCardImage,
  getDefaultThemeForSegment,
  TEMPLATE_THEMES
} from '../lib/receiptCanvas'
import { useToast } from '../context/ToastContext'

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
  const [previewUrl, setPreviewUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Resolve record & type
  const record =
    propRecord || donation || sponsor || volunteer || notice || activity || award || nominee

  let resolvedType = type
  if (sponsor) resolvedType = 'sponsor'
  else if (volunteer) resolvedType = 'volunteer'
  else if (notice) resolvedType = 'notice'
  else if (activity) resolvedType = 'activity'
  else if (award) resolvedType = 'award'
  else if (nominee) resolvedType = 'nominee'

  // Selected template theme (defaults to segment's custom theme)
  const [selectedTheme, setSelectedTheme] = useState(() => getDefaultThemeForSegment(resolvedType))

  // Reset default theme when resolvedType changes
  useEffect(() => {
    setSelectedTheme(getDefaultThemeForSegment(resolvedType))
  }, [resolvedType])

  useEffect(() => {
    let isMounted = true
    if (!record) {
      setPreviewUrl('')
      return
    }

    setIsGenerating(true)
    generateFestivalCard(record, settings, resolvedType, selectedTheme)
      .then((canvas) => {
        if (isMounted) {
          setPreviewUrl(canvas.toDataURL('image/png'))
          setIsGenerating(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [record, settings, resolvedType, selectedTheme])

  if (!record) return null

  let cardTitle = 'DONATION APPRECIATION RECEIPT'
  if (resolvedType === 'sponsor') cardTitle = 'PRASAD & BHANDARA SEVA SPONSOR'
  else if (resolvedType === 'volunteer') cardTitle = 'VOLUNTEER SEVA DUTY PASS'
  else if (resolvedType === 'notice') cardTitle = 'OFFICIAL PANDAL ANNOUNCEMENT'
  else if (resolvedType === 'activity' || resolvedType === 'event') cardTitle = 'POOJA & UTSAVA INVITATION'
  else if (resolvedType === 'award') cardTitle = 'SEVA PURASKAR · RECOGNITION AWARD'
  else if (resolvedType === 'nominee') cardTitle = 'BEST PANDAL CONTEST RECOGNITION'
  else if (resolvedType === 'auction') cardTitle = 'DAY 3 AUCTION WINNER CERTIFICATE'

  const isPinned = Boolean(record.pinned)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const success = await downloadFestivalCard(record, settings, resolvedType, selectedTheme)
      if (success) {
        toast.success('Festive card downloaded as high-resolution PNG image!')
      } else {
        toast.error('Could not generate image card.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShareWhatsApp = async () => {
    setIsSharing(true)
    try {
      const res = await shareFestivalCardImage(record, settings, resolvedType, selectedTheme)
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

  const themeButtons = [
    { key: 'red', label: 'Sacred Red', icon: '🔴', desc: 'Patrons & Receipts' },
    { key: 'yellow', label: 'Golden Saffron', icon: '🟡', desc: 'Prasad & Auctions' },
    { key: 'green', label: 'Emerald Seva', icon: '🟢', desc: 'Volunteers & Seva' },
    { key: 'purple', label: 'Royal Amethyst', icon: '🟣', desc: 'Poojas & Events' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${cardTitle}`}
      maxWidth="880px"
    >
      {/* Interactive Segment Template Theme Switcher */}
      <div style={{ marginBottom: '14px', background: '#fdf8f0', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e7d8c4' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#7c2414' }}>
            🎨 Template Theme & 2026 Ganesh Idol Variant:
          </span>
          <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
            Tailored specifically for this segment (click to change)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {themeButtons.map((btn) => {
            const isActive = selectedTheme === btn.key
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setSelectedTheme(btn.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: isActive ? '2px solid #7c2414' : '1px solid #d6d3d1',
                  background: isActive ? '#fef2f2' : '#ffffff',
                  color: isActive ? '#7c2414' : '#44403c',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 6px rgba(124, 36, 20, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{btn.icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{btn.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Exact High-Fidelity Canvas Render Preview */}
      <div className="card-modal-preview-wrap">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={cardTitle}
            className="card-modal-preview-img landscape"
          />
        ) : (
          <div className="card-modal-loading">
            <span className="loading-spinner">🪔</span>
            <p>{isGenerating ? 'Rendering Sacred Lord Ganesha Card…' : 'Could not generate card.'}</p>
          </div>
        )}
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
            disabled={isSharing || isGenerating}
            onClick={handleShareWhatsApp}
            title="Share image card directly via WhatsApp"
          >
            <span>{isSharing ? 'Preparing Image…' : '💬 WhatsApp Image'}</span>
          </Button>

          <Button
            type="button"
            disabled={isDownloading || isGenerating}
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
