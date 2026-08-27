import { useState, useEffect } from 'react'
import { Modal, Button } from './ui'
import { generateIdCardCanvas, downloadIdCard, shareIdCardImage } from '../lib/idCardCanvas'
import { useToast } from '../context/ToastContext'

export function IdCardModal({ isOpen, onClose, member, settings = {} }) {
  const { toast } = useToast()
  const [previewUrl, setPreviewUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (!member) {
      setPreviewUrl('')
      return
    }

    setIsGenerating(true)
    generateIdCardCanvas(member, settings)
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
  }, [member, settings])

  if (!member) return null

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const ok = await downloadIdCard(member, settings)
      if (ok) {
        toast.success(`Official ID badge for ${member.name} downloaded as PNG!`)
      } else {
        toast.error('Failed to generate ID badge image.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShareWhatsApp = async () => {
    setIsSharing(true)
    try {
      const res = await shareIdCardImage(member, settings)
      if (res.error) {
        toast.error(`Could not share ID badge: ${res.error}`)
      } else if (res.sharedDirectly) {
        toast.success(`ID badge image for ${member.name} shared to WhatsApp!`)
      } else if (res.downloaded) {
        toast.success('ID badge image downloaded! WhatsApp opened to send the badge.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Committee ID Badge"
      maxWidth="460px"
    >
      {/* Exact High-Fidelity Canvas Render Preview */}
      <div className="card-modal-preview-wrap">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Official ID Badge for ${member.name}`}
            className="card-modal-preview-img"
          />
        ) : (
          <div className="card-modal-loading">
            <span className="loading-spinner">🪔</span>
            <p>{isGenerating ? 'Rendering Official ID Badge…' : 'Could not generate preview.'}</p>
          </div>
        )}
      </div>

      {/* Action Buttons: WhatsApp Image and Download */}
      <div className="modal-actions" style={{ marginTop: '12px' }}>
        <Button
          type="button"
          kind="whatsapp-action"
          disabled={isSharing || isGenerating}
          onClick={handleShareWhatsApp}
          title="Share ID badge image directly via WhatsApp"
        >
          <span>{isSharing ? 'Preparing Badge…' : '💬 WhatsApp Image'}</span>
        </Button>

        <Button
          type="button"
          disabled={isDownloading || isGenerating}
          onClick={handleDownload}
          title="Download High Resolution ID Badge (.PNG)"
        >
          <span>{isDownloading ? 'Generating…' : '📥 Download ID Card'}</span>
        </Button>
      </div>
    </Modal>
  )
}
