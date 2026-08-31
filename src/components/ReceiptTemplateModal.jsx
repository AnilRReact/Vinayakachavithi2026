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

  // Selected 4K template theme (defaults to segment's custom theme)
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
        toast.success('Ultra-HD 4K Festive Card downloaded successfully!')
      } else {
        toast.error('Could not generate 4K image card.')
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
        toast.success('4K Festive image shared directly to WhatsApp!')
      } else if (res.downloaded) {
        toast.success('4K Image downloaded! WhatsApp opened to attach and send.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  const themeList = Object.values(TEMPLATE_THEMES)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${cardTitle}`}
      maxWidth="880px"
    >
      {/* Interactive 4K Template Theme Selector */}
      <div style={{ marginBottom: '14px', background: '#fdf8f0', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e7d8c4' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#7c2414' }}>
            ✨ Select 4K Template Design:
          </span>
          <span style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
            4K Ultra-HD Resolution
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
          {themeList.map((t) => {
            const isActive = selectedTheme === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTheme(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: isActive ? '2px solid #7c2414' : '1px solid #d6d3d1',
                  background: isActive ? '#fef2f2' : '#ffffff',
                  color: isActive ? '#7c2414' : '#44403c',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 2px 6px rgba(124, 36, 20, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: isActive ? '800' : '700', fontSize: '0.78rem' }}>
                  <span>{t.icon}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
                </div>
                <small style={{ fontSize: '0.68rem', color: '#78716c', marginTop: '2px' }}>
                  {t.desc}
                </small>
              </button>
            )
          })}
        </div>
      </div>

      {/* Exact 4K High-Fidelity Canvas Render Preview */}
      <div className="card-modal-preview-wrap" style={{ textAlign: 'center', background: '#1c0504', padding: '12px', borderRadius: '10px' }}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={cardTitle}
            style={{
              maxHeight: '480px',
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}
          />
        ) : (
          <div className="card-modal-loading" style={{ padding: '40px', color: '#ffe0a0' }}>
            <span className="loading-spinner">🪔</span>
            <p>{isGenerating ? 'Rendering 4K Ultra-HD Lord Ganesha Card…' : 'Could not generate card.'}</p>
          </div>
        )}
      </div>

      {/* Action Toolbar: Only WhatsApp and Download Image */}
      <div className="receipt-actions-toolbar" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
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

        <div className="receipt-right-actions" style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="button"
            kind="whatsapp-action"
            disabled={isSharing || isGenerating}
            onClick={handleShareWhatsApp}
            title="Share 4K image directly via WhatsApp"
          >
            <span>{isSharing ? 'Preparing 4K…' : '💬 WhatsApp 4K Image'}</span>
          </Button>

          <Button
            type="button"
            disabled={isDownloading || isGenerating}
            onClick={handleDownload}
            title="Download Ultra-HD 4K image card (.PNG)"
          >
            <span>{isDownloading ? 'Generating…' : '📥 Download 4K Image'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export const FestivalTemplateModal = ReceiptTemplateModal
