import React, { useState } from 'react'
import { Card, Empty, Button, Modal } from '../../components/ui'
import { IdCardModal } from '../../components/IdCardModal'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { uploadImageToStorage } from '../../lib/storage'
import { getCommitteeInviteText, openWhatsAppMessage } from '../../lib/notifications'
import { useToast } from '../../context/ToastContext'

const POPULAR_ROLES = [
  'President',
  'Vice President',
  'General Secretary',
  'Treasurer',
  'Joint Secretary',
  'Pooja Coordinator',
  'Youth President',
  'Volunteer Lead',
  'Advisory Member'
]

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export function CommitteeRoster({
  members = [],
  settings = {},
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()
  const villageName = settings.village_name || 'Vinayaka Vedika 2026'

  const [selectedMemberForId, setSelectedMemberForId] = useState(null)
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  // Form states
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleOpenAdd = () => {
    setName('')
    setRole('')
    setPhone('')
    setBloodGroup('')
    setArea('')
    setNotes('')
    setPhotoFile(null)
    setPhotoPreview('')
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (m) => {
    setEditingMember(m)
    setName(m.name || '')
    setRole(m.role || '')
    setPhone(m.phone || '')
    setBloodGroup(m.blood_group || '')
    setArea(m.area || '')
    setNotes(m.notes || '')
    setPhotoPreview(m.photo_url || '')
    setPhotoFile(null)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanName = (name || '').trim()
    const cleanRole = (role || '').trim()
    const cleanPhone = (phone || '').trim()
    const cleanNotes = (notes || '').trim()
    const cleanBlood = (bloodGroup || '').trim()
    const cleanArea = (area || '').trim()

    if (!cleanName || !cleanRole) {
      toast.error('Please enter member name and committee role.')
      return
    }

    setIsSaving(true)
    try {
      let photoUrl = null
      if (photoFile) {
        try {
          photoUrl = await uploadImageToStorage(photoFile, 'committee', 600)
        } catch (uploadErr) {
          console.warn('Photo upload fallback to preview:', uploadErr)
          photoUrl = photoPreview
        }
      }

      const payload = {
        name: cleanName,
        role: cleanRole,
        phone: cleanPhone,
        blood_group: cleanBlood,
        area: cleanArea,
        notes: cleanNotes,
        photo_url: photoUrl
      }

      const err = await add('committee_members', payload)

      if (err) {
        toast.error(err.message || 'Could not add member.')
      } else {
        toast.success(`🎉 Appointed ${cleanName} as ${cleanRole}!`)
        setName('')
        setRole('')
        setPhone('')
        setBloodGroup('')
        setArea('')
        setNotes('')
        setPhotoFile(null)
        setPhotoPreview('')
        setIsAddModalOpen(false)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to appoint member.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault()
    if (!editingMember) return

    const cleanName = (name || '').trim()
    const cleanRole = (role || '').trim()
    const cleanPhone = (phone || '').trim()
    const cleanNotes = (notes || '').trim()
    const cleanBlood = (bloodGroup || '').trim()
    const cleanArea = (area || '').trim()

    if (!cleanName || !cleanRole) {
      toast.error('Name and Role are required.')
      return
    }

    setIsSaving(true)
    try {
      let photoUrl = editingMember.photo_url
      if (photoFile) {
        try {
          photoUrl = await uploadImageToStorage(photoFile, 'committee', 600)
        } catch {
          photoUrl = photoPreview
        }
      }

      const err = await update('committee_members', editingMember.id, {
        name: cleanName,
        role: cleanRole,
        phone: cleanPhone,
        blood_group: cleanBlood,
        area: cleanArea,
        notes: cleanNotes,
        photo_url: photoUrl
      })

      if (err) {
        toast.error(err.message || 'Could not update member.')
      } else {
        toast.success(`Updated ${cleanName}'s profile.`)
        setEditingMember(null)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update member.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (m) => {
    if (window.confirm(`Are you sure you want to remove ${m.name} from committee?`)) {
      const err = await remove('committee_members', m.id)
      if (err) toast.error(err.message || 'Could not remove member.')
      else toast.success(`Removed ${m.name}.`)
    }
  }

  const handleSendWhatsApp = (m) => {
    const msg = getCommitteeInviteText(m, villageName)
    openWhatsAppMessage(m.phone, msg)
  }

  return (
    <>
      <Card
        title="Committee Office Bearers"
        action={
          <Button onClick={handleOpenAdd}>
            ➕ Add Member
          </Button>
        }
      >
        <div className="id-card-grid">
          {members.map((m, idx) => (
            <article className="official-id-card" key={m.id}>
              {/* Top Lanyard Slot & ID Header Banner */}
              <div className="id-card-top-header">
                <div className="id-lanyard-slot" />
                <div className="id-card-banner">
                  <span className="id-card-org-title">ॐ {villageName}</span>
                  <span className="id-card-badge-type">OFFICIAL SEVAK PASS</span>
                </div>
              </div>

              {/* ID Portrait Photo with Golden Double Ring */}
              <div className="id-card-photo-wrapper">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="id-card-portrait-img" />
                ) : (
                  <div className="id-card-portrait-fallback">
                    <span>{(m.name || 'M').charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="id-card-pass-number">
                  PASS #{String(idx + 1).padStart(3, '0')}
                </div>
              </div>

              {/* Identity Info */}
              <div className="id-card-body">
                <h3 className="id-card-name">{m.name}</h3>
                <div className="id-card-role-chip">{m.role}</div>

                <div className="id-card-details-grid">
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="id-card-info-item phone">
                      <span className="id-info-icon">📞</span>
                      <span className="id-info-val">{m.phone}</span>
                    </a>
                  )}
                  {m.blood_group && (
                    <div className="id-card-info-item blood">
                      <span className="id-info-icon">🩸</span>
                      <span className="id-info-val">{m.blood_group}</span>
                    </div>
                  )}
                  {m.area && (
                    <div className="id-card-info-item area">
                      <span className="id-info-icon">📍</span>
                      <span className="id-info-val">{m.area}</span>
                    </div>
                  )}
                </div>

                {m.notes && (
                  <div className="id-card-notes-box">
                    📝 {m.notes}
                  </div>
                )}
              </div>

              {/* ID Card Action Bar */}
              <div className="id-card-footer-actions">
                {m.phone && (
                  <button
                    type="button"
                    className="id-btn-wa"
                    onClick={() => handleSendWhatsApp(m)}
                    title="Send WhatsApp appointment notice"
                  >
                    📲 WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  className="id-btn-badge"
                  onClick={() => setSelectedMemberForId(m)}
                  title="Generate Official Committee ID Card"
                >
                  🪪 ID Card
                </button>
                <button
                  type="button"
                  className="id-btn-cert"
                  onClick={() => setSelectedTemplateItem(m)}
                  title="Generate Sevak Certificate"
                >
                  📜 Certificate
                </button>

                <div className="id-btn-admin-group">
                  <button
                    type="button"
                    className="id-icon-btn edit"
                    onClick={() => handleOpenEdit(m)}
                    title="Edit Member"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="id-icon-btn delete"
                    onClick={() => handleDelete(m)}
                    title="Delete Member"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!members.length && (
          <Empty text="No committee members added yet. Click 'Add Member' above to appoint office bearers." />
        )}
      </Card>

      {/* Add Member Modal Popup (Opens cleanly when clicking Add Member) */}
      {/* Add Member Modal Popup (Opens cleanly when clicking Add Member) */}
      {isAddModalOpen && (
        <Modal
          title="Appoint Committee Member"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>👤 Full Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>👑 Committee Role / Designation</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. President, Vice President, Treasurer"
                required
              />
              <div className="role-preset-chips">
                {POPULAR_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-chip ${role === r ? 'selected' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r}
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
                  <span>🩸 Blood Group</span>
                </label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="">Select (Optional)</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📍 Colony / Street / Ward</span>
              </label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Main Road, Ward 4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📝 Responsibilities & Notes</span>
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Stage arrangement, Pooja coordinator"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📸 Member Portrait Photo</span>
              </label>
              
              {!photoPreview ? (
                <div className="custom-photo-uploader">
                  <span style={{ fontSize: '1.5rem' }}>📷</span>
                  <div className="photo-uploader-input-wrap">
                    <button type="button" className="btn-custom-upload">
                      <span>📁 Choose Member Photo</span>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="photo-hidden-input"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                  <small style={{ color: '#64748b' }}>Supports JPG, PNG (automatically creates official Pass badge)</small>
                </div>
              ) : (
                <div className="photo-preview-card">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="photo-preview-avatar"
                  />
                  <div className="photo-preview-meta">
                    <b>✓ Portrait Photo Selected</b>
                    <small>Auto-syncs to cloud & ID card</small>
                  </div>
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview('')
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Appoint Member'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <Modal
          title="Edit Committee Member"
          onClose={() => setEditingMember(null)}
        >
          <form onSubmit={handleSaveEdit} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>👤 Full Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>👑 Committee Role / Designation</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
              <div className="role-preset-chips">
                {POPULAR_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-chip ${role === r ? 'selected' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r}
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
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>🩸 Blood Group</span>
                </label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="">Select (Optional)</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📍 Colony / Street / Ward</span>
              </label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📝 Responsibilities & Notes</span>
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📸 Member Portrait Photo</span>
              </label>
              
              {!photoPreview ? (
                <div className="custom-photo-uploader">
                  <span style={{ fontSize: '1.5rem' }}>📷</span>
                  <div className="photo-uploader-input-wrap">
                    <button type="button" className="btn-custom-upload">
                      <span>📁 Choose Member Photo</span>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="photo-hidden-input"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                  <small style={{ color: '#64748b' }}>Supports JPG, PNG</small>
                </div>
              ) : (
                <div className="photo-preview-card">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="photo-preview-avatar"
                  />
                  <div className="photo-preview-meta">
                    <b>✓ Photo Available</b>
                    <small>Auto-syncs to cloud & ID card</small>
                  </div>
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview('')
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Updating…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ID Card Modal */}
      {selectedMemberForId && (
        <IdCardModal
          member={selectedMemberForId}
          settings={settings}
          onClose={() => setSelectedMemberForId(null)}
        />
      )}

      {/* Certificate Modal */}
      {selectedTemplateItem && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedTemplateItem)}
          onClose={() => setSelectedTemplateItem(null)}
          record={selectedTemplateItem}
          type="committee"
          settings={settings}
          admin={admin}
        />
      )}
    </>
  )
}
