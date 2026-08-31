import { useState } from 'react'
import ganeshArt from '../../assets/ganesh-art-login.png'
import { useToast } from '../../context/ToastContext'

export function LoginPage({ auth, settings = {}, onBack, onLoginSuccess }) {
  const { signIn, setPasscode, loading, getActivePasscode } = auth
  const { toast } = useToast()

  const [passcode, setPasscodeVal] = useState('')
  const [newPasscodeVal, setNewPasscodeVal] = useState('')
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const villageName = settings.village_name || 'Pathalapalli'
  const activeCode = getActivePasscode ? getActivePasscode() : 'admin123'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (isSetupMode) {
      // Setup / Reset mode
      if (!newPasscodeVal || newPasscodeVal.trim().length < 6) {
        setErrorMsg('New passcode must be at least 6 characters.')
        return
      }

      setIsSubmitting(true)
      try {
        const err = await setPasscode(newPasscodeVal.trim())
        if (err) {
          setErrorMsg(err.message || 'Could not save new passcode.')
        } else {
          if (toast && typeof toast.success === 'function') {
            toast.success('🎉 New admin passcode saved successfully! Unlocked.')
          }
          if (onLoginSuccess) onLoginSuccess()
        }
      } catch (err) {
        setErrorMsg(err?.message || 'Failed to save passcode.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Regular Sign-In mode
      if (!passcode || passcode.trim().length < 6) {
        setErrorMsg('Passcode must be at least 6 characters.')
        return
      }

      setIsSubmitting(true)
      try {
        const err = await signIn(passcode.trim())
        if (err) {
          setErrorMsg(err.message || 'Incorrect passcode. Please enter the valid passcode.')
        } else {
          if (toast && typeof toast.success === 'function') {
            toast.success('🎉 Welcome Committee Admin! Application unlocked.')
          }
          if (onLoginSuccess) onLoginSuccess()
        }
      } catch (err) {
        setErrorMsg(err?.message || 'Authentication error.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="glass-login-viewport">
      {/* Ambient Background Glow Orbs */}
      <div className="glow-orb orb-1" aria-hidden="true"></div>
      <div className="glow-orb orb-2" aria-hidden="true"></div>
      <div className="glow-orb orb-3" aria-hidden="true"></div>

      <div className="glass-login-container">
        {/* Navigation Bar / Return to Portal */}
        <div className="glass-login-topbar">
          <button
            type="button"
            className="glass-back-btn"
            onClick={onBack}
            title="Return to Public Festival Portal"
          >
            <span className="btn-icon">←</span>
            <span>Return to Devotee Portal</span>
          </button>
          <div className="glass-festival-tag">
            <span>🪔 {villageName} · 2026 🪔</span>
          </div>
        </div>

        {/* 2-Column Split Glass Card */}
        <div className="glass-login-card">
          {/* Left Column: Artistic Divine Lord Ganesha Artwork */}
          <div className="glass-ganesh-col">
            <div className="glass-ganesh-frame-wrap">
              <div className="glass-ganesh-halo"></div>

              <div className="glass-ganesh-art-frame">
                <img
                  src={ganeshArt}
                  alt="Divine Sri Ganesha Artwork"
                  className="glass-ganesh-art-img"
                />
                <div className="glass-ganesh-caption">
                  <span>🪔 SRI GANESHA BLESSINGS 🪔</span>
                </div>
              </div>
            </div>

            <div className="glass-ganesh-text">
              <p className="glass-mantra">🌿 ॐ శ్రీ గణేశాయ నమః 🌿</p>
              <h2 className="glass-ganesh-title">{villageName}</h2>
              <p className="glass-ganesh-subtitle">
                Vinayaka Chavithi Committee Management Portal
              </p>
              <div className="glass-shloka">
                <span>“వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ । నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥”</span>
              </div>
            </div>
          </div>

          {/* Right Column: Frosted Glass Auth Panel */}
          <div className="glass-form-col">
            <div className="glass-form-header">
              <div className="glass-key-badge">
                <span className="key-icon">🗝️</span>
              </div>
              <h1 className="glass-title">
                {isSetupMode ? 'Set / Change Passcode' : 'Committee Admin Login'}
              </h1>
              <p className="glass-desc">
                {isSetupMode
                  ? 'Set a new secure committee passcode (min. 6 characters). This will become the only active passcode.'
                  : 'Enter the committee passcode to unlock editing, records, finances, and member management.'}
              </p>
            </div>

            {/* Default Passcode Hint Card */}
            {!isSetupMode && (
              <div className="glass-hint-card">
                <span className="hint-icon">💡</span>
                <div className="hint-content">
                  <span className="hint-label">
                    {activeCode === 'admin123' ? 'Default Passcode:' : 'Active Passcode:'}
                  </span>
                  <code className="hint-code">{activeCode}</code>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="glass-auth-form" onSubmit={handleSubmit}>
              {!isSetupMode ? (
                <div className="glass-field-group">
                  <label htmlFor="admin-passcode" className="glass-field-label">
                    <span>Admin Passcode</span>
                    <span className="req-dot">*</span>
                  </label>

                  <div className="glass-input-wrapper">
                    <span className="input-leading-icon">🔒</span>
                    <input
                      id="admin-passcode"
                      required
                      minLength={6}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={`Enter passcode (e.g. ${activeCode})`}
                      value={passcode}
                      disabled={isSubmitting || loading}
                      onChange={(e) => setPasscodeVal(e.target.value)}
                      autoFocus
                      className="glass-input"
                    />
                    <button
                      type="button"
                      className="glass-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                      title={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPassword ? '👁️‍🗨️' : '👁️'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-field-group">
                  <label htmlFor="new-admin-passcode" className="glass-field-label">
                    <span>New Secret Passcode</span>
                    <span className="req-dot">*</span>
                  </label>

                  <div className="glass-input-wrapper">
                    <span className="input-leading-icon">🔑</span>
                    <input
                      id="new-admin-passcode"
                      required
                      minLength={6}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new passcode (min. 6 characters)"
                      value={newPasscodeVal}
                      disabled={isSubmitting || loading}
                      onChange={(e) => setNewPasscodeVal(e.target.value)}
                      autoFocus
                      className="glass-input"
                    />
                    <button
                      type="button"
                      className="glass-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                      title={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPassword ? '👁️‍🗨️' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="glass-error-banner" role="alert">
                  <span className="error-icon">⚠</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="glass-submit-btn"
              >
                <span className="btn-glow"></span>
                <span className="btn-text">
                  {isSubmitting || loading
                    ? 'Verifying…'
                    : isSetupMode
                    ? 'Save New Passcode & Unlock'
                    : '🔓 Unlock & Open Application'}
                </span>
              </button>

              {/* Toggle Setup Mode Link */}
              <div className="glass-toggle-row">
                {isSetupMode ? (
                  <button
                    type="button"
                    className="glass-link-btn"
                    onClick={() => {
                      setIsSetupMode(false)
                      setErrorMsg('')
                      setNewPasscodeVal('')
                    }}
                  >
                    ← Back to Regular Sign In
                  </button>
                ) : (
                  <button
                    type="button"
                    className="glass-link-btn"
                    onClick={() => {
                      setIsSetupMode(true)
                      setErrorMsg('')
                      setPasscodeVal('')
                    }}
                  >
                    Forgot or need to change committee passcode?
                  </button>
                )}
              </div>
            </form>

            {/* Trust Footer */}
            <div className="glass-trust-footer">
              <span className="shield-icon">🛡️</span>
              <span>Secure Offline-First Committee Access · Strict Passcode Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
