import { useState, useEffect } from 'react'

export function Card({ title, children, action, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-head">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Empty({ children = 'Nothing has been added yet.' }) {
  return <p className="empty">{children}</p>
}

export function Button({ children, kind = 'primary', className = '', ...props }) {
  return (
    <button className={`button ${kind} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

function getFormIcon(name, type) {
  const n = String(name || '').toLowerCase()
  if (type === 'date') return '📅'
  if (type === 'time') return '🕒'
  if (type === 'number') return '💰'
  if (n.includes('phone') || n.includes('mobile')) return '📱'
  if (n.includes('name') || n.includes('donor') || n.includes('sponsor') || n.includes('doctor') || n.includes('coord')) return '👤'
  if (n.includes('upi') || n.includes('payment') || n.includes('receipt')) return '💳'
  if (n.includes('address') || n.includes('location') || n.includes('destination') || n.includes('start')) return '📍'
  if (n.includes('map') || n.includes('url')) return '🗺️'
  if (n.includes('tagline') || n.includes('slogan')) return '✨'
  if (n.includes('idol')) return '🪔'
  if (n.includes('note') || n.includes('notice') || n.includes('instruction') || n.includes('desc')) return '📝'
  return '🏷️'
}

export function Form({ fields, onSubmit, submit = 'Save', className = '' }) {
  const getInitialValues = () =>
    Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.default ?? (field.type === 'checkbox' ? false : '')
      ])
    )

  const [values, setValues] = useState(getInitialValues)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Reset values if fields default values change
  useEffect(() => {
    setValues(getInitialValues())
  }, [fields])

  const submitForm = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await onSubmit(values)
      if (result && result.message) {
        setError(result.message)
        return
      }
      setValues(getInitialValues())
    } catch (submitError) {
      setError(submitError.message || 'Could not save this record.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={`member-form ${className}`.trim()} onSubmit={submitForm}>
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
                id={`form-field-${field.name}`}
                checked={Boolean(values[field.name])}
                disabled={busy}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.checked })}
                style={{ width: '18px', height: '18px', margin: 0 }}
              />
              <label
                htmlFor={`form-field-${field.name}`}
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
                {getFormIcon(field.name, field.type)} {field.label}
              </span>
              {field.required && <span className="req-star" aria-hidden="true">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name] ?? ''}
                disabled={busy}
                rows={3}
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
                required={field.required}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={values[field.name] ?? ''}
                min={field.min}
                max={field.max}
                step={field.step}
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
      <div className="form-actions" style={{ marginTop: '12px' }}>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : submit}
        </Button>
      </div>
    </form>
  )
}

export function Modal({ isOpen = true, onClose, title, children, maxWidth = '560px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose()
        }
      }}
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="modal-top-accent" />
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-om-mark" aria-hidden="true">🪔</span>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog" title="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({ isOpen = true, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Delete', isDestructive = true }) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // Handled by onConfirm caller
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="440px">
      <p className="confirm-message">{message}</p>
      <div className="modal-actions">
        <Button kind="secondary" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          kind={isDestructive ? 'delete-confirm' : 'primary'}
          disabled={busy}
          onClick={handleConfirm}
        >
          {busy ? 'Processing…' : confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export function Stat({ label, value, icon, variant = 'default' }) {
  return (
    <div className={`stat stat-${variant}`}>
      {icon && (
        <div className="stat-icon-badge" aria-hidden="true">
          <span className="stat-icon-symbol">{icon}</span>
        </div>
      )}
      <div className="stat-content">
        <b className="stat-value">{value}</b>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  )
}

export function Toran() {
  return (
    <div className="toran" aria-hidden="true">
      🌿 🔔 🌺 ॐ 🌸 🪔 🌿 🔔 🌺 ॐ 🌸 🪔 🌿 🔔 🌺 ॐ 🌸 🪔 🌿
    </div>
  )
}

