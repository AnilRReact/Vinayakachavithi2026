import { useState, useMemo } from 'react'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { uploadImageToStorage } from '../../lib/storage'
import { useToast } from '../../context/ToastContext'

export function Recognition({ data, admin, add, update, remove, refresh }) {
  const { toast } = useToast()
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null)
  const [hasVoted, setHasVoted] = useState(() => {
    try {
      return sessionStorage.getItem('vv-voted') === 'yes'
    } catch {
      return false
    }
  })
  const [votingId, setVotingId] = useState(null)

  // Add Nominee State
  const [isAddNomineeOpen, setIsAddNomineeOpen] = useState(false)
  const [nomineeName, setNomineeName] = useState('')
  const [nomineeNote, setNomineeNote] = useState('')
  const [nomineePhotoFile, setNomineePhotoFile] = useState(null)
  const [nomineePhotoPreview, setNomineePhotoPreview] = useState('')
  const [isAddingNominee, setIsAddingNominee] = useState(false)

  // Add Award State
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false)
  const [awardTitle, setAwardTitle] = useState('')
  const [awardRecipient, setAwardRecipient] = useState('')
  const [awardYear, setAwardYear] = useState(new Date().getFullYear())
  const [awardNote, setAwardNote] = useState('')
  const [isAddingAward, setIsAddingAward] = useState(false)

  // Edit Nominee State
  const [editingNominee, setEditingNominee] = useState(null)
  const [editNomineeName, setEditNomineeName] = useState('')
  const [editNomineeNote, setEditNomineeNote] = useState('')
  const [editNomineePhotoFile, setEditNomineePhotoFile] = useState(null)
  const [editNomineePhotoPreview, setEditNomineePhotoPreview] = useState('')
  const [isUpdatingNominee, setIsUpdatingNominee] = useState(false)

  const awardsList = data.awards || []
  const nomineesList = data.nominees || []

  const sortedAwards = useMemo(() => {
    return [...awardsList].sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
  }, [awardsList])

  const totalVotes = useMemo(() => {
    return nomineesList.reduce((sum, n) => sum + Number(n.votes || 0), 0)
  }, [nomineesList])

  const awardFields = [
    { name: 'title', label: 'Award / Category', required: true, placeholder: 'e.g. Best Pooja Aarti, Cleanest Pandal, Seva Ratna' },
    { name: 'recipient', label: 'Recipient Name / Team', required: true, placeholder: 'e.g. Youth Association, G. Venu' },
    { name: 'year', label: 'Year', type: 'number', default: new Date().getFullYear(), required: true },
    { name: 'note', label: 'Note / Citation', placeholder: 'Special recognition citation...' }
  ]

  const handleNomineePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNomineePhotoFile(file)
    setNomineePhotoPreview(URL.createObjectURL(file))
  }

  const handleEditNomineePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditNomineePhotoFile(file)
    setEditNomineePhotoPreview(URL.createObjectURL(file))
  }

  const handleAddNominee = async (e) => {
    if (e) e.preventDefault()
    if (!nomineeName.trim()) {
      toast.error('Please enter the pandal name.')
      return
    }

    setIsAddingNominee(true)
    try {
      let photoUrl = null
      if (nomineePhotoFile) {
        try {
          photoUrl = await uploadImageToStorage(nomineePhotoFile, 'nominees', 800)
        } catch {
          photoUrl = nomineePhotoPreview
        }
      }

      const err = await add('nominees', {
        name: nomineeName.trim(),
        note: nomineeNote.trim() || null,
        photo_url: photoUrl,
        votes: 0
      })

      if (err) throw err

      toast.success('Pandal nominee added to poll!')
      setNomineeName('')
      setNomineeNote('')
      setNomineePhotoFile(null)
      setNomineePhotoPreview('')
      setIsAddNomineeOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to add nominee.')
    } finally {
      setIsAddingNominee(false)
    }
  }

  const handleAddAward = async (e) => {
    if (e) e.preventDefault()
    const cleanTitle = awardTitle.trim()
    const cleanRecipient = awardRecipient.trim()

    if (!cleanTitle || !cleanRecipient) {
      toast.error('Please enter award title and recipient name.')
      return
    }

    setIsAddingAward(true)
    try {
      const err = await add('awards', {
        title: cleanTitle,
        recipient: cleanRecipient,
        year: Number(awardYear) || new Date().getFullYear(),
        note: (awardNote || '').trim()
      })

      if (err) throw err

      toast.success(`Recorded award "${cleanTitle}" for ${cleanRecipient}!`)
      setAwardTitle('')
      setAwardRecipient('')
      setAwardNote('')
      setIsAddAwardOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to record award.')
    } finally {
      setIsAddingAward(false)
    }
  }

  const openEditNomineeModal = (nominee) => {
    setEditingNominee(nominee)
    setEditNomineeName(nominee.name || '')
    setEditNomineeNote(nominee.note || '')
    setEditNomineePhotoFile(null)
    setEditNomineePhotoPreview(nominee.photo_url || '')
  }

  const handleUpdateNominee = async (e) => {
    if (e) e.preventDefault()
    if (!editingNominee) return

    setIsUpdatingNominee(true)
    try {
      let photoUrl = editingNominee.photo_url
      if (editNomineePhotoFile) {
        photoUrl = await uploadImageToStorage(editNomineePhotoFile, 'nominees', 800)
      }

      const err = await update('nominees', editingNominee.id, {
        name: editNomineeName.trim(),
        note: editNomineeNote.trim() || null,
        photo_url: photoUrl
      })

      if (err) throw err

      toast.success('Pandal nominee updated.')
      setEditingNominee(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update nominee.')
    } finally {
      setIsUpdatingNominee(false)
    }
  }

  const handleVote = async (nominee) => {
    if (hasVoted) {
      toast.info('You have already voted in this session. Thank you!')
      return
    }

    setVotingId(nominee.id)
    try {
      const newVotes = Number(nominee.votes || 0) + 1
      await update('nominees', nominee.id, {
        ...nominee,
        votes: newVotes
      })

      try {
        sessionStorage.setItem('vv-voted', 'yes')
      } catch {}
      setHasVoted(true)
      toast.success(`Vote recorded for ${nominee.name}! 🙏`)
    } catch (err) {
      toast.error(err.message || 'Failed to submit vote.')
    } finally {
      setVotingId(null)
    }
  }

  return (
    <>
      <Card
        title="Awards & Honors"
        action={
          <Button onClick={() => setIsAddAwardOpen(true)}>
            ➕ Add Award Record
          </Button>
        }
      >
        <p className="muted">
          Honoring exceptional community service, decoration, and cultural contributions.
        </p>

        <div className="awards-list">
          {sortedAwards.map((award) => (
            <article className="award-item" key={award.id}>
              <span className="award-icon" aria-hidden="true">🏆</span>
              <div className="award-content">
                <b>{award.title}</b>
                <span> — {award.recipient} ({award.year})</span>
                {award.note && <small className="award-note">📝 {award.note}</small>}
              </div>

              <div className="award-actions-cell">
                <Button
                  type="button"
                  kind="receipt-action"
                  size="small"
                  onClick={() => setSelectedTemplateItem({ record: award, type: 'award' })}
                  title="View, download image, or share official Seva Puraskar Certificate on Ganesha template"
                >
                  <span className="action-icon">📜</span>
                  <span className="action-label">Certificate</span>
                </Button>

                <RecordActions
                  record={award}
                  fields={awardFields}
                  onSave={(values) =>
                    update('awards', award.id, {
                      ...values,
                      year: Number(values.year)
                    })
                  }
                  onDelete={() => remove('awards', award.id)}
                  deleteTitle="Remove Award"
                  deleteMessage={`Remove award "${award.title}" for ${award.recipient}?`}
                />
              </div>
            </article>
          ))}
        </div>

        {!sortedAwards.length && (
          <Empty>Recognition from the celebration will be recorded here. Click 'Add Award Record' above.</Empty>
        )}
      </Card>

      <Card
        title="Best Pandal Poll"
        action={
          <Button onClick={() => setIsAddNomineeOpen(true)}>
            ➕ Add Pandal Nominee
          </Button>
        }
      >
        <p className="muted">
          Friendly honour-system poll for the village pandals. One vote per visit.
        </p>

        <div className="nominees-grid">
          {nomineesList.map((nominee) => {
            const votes = Number(nominee.votes || 0)
            const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            const isVoting = votingId === nominee.id

            return (
              <article className="nominee-card" key={nominee.id}>
                {nominee.photo_url ? (
                  <img
                    src={nominee.photo_url}
                    alt={nominee.name}
                    className="nominee-photo"
                  />
                ) : (
                  <div className="nominee-photo-placeholder">🪔</div>
                )}

                <div className="nominee-body">
                  <h4>{nominee.name}</h4>
                  {nominee.note && <p className="nominee-note">{nominee.note}</p>}

                  <div className="vote-meter-container">
                    <div className="vote-meter" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small className="vote-stats">
                      <b>{votes}</b> votes ({percent}%)
                    </small>
                  </div>

                  <div className="nominee-button-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <Button
                      type="button"
                      disabled={hasVoted || isVoting}
                      onClick={() => handleVote(nominee)}
                      className="vote-btn"
                      style={{ flex: '1' }}
                    >
                      {isVoting
                        ? 'Voting…'
                        : hasVoted
                        ? '✓ Voted'
                        : 'Vote for this Pandal'}
                    </Button>

                    <Button
                      type="button"
                      kind="receipt-action"
                      size="small"
                      onClick={() => setSelectedTemplateItem({ record: nominee, type: 'nominee' })}
                      title="View, download image, or share Pandal Nominee Card on Ganesha template"
                    >
                      <span className="action-icon">📜</span>
                      <span className="action-label">Nominee Card</span>
                    </Button>
                  </div>
                </div>

                <div className="nominee-admin-actions">
                  <div className="record-actions-group">
                    <Button
                      type="button"
                      kind="edit-action"
                      onClick={() => openEditNomineeModal(nominee)}
                      title={`Edit ${nominee.name}`}
                    >
                      <span className="action-icon" aria-hidden="true">✏</span>
                      <span className="action-label">Edit</span>
                    </Button>
                    <RecordActions
                      record={nominee}
                      onDelete={() => remove('nominees', nominee.id)}
                      deleteTitle="Remove Nominee"
                      deleteMessage={`Remove "${nominee.name}" from the poll?`}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {!nomineesList.length && (
          <Empty>Pandal nominees will be announced here. Click 'Add Pandal Nominee' above.</Empty>
        )}
      </Card>

      {/* Add Award Modal */}
      {isAddAwardOpen && (
        <Modal
          title="Record Award & Honor"
          onClose={() => setIsAddAwardOpen(false)}
        >
          <form onSubmit={handleAddAward} className="member-form">
            <div className="form-group">
              <label>Award / Category Title *</label>
              <input
                value={awardTitle}
                onChange={(e) => setAwardTitle(e.target.value)}
                placeholder="e.g. Best Floral Decoration, Seva Ratna 2026"
                autoFocus
                required
              />
            </div>

            <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Recipient Name / Team *</label>
                <input
                  value={awardRecipient}
                  onChange={(e) => setAwardRecipient(e.target.value)}
                  placeholder="e.g. North Ward Youth Association"
                  required
                />
              </div>

              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  value={awardYear}
                  onChange={(e) => setAwardYear(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Citation / Special Note</label>
              <input
                value={awardNote}
                onChange={(e) => setAwardNote(e.target.value)}
                placeholder="e.g. Outstanding 24/7 seva during Maha Annadanam"
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isAddingAward}>
                {isAddingAward ? 'Saving…' : 'Record Award'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddAwardOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Nominee Modal */}
      {isAddNomineeOpen && (
        <Modal
          title="Add Pandal Nominee"
          onClose={() => setIsAddNomineeOpen(false)}
        >
          <form onSubmit={handleAddNominee} className="member-form">
            <div className="form-group">
              <label>Pandal / Colony Name *</label>
              <input
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                placeholder="e.g. South Colony Youth Mandali"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Theme & Special Highlights</label>
              <textarea
                value={nomineeNote}
                onChange={(e) => setNomineeNote(e.target.value)}
                placeholder="e.g. Eco-friendly clay idol, temple replica lighting..."
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label>Pandal Photo (Optional)</label>
              <input type="file" accept="image/*" onChange={handleNomineePhotoSelect} />
              {nomineePhotoPreview && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={nomineePhotoPreview}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <small style={{ color: '#15803d', fontWeight: '600' }}>✓ Photo selected (auto-uploads to Google Drive)</small>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isAddingNominee}>
                {isAddingNominee ? 'Adding…' : 'Add Nominee'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddNomineeOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Nominee Modal */}
      {editingNominee && (
        <Modal
          isOpen={Boolean(editingNominee)}
          onClose={() => !isUpdatingNominee && setEditingNominee(null)}
          title="Edit Pandal Nominee"
          maxWidth="520px"
        >
          <form className="member-form" onSubmit={handleUpdateNominee}>
            <div className="form-group">
              <label>Pandal / Colony Name *</label>
              <input
                type="text"
                required
                value={editNomineeName}
                disabled={isUpdatingNominee}
                onChange={(e) => setEditNomineeName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Theme & Highlights</label>
              <textarea
                value={editNomineeNote}
                disabled={isUpdatingNominee}
                onChange={(e) => setEditNomineeNote(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label>Update Photo</label>
              <input
                type="file"
                accept="image/*"
                disabled={isUpdatingNominee}
                onChange={handleEditNomineePhotoSelect}
              />
              {editNomineePhotoPreview && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={editNomineePhotoPreview}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isUpdatingNominee}>
                {isUpdatingNominee ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                kind="secondary"
                disabled={isUpdatingNominee}
                onClick={() => setEditingNominee(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Universal Template Modal for Awards & Nominees */}
      {selectedTemplateItem && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedTemplateItem)}
          onClose={() => setSelectedTemplateItem(null)}
          record={selectedTemplateItem.record}
          type={selectedTemplateItem.type}
          settings={data.settings?.[0] || {}}
          admin={admin}
        />
      )}
    </>
  )
}
