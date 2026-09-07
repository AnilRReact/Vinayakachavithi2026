import { useState, useEffect } from 'react'
import { Button, Modal } from './ui'

function getFieldIcon(name, type) {
  const n = String(name || '').toLowerCase()
  if (type === 'date') return '📅'
  if (type === 'time') return '🕒'
  if (type === 'number') return '💰'
  if (n.includes('phone') || n.includes('mobile')) return '📱'
  if (n.includes('name') || n.includes('donor') || n.includes('sponsor') || n.includes('volunteer') || n.includes('recipient')) return '👤'
  if (n.includes('duty') || n.includes('role')) return '🛡️'
  if (n.includes('category') || n.includes('item') || n.includes('asset')) return '🏷️'
  if (n.includes('amount') || n.includes('cost') || n.includes('bid')) return '💸'
  if (n.includes('payment')) return '💳'
  if (n.includes('note') || n.includes('desc') || n.includes('gotram') || n.includes('citation')) return '📝'
  if (n.includes('address') || n.includes('landmark') || n.includes('location')) return '📍'
  if (n.includes('pin')) return '📌'
  return '✨'
}

/** Reusable edit dialog for any RLS-authorized portal record. */
export function EditRecordButton({
  label = 'Edit',
  record,
  fields,
  onSave,
  size = 'medium'
}) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(() => initialValues(record, fields))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValues(initialValues(record, fields))
      setError('')
    }
  }, [open, record, fields])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await onSave(values)
      if (result && result.message) {
        setError(result.message)
        return
      }
      setOpen(false)
    } catch (saveError) {
      setError(saveError.message || 'Could not save changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        kind="edit-action"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${label}`}
        title={`Edit ${label}`}
      >
        <span className="action-icon" aria-hidden="true">✏</span>
        <span className="action-label">{label}</span>
      </Button>

      <Modal
        isOpen={open}
        onClose={() => !busy && setOpen(false)}
        title={`Edit ${label}`}
        maxWidth="580px"
      >
        <form className="member-form" onSubmit={submit}>
          {fields.map((field) => {
            const isCheck = field.type === 'checkbox'
            if (isCheck) {
              return (
                <div
                  key={field.name}
                  className="form-group"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#fffbeb',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fef08a'
                  }}
                >
                  <input
                    type="checkbox"
                    id={`field-${field.name}`}
                    checked={Boolean(values[field.name])}
                    disabled={busy}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.checked })}
                    style={{ width: '18px', height: '18px', margin: 0 }}
                  />
                  <label
                    htmlFor={`field-${field.name}`}
                    style={{ margin: 0, cursor: 'pointer', fontWeight: '600', color: '#92400e', fontSize: '0.88rem' }}
                  >
                    {field.label}
                  </label>
                </div>
              )
            }

            return (
              <div key={field.name} className="form-group">
                <label className="form-label">
                  <span>
                    {getFieldIcon(field.name, field.type)} {field.label}
                  </span>
                  {field.required && <span className="req-star" aria-hidden="true">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    value={values[field.name] ?? ''}
                    disabled={busy}
                    rows={3}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={values[field.name] ?? ''}
                    disabled={busy}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  >
                    {field.options.map((option) =>
                      typeof option === 'object' ? (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ) : (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required={field.required}
                    placeholder={field.placeholder || ''}
                    value={values[field.name] ?? ''}
                    disabled={busy}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  />
                )}
              </div>
            )
          })}

          {error && (
            <div className="form-error" role="alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.85rem' }}>
              ⚠ {error}
            </div>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              kind="secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function initialValues(record, fields) {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      record[field.name] ?? (field.type === 'checkbox' ? false : '')
    ])
  )
}
