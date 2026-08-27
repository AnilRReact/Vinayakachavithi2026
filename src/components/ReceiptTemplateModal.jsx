import { useState, useEffect } from 'react'
import { Modal, Button } from './ui'
import {
  generateFestivalCard,
  downloadFestivalCard,
  shareFestivalCardImage
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

  useEffect(() => {
    let isMounted = true
    if (!record) {
      setPreviewUrl('')
      return
    }

    setIsGenerating(true)
    generateFestivalCard(record, settings, resolvedType)
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
  }, [record, settings, resolvedType])

  if (!record) return null

  let cardTitle = 'DONATION APPRECIATION RECEIPT'
  if (resolvedType === 'sponsor') cardTitle = 'PRASAD & BHANDARA SPONSOR'
  else if (resolvedType === 'volunteer') cardTitle = 'VOLUNTEER SEVA DUTY PASS'
  else if (resolvedType === 'notice') cardTitle = 'OFFICIAL PANDAL ANNOUNCEMENT'
  else if (resolvedType === 'activity' || resolvedType === 'event') cardTitle = 'POOJA & EVENT INVITATION'
  else if (resolvedType === 'award') cardTitle = 'SEVA PURASKAR · RECOGNITION AWARD'
  else if (resolvedType === 'nominee') cardTitle = 'BEST PANDAL RECOGNITION'
  else if (resolvedType === 'auction') cardTitle = 'DAY 3 AUCTION WINNER'

  const isPinned = Boolean(record.pinned)

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
      maxWidth="860px"
    >
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
