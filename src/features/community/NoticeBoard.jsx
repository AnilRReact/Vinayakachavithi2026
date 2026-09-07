import React, { useState } from 'react'
import { Card, Empty, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { fmtDate, today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function NoticeBoard({
  notices = [],
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pinned, setPinned] = useState(false)
  const [noticeDate, setNoticeDate] = useState(today())
  const [isSaving, setIsSaving] = useState(false)

  const noticeFields = [
    { name: 'message', label: 'Notice Message', type: 'textarea', required: true, placeholder: 'Write the announcement here...' },
    { name: 'pinned', label: 'Pin this notice to top of Overview', type: 'checkbox' },
    { name: 'date', label: 'Notice Date', type: 'date', default: today() }
  ]

  const handleOpenAdd = () => {
    setMessage('')
    setPinned(false)
    setNoticeDate(today())
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanMsg = (message || '').trim()

    if (!cleanMsg) {
      toast.error('Please enter the notice announcement text.')
      return
    }

    setIsSaving(true)
    try {
      const err = await add('notices', {
        message: cleanMsg,
        pinned,
        date: noticeDate || today()
      })

      if (err) throw err

      toast.success('Announcement posted to notice board!')
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not publish notice.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card
        title="Public Notice Board & Announcements"
        action={
          <Button onClick={handleOpenAdd}>
            ➕ Post Notice
          </Button>
        }
      >
        <div className="notices-list">
          {notices.map((n) => (
            <article className={`notice-item ${n.pinned ? 'pinned-notice' : ''}`} key={n.id}>
              <div className="notice-body">
                {n.pinned && <span className="pinned-badge">📌 Pinned Announcement</span>}
                <p className="notice-text">{n.message}</p>
                <small className="notice-date">
                  📅 {fmtDate(n.date || n.created_at || today())}
                </small>
              </div>

              <div className="notice-actions">
                <RecordActions
                  record={n}
                  fields={noticeFields}
                  onSave={(values) => update('notices', n.id, values)}
                  onDelete={() => remove('notices', n.id)}
                  deleteTitle="Delete Notice"
                  deleteMessage="Are you sure you want to remove this notice?"
                />
              </div>
            </article>
          ))}
        </div>

        {!notices.length && (
          <Empty text="No announcements posted yet. Click 'Post Notice' above to publish updates." />
        )}
      </Card>

      {/* Add Notice Modal */}
      {isAddModalOpen && (
        <Modal
          title="Publish Festival Announcement"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label>Announcement Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Maha Annadanam starts today at 12:30 PM at the main community hall..."
                rows={4}
                autoFocus
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="pin-check"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="pin-check" style={{ margin: 0, cursor: 'pointer', fontWeight: '600' }}>
                📌 Pin to the top of Overview page
              </label>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Publishing…' : 'Publish Announcement'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
