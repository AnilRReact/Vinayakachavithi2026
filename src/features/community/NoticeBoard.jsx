import React from 'react'
import { Card, Empty, Form } from '../../components/ui'
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

  const noticeFields = [
    { name: 'message', label: 'Notice Message (ప్రకటన సారాంశం)', type: 'textarea', required: true, placeholder: 'Write the announcement here...' },
    { name: 'pinned', label: 'Pin this notice to top of Overview', type: 'checkbox' },
    { name: 'date', label: 'Notice Date', type: 'date', default: today() }
  ]

  const handleAddNotice = async (values) => {
    const err = await add('notices', {
      ...values,
      date: values.date || today()
    })
    if (err) {
      toast.error(err.message || 'Could not publish notice.')
    } else {
      toast.success('Notice published to community board.')
    }
  }

  return (
    <>
      <Card title="Public Notice Board & Announcements (ప్రకటనల బోర్డు)">
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

              {admin && (
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
              )}
            </article>
          ))}
        </div>

        {!notices.length && (
          <Empty text="No announcements posted yet." />
        )}
      </Card>

      {admin && (
        <Card title="Publish New Announcement (కొత్త ప్రకటన)">
          <Form
            fields={noticeFields}
            onSubmit={handleAddNotice}
            submitLabel="Publish Announcement (ప్రకటన విడుదల)"
          />
        </Card>
      )}
    </>
  )
}

