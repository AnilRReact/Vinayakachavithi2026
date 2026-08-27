import { useState } from 'react'
import { Modal, Button } from './ui'
import { downloadIdCard } from '../lib/idCardCanvas'
import { openWhatsAppMessage } from '../lib/notifications'
import { useToast } from '../context/ToastContext'

export function IdCardModal({ isOpen, onClose, member, settings = {} }) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  if (!member) return null

  const villageName = settings.village_name || 'Vinayaka Vedika'
  const idNumber = `VV-2026-${(member.id || '0000').slice(0, 6).toUpperCase()}`

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

  const handleShareWhatsApp = () => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const msg = `🪔 *OFFICIAL COMMITTEE ID BADGE — 2026*\n*${villageName}*\n\n👤 *Name:* ${member.name}\n🎖️ *Designation:* ${member.role}\n🆔 *Member ID:* #${idNumber}\n📞 *Phone:* ${member.phone || 'N/A'}\n\n✓ *Authorized for Stage, Pooja & Festival Coordination.*\n\n🌐 *Portal:* ${portalUrl}`
    openWhatsAppMessage(member.phone || '', msg)
    toast.success(`WhatsApp opened for ${member.name}'s ID Badge!`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Committee ID Badge"
      maxWidth="480px"
    >
      {/* Physical Badge Layout */}
      <div className="id-badge-outer-wrap" id="printable-id-card">
        {/* Lanyard Hole Clip */}
        <div className="id-badge-lanyard-hanger">
          <div className="lanyard-hole" />
          <div className="lanyard-clip" />
        </div>

        <div className="id-badge-frame">
          {/* Badge Header Banner */}
          <div className="id-badge-header">
            <span className="id-badge-sacred">🌿 ॐ శ్రీ గణేశాయ నమః 🌿</span>
            <h3 className="id-badge-village">🪔 {villageName} 🪔</h3>
            <span className="id-badge-sub">UTSAVA COMMITTEE · OFFICIAL ID BADGE</span>
            <small className="id-badge-year">VINAYAKA CHAVITHI 2026</small>
          </div>

          {/* Photo Avatar */}
          <div className="id-badge-photo-wrap">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.name} className="id-badge-img" />
            ) : (
              <div className="id-badge-avatar-fallback">
                {member.name?.[0]?.toUpperCase() || 'ॐ'}
              </div>
            )}
          </div>

          {/* Member Name & Designation */}
          <h2 className="id-badge-name">{member.name}</h2>
          <div className="id-badge-role-chip">
            <span>★ {member.role?.toUpperCase()} ★</span>
          </div>

          {/* Details Table */}
          <div className="id-badge-details-box">
            <div className="id-badge-row">
              <span className="id-badge-label">MEMBER ID</span>
              <strong className="id-badge-val mono">#{idNumber}</strong>
            </div>
            <div className="id-badge-row">
              <span className="id-badge-label">PHONE</span>
              <a href={`tel:${member.phone}`} className="id-badge-val phone-link">
                📞 {member.phone || 'Registered on file'}
              </a>
            </div>
            <div className="id-badge-row">
              <span className="id-badge-label">SEVA AREA</span>
              <span className="id-badge-val">Stage, Aarti & Festival Seva</span>
            </div>
          </div>

          {/* Verification Watermark */}
          <div className="id-badge-seal-bar">
            <span className="id-badge-check">✓ AUTHORIZED PASS</span>
            <span className="id-badge-auth">Utsava Committee 🙏</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="modal-actions" style={{ marginTop: '16px' }}>
        <Button
          type="button"
          kind="whatsapp-action"
          onClick={handleShareWhatsApp}
          title="Share ID badge via WhatsApp"
        >
          <span>💬 WhatsApp</span>
        </Button>

        <Button
          type="button"
          kind="secondary"
          onClick={handlePrint}
          title="Print ID badge"
        >
          <span>🖨️ Print</span>
        </Button>

        <Button
          type="button"
          disabled={isDownloading}
          onClick={handleDownload}
          title="Download High Resolution ID Badge (.PNG)"
        >
          <span>{isDownloading ? 'Generating…' : '📥 Download ID Card'}</span>
        </Button>
      </div>
    </Modal>
  )
}

