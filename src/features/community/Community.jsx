import { useState } from 'react'
import { Card, Empty, Form, Button, Modal, ConfirmModal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { IdCardModal } from '../../components/IdCardModal'
import { uploadImageToStorage } from '../../lib/storage'
import { fmtDate, today } from '../../lib/formatters'
import {
  getCommitteeInviteText,
  getVolunteerDutyText,
  openWhatsAppMessage,
  sendServerNotification
} from '../../lib/notifications'
import { useToast } from '../../context/ToastContext'

export function Community({ data, admin, add, update, remove }) {
  const { toast } = useToast()
  const settings = data.settings?.[0] || {}
  const villageName = settings.village_name || 'Vinayaka Vedika'

  const committeeMembers = data.committee_members || []
  const volunteers = data.volunteers || []
  const notices = data.notices || []

  // Add Member State & Modal
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [notifyViaWhatsApp, setNotifyViaWhatsApp] = useState(true)
  const [isAddingMember, setIsAddingMember] = useState(false)

  // View ID Badge Modal State
  const [selectedMemberForId, setSelectedMemberForId] = useState(null)

  // Edit Member State & Modal
  const [editingMember, setEditingMember] = useState(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [isUpdatingMember, setIsUpdatingMember] = useState(false)

  // Add Volunteer State
  const [volName, setVolName] = useState('')
  const [volDuty, setVolDuty] = useState('')
  const [volDate, setVolDate] = useState(today())
  const [volContact, setVolContact] = useState('')
  const [volNotifyWhatsApp, setVolNotifyWhatsApp] = useState(true)
  const [isAddingVolunteer, setIsAddingVolunteer] = useState(false)

  // Edit Volunteer State
  const [editingVolunteer, setEditingVolunteer] = useState(null)
  const [editVolName, setEditVolName] = useState('')
  const [editVolDuty, setEditVolDuty] = useState('')
  const [editVolDate, setEditVolDate] = useState(today())
  const [editVolContact, setEditVolContact] = useState('')
  const [isUpdatingVolunteer, setIsUpdatingVolunteer] = useState(false)

  // Notice Fields
  const noticeFields = [
    { name: 'message', label: 'Notice Message', type: 'textarea', required: true, placeholder: 'Write the announcement here...' },
    { name: 'pinned', label: 'Pin this notice to top of Overview', type: 'checkbox' }
  ]

  // Photo handlers
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleEditPhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditPhotoFile(file)
    setEditPhotoPreview(URL.createObjectURL(file))
  }

  const handleSendMemberWhatsApp = (member) => {
    const message = getCommitteeInviteText(member, villageName)
    const opened = openWhatsAppMessage(member.phone, message)
    if (opened) {
      toast.success(`WhatsApp opened to notify ${member.name}!`)
    } else {
      toast.error('Invalid phone number for WhatsApp.')
    }
  }

  const handleSendVolunteerWhatsApp = (volunteer) => {
    const message = getVolunteerDutyText(volunteer, villageName)
    const opened = openWhatsAppMessage(volunteer.contact, message)
    if (opened) {
      toast.success(`WhatsApp opened to notify ${volunteer.name}!`)
    } else {
      toast.error('Invalid phone number for WhatsApp.')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!name.trim() || !role.trim() || !phone.trim()) {
      toast.error('Please enter name, role, and phone number.')
      return
    }

    setIsAddingMember(true)
    try {
      let photoUrl = null
      if (photoFile) {
        photoUrl = await uploadImageToStorage(photoFile, 'committee', 600)
      }

      const payload = {
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        photo_url: photoUrl
      }

      const err = await add('committee_members', payload)
      if (err) throw err

      toast.success(`Added ${name.trim()} to the committee!`)

      if (notifyViaWhatsApp) {
        const inviteText = getCommitteeInviteText(payload, villageName)
        openWhatsAppMessage(phone.trim(), inviteText)
        sendServerNotification({
          phone: phone.trim(),
          message: inviteText,
          template: 'committee_invite'
        })
      }

      // Reset form & close modal
      setName('')
      setRole('')
      setPhone('')
      setPhotoFile(null)
      setPhotoPreview('')
      setIsAddMemberModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to add committee member.')
    } finally {
      setIsAddingMember(false)
    }
  }

  const openEditMemberModal = (member) => {
    setEditingMember(member)
    setEditName(member.name || '')
    setEditRole(member.role || '')
    setEditPhone(member.phone || '')
    setEditPhotoPreview(member.photo_url || '')
    setEditPhotoFile(null)
  }

  const handleSaveEditMember = async (e) => {
    e.preventDefault()
    if (!editingMember) return

    setIsUpdatingMember(true)
    try {
      let photoUrl = editingMember.photo_url || null
      if (editPhotoFile) {
        photoUrl = await uploadImageToStorage(editPhotoFile, 'committee', 600)
      }

      const payload = {
        name: editName.trim(),
        role: editRole.trim(),
        phone: editPhone.trim(),
        photo_url: photoUrl
      }

      const err = await update('committee_members', editingMember.id, payload)
      if (err) throw err

      toast.success(`Updated ${editName.trim()}'s details.`)
      setEditingMember(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update member.')
    } finally {
      setIsUpdatingMember(false)
    }
  }

  const handleDeleteMember = async (id) => {
    const err = await remove('committee_members', id)
    if (err) {
      toast.error(err.message || 'Failed to delete committee member.')
    } else {
      toast.success('Committee member removed.')
    }
  }

  // Volunteer handlers
  const handleAddVolunteer = async (e) => {
    e.preventDefault()
    if (!volName.trim() || !volDuty.trim() || !volDate) {
      toast.error('Please enter volunteer name, duty, and date.')
      return
    }

    setIsAddingVolunteer(true)
    try {
      const payload = {
        name: volName.trim(),
        duty: volDuty.trim(),
        date: volDate,
        contact: volContact.trim() || null
      }

      const err = await add('volunteers', payload)
      if (err) throw err

      toast.success(`Added volunteer ${volName.trim()} to roster!`)

      if (volNotifyWhatsApp && volContact.trim()) {
        const dutyText = getVolunteerDutyText(payload, villageName)
        openWhatsAppMessage(volContact.trim(), dutyText)
        sendServerNotification({
          phone: volContact.trim(),
          message: dutyText,
          template: 'volunteer_duty'
        })
      }

      setVolName('')
      setVolDuty('')
      setVolDate(today())
      setVolContact('')
    } catch (err) {
      toast.error(err.message || 'Failed to add volunteer.')
    } finally {
      setIsAddingVolunteer(false)
    }
  }

  const openEditVolunteerModal = (v) => {
    setEditingVolunteer(v)
    setEditVolName(v.name || '')
    setEditVolDuty(v.duty || '')
    setEditVolDate(v.date || today())
    setEditVolContact(v.contact || '')
  }

  const handleSaveEditVolunteer = async (e) => {
    e.preventDefault()
    if (!editingVolunteer) return

    setIsUpdatingVolunteer(true)
    try {
      const payload = {
        name: editVolName.trim(),
        duty: editVolDuty.trim(),
        date: editVolDate,
        contact: editVolContact.trim() || null
      }

      const err = await update('volunteers', editingVolunteer.id, payload)
      if (err) throw err

      toast.success(`Updated volunteer ${editVolName.trim()}.`)
      setEditingVolunteer(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update volunteer.')
    } finally {
      setIsUpdatingVolunteer(false)
    }
  }

  const handleDeleteVolunteer = async (id) => {
    const err = await remove('volunteers', id)
    if (err) {
      toast.error(err.message || 'Failed to delete volunteer.')
    } else {
      toast.success('Volunteer removed.')
    }
  }

  // Notice handlers
  const handleAddNotice = async (values) => {
    const payload = {
      ...values,
      date: today()
    }
    const err = await add('notices', payload)
    if (err) {
      toast.error(err.message || 'Failed to publish notice.')
    } else {
      toast.success(
        values.pinned
          ? '📌 Notice published & pinned to the top of Overview!'
          : 'Notice published successfully!'
      )
    }
  }

  const handleUpdateNotice = async (id, values) => {
    const err = await update('notices', id, values)
    if (err) {
      toast.error(err.message || 'Failed to update notice.')
    } else {
      toast.success('Notice updated successfully.')
    }
  }

  const handleDeleteNotice = async (id) => {
    const err = await remove('notices', id)
    if (err) {
      toast.error(err.message || 'Failed to delete notice.')
    } else {
      toast.success('Notice deleted.')
    }
  }

  return (
    <>
      {/* Committee Members — Matching User Screenshot */}
      <Card
        title="Committee Members"
        action={
          admin && (
            <button
              type="button"
              className="add-member-header-btn"
              onClick={() => setIsAddMemberModalOpen(true)}
            >
              + Add Member
            </button>
          )
        }
      >
        <div className="committee-members-grid">
          {committeeMembers.map((member) => (
            <article className="committee-card" key={member.id}>
              <div className="committee-avatar-wrapper">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="committee-avatar-img"
                  />
                ) : (
                  <div className="committee-avatar-fallback">
                    {member.name?.[0]?.toUpperCase() || 'ॐ'}
                  </div>
                )}
              </div>

              <h3 className="committee-name">{member.name}</h3>
              <p className="committee-role">{member.role}</p>
              <a href={`tel:${member.phone}`} className="committee-phone">
                {member.phone}
              </a>

              <div className="committee-card-actions">
                <button
                  type="button"
                  className="committee-action-btn id"
                  onClick={() => setSelectedMemberForId(member)}
                  title="View, download, or share official ID Badge"
                >
                  🆔 ID Badge
                </button>
                <button
                  type="button"
                  className="committee-action-btn wa"
                  onClick={() => handleSendMemberWhatsApp(member)}
                  title={`Send WhatsApp notification to ${member.name}`}
                >
                  💬 WhatsApp
                </button>

                {admin && (
                  <div className="committee-admin-group">
                    <button
                      type="button"
                      className="committee-action-icon edit"
                      onClick={() => openEditMemberModal(member)}
                      title={`Edit ${member.name}`}
                    >
                      ✏️
                    </button>
                    <RecordActions
                      record={member}
                      onDelete={() => handleDeleteMember(member.id)}
                      deleteTitle="Remove Committee Member"
                      deleteMessage={`Are you sure you want to remove ${member.name} from the committee directory?`}
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {!committeeMembers.length && (
          <Empty>No committee members added yet. Click "+ Add Member" to get started.</Empty>
        )}
      </Card>

      {/* Volunteer Roster */}
      <Card title="Volunteer Roster">
        <p className="muted">Volunteers dedicated to seva and service during the festivities.</p>
        <div className="records-list">
          {volunteers.map((v) => (
            <div className="volunteer-row" key={v.id}>
              <div>
                <b>{v.name}</b> — <span>{v.duty}</span>
                <small>
                  📅 {fmtDate(v.date)}
                  {v.contact && ` · 📞 ${v.contact}`}
                </small>
              </div>

              <div className="record-actions-group">
                {v.contact && (
                  <Button
                    type="button"
                    kind="whatsapp-action"
                    size="small"
                    onClick={() => handleSendVolunteerWhatsApp(v)}
                    title={`Send WhatsApp duty notification to ${v.name}`}
                  >
                    <span className="action-icon">💬</span>
                    <span className="action-label">WhatsApp</span>
                  </Button>
                )}

                {admin && (
                  <>
                    <Button
                      type="button"
                      kind="edit-action"
                      size="small"
                      onClick={() => openEditVolunteerModal(v)}
                      title={`Edit volunteer ${v.name}`}
                    >
                      <span className="action-icon" aria-hidden="true">✏</span>
                      <span className="action-label">Edit</span>
                    </Button>
                    <RecordActions
                      record={v}
                      onDelete={() => handleDeleteVolunteer(v.id)}
                      deleteTitle="Remove Volunteer"
                      deleteMessage={`Are you sure you want to remove volunteer ${v.name}?`}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {!volunteers.length && (
          <Empty>Volunteers will appear here once duties are assigned.</Empty>
        )}

        {admin && (
          <div style={{ marginTop: '24px' }}>
            <h4>Add Volunteer</h4>
            <form className="form" onSubmit={handleAddVolunteer}>
              <label>
                <span>Volunteer Name <span className="req-star">*</span></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh V."
                  value={volName}
                  disabled={isAddingVolunteer}
                  onChange={(e) => setVolName(e.target.value)}
                />
              </label>

              <label>
                <span>Duty / Responsibility <span className="req-star">*</span></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage Setup, Prasad Distribution"
                  value={volDuty}
                  disabled={isAddingVolunteer}
                  onChange={(e) => setVolDuty(e.target.value)}
                />
              </label>

              <label>
                <span>Duty Date <span className="req-star">*</span></span>
                <input
                  type="date"
                  required
                  value={volDate}
                  disabled={isAddingVolunteer}
                  onChange={(e) => setVolDate(e.target.value)}
                />
              </label>

              <label>
                <span>Contact Phone (optional)</span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={volContact}
                  disabled={isAddingVolunteer}
                  onChange={(e) => setVolContact(e.target.value)}
                />
              </label>

              <label className="checkbox-field" style={{ gridColumn: 'span 2' }}>
                <input
                  type="checkbox"
                  checked={volNotifyWhatsApp}
                  disabled={isAddingVolunteer || !volContact.trim()}
                  onChange={(e) => setVolNotifyWhatsApp(e.target.checked)}
                />
                <span>📱 Automatically open WhatsApp to notify volunteer of duty</span>
              </label>

              <div className="form-actions" style={{ gridColumn: 'span 2' }}>
                <Button type="submit" disabled={isAddingVolunteer}>
                  {isAddingVolunteer ? 'Adding…' : 'Add to Roster'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Notices & Announcements */}
      <Card title="Notices & Announcements">
        {admin ? (
          <>
            <Form
              submit="Publish Notice"
              onSubmit={handleAddNotice}
              fields={noticeFields}
            />
            <p className="muted" style={{ marginTop: '14px' }}>
              Published notices appear immediately on the Overview screen for everyone.
            </p>
          </>
        ) : (
          <p className="muted">
            Check the Overview tab for all current notices and announcements.
          </p>
        )}

        {admin && notices.length > 0 && (
          <div className="admin-notices-list">
            <h4>Published Notices ({notices.length})</h4>
            {notices.map((n) => (
              <div className="notice-row" key={n.id}>
                <div>
                  <span>{n.pinned ? '📌 ' : ''}{n.message}</span>
                  <small>{fmtDate(n.date)}</small>
                </div>
                <div className="record-actions-group">
                  <Button
                    type="button"
                    kind={n.pinned ? 'pinned-action' : 'pinned-toggle-btn'}
                    size="small"
                    onClick={async () => {
                      const nextPinned = !n.pinned
                      const err = await update('notices', n.id, { ...n, pinned: nextPinned })
                      if (err) toast.error(err.message || 'Failed to update pin')
                      else toast.success(nextPinned ? '📌 Notice pinned to top of Overview!' : 'Notice unpinned.')
                    }}
                    title={n.pinned ? 'Unpin notice from top' : 'Pin notice to top of Overview'}
                  >
                    <span>{n.pinned ? '📌 Unpin' : '📍 Pin'}</span>
                  </Button>
                  <RecordActions
                    record={n}
                    fields={noticeFields}
                    onSave={(values) => handleUpdateNotice(n.id, values)}
                    onDelete={() => handleDeleteNotice(n.id)}
                    deleteTitle="Delete Notice"
                    deleteMessage="Are you sure you want to delete this notice?"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <Modal
          isOpen={isAddMemberModalOpen}
          onClose={() => !isAddingMember && setIsAddMemberModalOpen(false)}
          title="Add Committee Member"
          maxWidth="500px"
        >
          <form className="form" onSubmit={handleAddMember}>
            <div className="member-photo-picker-section" style={{ gridColumn: 'span 2' }}>
              <div className="avatar-preview-box">
                {photoPreview ? (
                  <img src={photoPreview} alt="Selected preview" className="avatar-preview-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {name.trim() ? name.trim()[0].toUpperCase() : '📷'}
                  </div>
                )}
              </div>
              <label className="photo-file-btn">
                <span>📁 Select Member Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isAddingMember}
                  onChange={handlePhotoSelect}
                />
              </label>
              {photoFile && (
                <button
                  type="button"
                  className="remove-selected-photo"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview('')
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Member Name <span className="req-star">*</span></span>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                disabled={isAddingMember}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Role / Designation <span className="req-star">*</span></span>
              <input
                type="text"
                required
                placeholder="e.g. President, Treasurer, Secretary, Coordinator"
                value={role}
                disabled={isAddingMember}
                onChange={(e) => setRole(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Phone Number <span className="req-star">*</span></span>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                disabled={isAddingMember}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className="checkbox-field" style={{ gridColumn: 'span 2' }}>
              <input
                type="checkbox"
                checked={notifyViaWhatsApp}
                disabled={isAddingMember}
                onChange={(e) => setNotifyViaWhatsApp(e.target.checked)}
              />
              <span>📱 Send appointment & role notification via WhatsApp</span>
            </label>

            <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
              <Button
                type="button"
                kind="secondary"
                disabled={isAddingMember}
                onClick={() => setIsAddMemberModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingMember}>
                {isAddingMember ? 'Adding…' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Committee Member Modal */}
      {editingMember && (
        <Modal
          isOpen={Boolean(editingMember)}
          onClose={() => !isUpdatingMember && setEditingMember(null)}
          title={`Edit ${editingMember.name}`}
          maxWidth="500px"
        >
          <form className="form" onSubmit={handleSaveEditMember}>
            <div className="member-photo-picker-section" style={{ gridColumn: 'span 2' }}>
              <div className="avatar-preview-box">
                {editPhotoPreview ? (
                  <img src={editPhotoPreview} alt="Selected preview" className="avatar-preview-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {editName.trim() ? editName.trim()[0].toUpperCase() : '📷'}
                  </div>
                )}
              </div>
              <label className="photo-file-btn">
                <span>📁 Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUpdatingMember}
                  onChange={handleEditPhotoSelect}
                />
              </label>
              {editPhotoPreview && (
                <button
                  type="button"
                  className="remove-selected-photo"
                  onClick={() => {
                    setEditPhotoFile(null)
                    setEditPhotoPreview('')
                  }}
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Member Name <span className="req-star">*</span></span>
              <input
                type="text"
                required
                value={editName}
                disabled={isUpdatingMember}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Role / Designation <span className="req-star">*</span></span>
              <input
                type="text"
                required
                value={editRole}
                disabled={isUpdatingMember}
                onChange={(e) => setEditRole(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Phone Number <span className="req-star">*</span></span>
              <input
                type="tel"
                required
                value={editPhone}
                disabled={isUpdatingMember}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </label>

            <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
              <Button
                type="button"
                kind="secondary"
                disabled={isUpdatingMember}
                onClick={() => setEditingMember(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingMember}>
                {isUpdatingMember ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Volunteer Modal */}
      {editingVolunteer && (
        <Modal
          isOpen={Boolean(editingVolunteer)}
          onClose={() => !isUpdatingVolunteer && setEditingVolunteer(null)}
          title={`Edit Volunteer ${editingVolunteer.name}`}
          maxWidth="500px"
        >
          <form className="form" onSubmit={handleSaveEditVolunteer}>
            <label style={{ gridColumn: 'span 2' }}>
              <span>Volunteer Name <span className="req-star">*</span></span>
              <input
                type="text"
                required
                value={editVolName}
                disabled={isUpdatingVolunteer}
                onChange={(e) => setEditVolName(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Duty / Responsibility <span className="req-star">*</span></span>
              <input
                type="text"
                required
                value={editVolDuty}
                disabled={isUpdatingVolunteer}
                onChange={(e) => setEditVolDuty(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Duty Date <span className="req-star">*</span></span>
              <input
                type="date"
                required
                value={editVolDate}
                disabled={isUpdatingVolunteer}
                onChange={(e) => setEditVolDate(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Contact Phone (optional)</span>
              <input
                type="tel"
                value={editVolContact}
                disabled={isUpdatingVolunteer}
                onChange={(e) => setEditVolContact(e.target.value)}
              />
            </label>

            <div className="modal-actions" style={{ gridColumn: 'span 2' }}>
              <Button
                type="button"
                kind="secondary"
                disabled={isUpdatingVolunteer}
                onClick={() => setEditingVolunteer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingVolunteer}>
                {isUpdatingVolunteer ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Committee Member ID Card Modal */}
      {selectedMemberForId && (
        <IdCardModal
          isOpen={Boolean(selectedMemberForId)}
          onClose={() => setSelectedMemberForId(null)}
          member={selectedMemberForId}
          settings={settings}
        />
      )}
    </>
  )
}
