import { useState, useEffect } from 'react'
import { Button, Modal } from './ui'

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
        <form className="form edit-form" onSubmit={submit}>
          {fields.map((field) => (
            <label key={field.name} className={field.type === 'checkbox' ? 'check' : ''}>
              <span>
                {field.label}
                {field.required && <span className="req-star" aria-hidden="true"> *</span>}
              </span>
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  value={values[field.name] ?? ''}
                  disabled={busy}
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
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  disabled={busy}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.checked })}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  required={field.required}
                  value={values[field.name] ?? ''}
                  disabled={busy}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              )}
            </label>
          ))}

          {error && (
            <div className="form-error" role="alert">
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
              {busy ? 'Saving…' : 'Save changes'}
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
