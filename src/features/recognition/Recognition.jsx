import { useState, useMemo } from 'react'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { requireSupabase } from '../../lib/supabase'
import { uploadImageToStorage } from '../../lib/storage'
import { useToast } from '../../context/ToastContext'

export function Recognition({ data, admin, add, update, remove, refresh }) {
  const { toast } = useToast()
  const [hasVoted, setHasVoted] = useState(() => {
    try {
      return sessionStorage.getItem('vv-voted') === 'yes'
    } catch {
      return false
    }
  })
  const [votingId, setVotingId] = useState(null)

  // Add Nominee State
  const [nomineeName, setNomineeName] = useState('')
  const [nomineeNote, setNomineeNote] = useState('')
  const [nomineePhotoFile, setNomineePhotoFile] = useState(null)
  const [nomineePhotoPreview, setNomineePhotoPreview] = useState('')
  const [isAddingNominee, setIsAddingNominee] = useState(false)

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
    e.preventDefault()
    if (!nomineeName.trim()) {
      toast.error('Please enter the pandal name.')
      return
    }

    setIsAddingNominee(true)
    try {
      let photoUrl = null
      if (nomineePhotoFile) {
        photoUrl = await uploadImageToStorage(nomineePhotoFile, 'nominees', 800)
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
    } catch (err) {
      toast.error(err.message || 'Failed to add nominee.')
    } finally {
      setIsAddingNominee(false)
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
    e.preventDefault()
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
      const client = requireSupabase()
      const { error } = await client.rpc('cast_nominee_vote', { nominee_id: nominee.id })
      if (error) {
        toast.error(error.message || 'Could not record your vote.')
      } else {
        try {
          sessionStorage.setItem('vv-voted', 'yes')
        } catch {}
        setHasVoted(true)
        toast.success(`Vote recorded for ${nominee.name}! 🙏`)
        await refresh()
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit vote.')
    } finally {
      setVotingId(null)
    }
  }

  return (
    <>
      <Card title="Awards & Honors">
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

              {admin && (
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
              )}
            </article>
          ))}
        </div>

        {!sortedAwards.length && (
          <Empty>Recognition from the celebration will be recorded here.</Empty>
        )}

        {admin && (
          <div style={{ marginTop: '24px' }}>
            <h4>Add Award Record</h4>
            <Form
              submit="Add Award"
              onSubmit={(v) =>
                add('awards', { ...v, year: Number(v.year) })
              }
              fields={awardFields}
            />
          </div>
        )}
      </Card>

      <Card title="Best Pandal Poll">
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

                  <Button
                    type="button"
                    disabled={hasVoted || isVoting}
                    onClick={() => handleVote(nominee)}
                    className="vote-btn"
                  >
                    {isVoting
                      ? 'Voting…'
                      : hasVoted
                      ? '✓ Vote Recorded'
                      : 'Vote for this Pandal'}
                  </Button>
                </div>

                {admin && (
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
                )}
              </article>
            )
          })}
        </div>

        {!nomineesList.length && (
          <Empty>Pandal nominees will be announced here.</Empty>
        )}

        {/* Add Nominee with Direct Photo Upload */}
        {admin && (
          <div style={{ marginTop: '28px' }}>
            <h4>Add Pandal Nominee</h4>
            <form className="form" onSubmit={handleAddNominee}>
              <div className="member-photo-picker-section">
                <div className="avatar-preview-box" style={{ borderRadius: '8px', width: '70px', height: '50px' }}>
                  {nomineePhotoPreview ? (
                    <img src={nomineePhotoPreview} alt="Selected preview" className="avatar-preview-img" />
                  ) : (
                    <div className="avatar-placeholder" style={{ fontSize: '1.2rem' }}>🪔</div>
                  )}
                </div>
                <label className="photo-file-btn">
                  <span>📁 Select Pandal Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isAddingNominee}
                    onChange={handleNomineePhotoSelect}
                  />
                </label>
                {nomineePhotoFile && (
                  <button
                    type="button"
                    className="remove-selected-photo"
                    onClick={() => {
                      setNomineePhotoFile(null)
                      setNomineePhotoPreview('')
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <label style={{ gridColumn: 'span 2' }}>
                <span>Pandal / Colony Name <span className="req-star">*</span></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Street Youth Mandali"
                  value={nomineeName}
                  disabled={isAddingNominee}
                  onChange={(e) => setNomineeName(e.target.value)}
                />
              </label>

              <label style={{ gridColumn: 'span 2' }}>
                <span>Theme & Highlights</span>
                <textarea
                  placeholder="e.g. Eco-friendly clay idol, temple replica theme..."
                  value={nomineeNote}
                  disabled={isAddingNominee}
                  onChange={(e) => setNomineeNote(e.target.value)}
                />
              </label>

              <div className="form-actions">
                <Button type="submit" disabled={isAddingNominee || !nomineeName.trim()}>
                  {isAddingNominee ? 'Uploading & Adding…' : 'Add Nominee'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Edit Nominee Modal */}
      {editingNominee && (
        <Modal
          isOpen={Boolean(editingNominee)}
          onClose={() => !isUpdatingNominee && setEditingNominee(null)}
          title="Edit Pandal Nominee"
          maxWidth="520px"
        >
          <form className="form" onSubmit={handleUpdateNominee}>
            <div className="member-photo-picker-section" style={{ gridColumn: 'span 2' }}>
              <div className="avatar-preview-box" style={{ borderRadius: '8px', width: '70px', height: '50px' }}>
                {editNomineePhotoPreview ? (
                  <img src={editNomineePhotoPreview} alt="Selected preview" className="avatar-preview-img" />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '1.2rem' }}>🪔</div>
                )}
              </div>
              <label className="photo-file-btn">
                <span>📁 {editNomineePhotoPreview ? 'Change Photo' : 'Select Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUpdatingNominee}
                  onChange={handleEditNomineePhotoSelect}
                />
              </label>
            </div>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Pandal / Colony Name <span className="req-star">*</span></span>
              <input
                type="text"
                required
                value={editNomineeName}
                disabled={isUpdatingNominee}
                onChange={(e) => setEditNomineeName(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Theme & Highlights</span>
              <textarea
                value={editNomineeNote}
                disabled={isUpdatingNominee}
                onChange={(e) => setEditNomineeNote(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <Button
                type="button"
                kind="secondary"
                disabled={isUpdatingNominee}
                onClick={() => setEditingNominee(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingNominee}>
                {isUpdatingNominee ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
