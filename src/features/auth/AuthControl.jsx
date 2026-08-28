import { useState } from 'react'
import { Button, Modal } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export function AuthControl({ auth }) {
  const { admin, loading, signIn, setPasscode, signOut } = auth
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [passcode, setPasscodeVal] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleOpen = (setup = false) => {
    setIsSetupMode(setup)
    setPasscodeVal('')
    setErrorMsg('')
    setShowPassword(false)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!passcode || passcode.trim().length < 6) {
      setErrorMsg('Passcode must be at least 6 characters.')
      return
    }

    const err = isSetupMode ? await setPasscode(passcode) : await signIn(passcode)
    if (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your passcode.')
    } else {
      toast?.success?.(isSetupMode ? 'Admin passcode saved and unlocked.' : 'Committee admin access enabled.')
      setModalOpen(false)
      setPasscodeVal('')
    }
  }

  const handleSignOut = () => {
    signOut()
    toast?.info?.('Signed out of admin mode.')
  }

  if (admin) {
    return (
      <div className="auth-status-container">
        <span className="admin-badge" title="You have full editing permissions">
          <span className="status-dot"></span> 🔓 Admin Unlocked
        </span>
        <Button kind="secondary" size="small" onClick={handleSignOut} title="Lock and sign out of admin mode">
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        kind="secondary"
        className="admin-login-btn"
        onClick={() => handleOpen(false)}
        title="Sign in with admin passcode to edit"
      >
        <span aria-hidden="true">🔒</span> Admin sign in
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isSetupMode ? 'Create / Reset Admin Passcode' : 'Committee Admin Access'}
        maxWidth="460px"
      >
        <p className="modal-description">
          {isSetupMode
            ? 'Set a new shared passcode (min. 6 characters) to manage and edit festival records.'
            : 'Enter the committee passcode to unlock editing, adding members, and record management.'}
        </p>

        {!isSetupMode && (
          <div className="passcode-default-hint">
            💡 <b>Default Passcode:</b> <code>admin123</code> (or set your custom passcode below)
          </div>
        )}

        <form className="form auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Passcode</span>
            <div className="password-input-wrap">
              <input
                required
                minLength={6}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter at least 6 characters"
                value={passcode}
                disabled={loading}
                onChange={(e) => setPasscodeVal(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </label>

          {errorMsg && (
            <div className="form-error" role="alert">
              ⚠ {errorMsg}
            </div>
          )}

          <div className="auth-modal-footer">
            <div className="auth-mode-toggle">
              {isSetupMode ? (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setIsSetupMode(false)
                    setErrorMsg('')
                  }}
                >
                  ← Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setIsSetupMode(true)
                    setErrorMsg('')
                  }}
                >
                  Forgot or need to set a passcode?
                </button>
              )}
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                kind="secondary"
                disabled={loading}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? 'Verifying…'
                  : isSetupMode
                  ? 'Set & Unlock'
                  : 'Unlock Access'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}

