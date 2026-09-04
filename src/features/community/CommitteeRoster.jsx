import React, { useState } from 'react'
import { Card, Empty, Button, Modal } from '../../components/ui'
import { IdCardModal } from '../../components/IdCardModal'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { uploadImageToStorage } from '../../lib/storage'
import { getCommitteeInviteText, openWhatsAppMessage } from '../../lib/notifications'
import { useToast } from '../../context/ToastContext'

export function CommitteeRoster({
  members = [],
  settings = {},
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()
  const villageName = settings.village_name || 'Vinayaka Vedika'

  const [selectedMemberForId, setSelectedMemberForId] = useState(null)
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  // Form states
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
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
    setNotes(m.notes || '')
    setPhotoPreview(m.photo_url || '')
    setPhotoFile(null)
  }

  const handleSaveAdd = async (e) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) {
      toast.error('Please enter member name and role.')
      return
    }

    setIsSaving(true)
    try {
      let photoUrl = null
      if (photoFile) {
        try {
          photoUrl = await uploadImageToStorage(photoFile, 'committee', 600)
        } catch {
          photoUrl = photoPreview
        }
      }

      const err = await add('committee_members', {
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        photo_url: photoUrl
      })

      if (err) {
        toast.error(err.message || 'Could not add member.')
      } else {
        toast.success(`Appointed ${name} as ${role}!`)
        setIsAddModalOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingMember) return

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
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        photo_url: photoUrl
      })

      if (err) {
        toast.error(err.message || 'Could not update member.')
      } else {
        toast.success(`Updated ${name}'s profile.`)
        setEditingMember(null)
      }
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
          admin && (
            <Button onClick={handleOpenAdd}>
              ➕ Add Member
            </Button>
          )
        }
      >
        <div className="committee-grid">
          {members.map((m) => (
            <article className="committee-card" key={m.id}>
              <div className="committee-avatar">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="avatar-img" />
                ) : (
                  <span className="avatar-placeholder">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="committee-info">
                <h4 className="committee-name">{m.name}</h4>
                <span className="committee-role-badge">{m.role}</span>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="committee-phone">
                    📞 {m.phone}
                  </a>
                )}
                {m.notes && <small className="committee-notes">{m.notes}</small>}
              </div>

              <div className="committee-card-actions">
                <button
                  type="button"
                  className="committee-action-btn wa"
                  onClick={() => handleSendWhatsApp(m)}
                  title="Send WhatsApp appointment notice"
                >
                  📲 WhatsApp
                </button>
                <button
                  type="button"
                  className="committee-action-btn id"
                  onClick={() => setSelectedMemberForId(m)}
                  title="Generate Official Committee ID Card"
                >
                  🪪 ID Card
                </button>
                <button
                  type="button"
                  className="committee-action-btn id"
                  onClick={() => setSelectedTemplateItem(m)}
                  title="Generate Sevak Certificate"
                >
                  📜 Certificate
                </button>

                {admin && (
                  <div className="committee-admin-group">
                    <button
                      type="button"
                      className="committee-action-icon"
                      onClick={() => handleOpenEdit(m)}
                      title="Edit Member"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="committee-action-icon"
                      onClick={() => handleDelete(m)}
                      title="Delete Member"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {!members.length && (
          <Empty text="No committee members added yet. Click 'Add Member' above to appoint members." />
        )}
      </Card>

      {/* Add Member Modal Popup (Opens cleanly when clicking Add Member) */}
      {isAddModalOpen && (
        <Modal
          title="Add Committee Member"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>
            <div className="form-group">
              <label>Committee Role *</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. President, Vice President, Treasurer, Secretary"
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile / WhatsApp Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="form-group">
              <label>Responsibilities / Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Stage arrangement, Pooja coordinator"
              />
            </div>
            <div className="form-group">
              <label>Profile Photo (Optional)</label>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} />
              {photoPreview && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Appoint Member'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
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
              <label>Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile / WhatsApp Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Responsibilities / Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Update Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} />
              {photoPreview && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Updating…' : 'Save Changes'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setEditingMember(null)}>
                Cancel
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
