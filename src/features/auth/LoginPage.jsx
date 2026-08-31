import { useState } from 'react'
import ganeshIdol2026 from '../../assets/ganesh-idol-2026.jpg'
import { useToast } from '../../context/ToastContext'

export function LoginPage({ auth, settings = {}, onBack, onLoginSuccess }) {
  const { signIn, setPasscode, loading } = auth
  const { toast } = useToast()

  const [passcode, setPasscodeVal] = useState('')
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const villageName = settings.village_name || 'Pathalapalli'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!passcode || passcode.trim().length < 6) {
      setErrorMsg('Passcode must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const err = isSetupMode ? await setPasscode(passcode) : await signIn(passcode)
      if (err) {
        setErrorMsg(err.message || 'Incorrect passcode. Please try again or use default: admin123')
      } else {
        if (toast && typeof toast.success === 'function') {
          toast.success(
            isSetupMode
              ? '🎉 Admin passcode saved! Application unlocked.'
              : '🎉 Welcome Committee Admin! Application unlocked.'
          )
        }
        if (onLoginSuccess) {
          onLoginSuccess()
        }
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Authentication error. Please verify passcode.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="glass-login-viewport">
      {/* Background Decorative Glow Orbs */}
      <div className="glow-orb orb-1" aria-hidden="true"></div>
      <div className="glow-orb orb-2" aria-hidden="true"></div>
      <div className="glow-orb orb-3" aria-hidden="true"></div>

      <div className="glass-login-container">
        {/* Navigation Bar / Back button */}
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

        {/* Main 2-Column Split Glass Card */}
        <div className="glass-login-card">
          {/* Left Column: Divine Lord Ganesha 2026 Showcase */}
          <div className="glass-ganesh-col">
            <div className="glass-ganesh-frame-wrap">
              {/* Luminous Golden Aura */}
              <div className="glass-ganesh-halo"></div>

              <div className="glass-ganesh-frame">
                <img
                  src={ganeshIdol2026}
                  alt="Lord Sri Ganesha 2026 Idol"
                  className="glass-ganesh-img"
                />
                <div className="glass-ganesh-caption">
                  <span>🪔 2026 OFFICIAL IDOL 🪔</span>
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

          {/* Right Column: Frosted Glass Form Panel */}
          <div className="glass-form-col">
            <div className="glass-form-header">
              <div className="glass-key-badge">
                <span className="key-icon">🗝️</span>
              </div>
              <h1 className="glass-title">
                {isSetupMode ? 'Create Admin Passcode' : 'Committee Admin Login'}
              </h1>
              <p className="glass-desc">
                {isSetupMode
                  ? 'Set a new secure committee passcode (min. 6 characters) to manage records, finances, and members.'
                  : 'Enter the committee passcode to unlock editing, record management, and settings.'}
              </p>
            </div>

            {/* Default Passcode Hint Card */}
            {!isSetupMode && (
              <div className="glass-hint-card">
                <span className="hint-icon">💡</span>
                <div className="hint-content">
                  <span className="hint-label">Default Committee Passcode:</span>
                  <code className="hint-code">admin123</code>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="glass-auth-form" onSubmit={handleSubmit}>
              <div className="glass-field-group">
                <label htmlFor="admin-passcode" className="glass-field-label">
                  <span>{isSetupMode ? 'New Admin Passcode' : 'Admin Passcode'}</span>
                  <span className="req-dot">*</span>
                </label>

                <div className="glass-input-wrapper">
                  <span className="input-leading-icon">🔒</span>
                  <input
                    id="admin-passcode"
                    required
                    minLength={6}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter passcode (e.g. admin123)"
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
                    ? 'Verifying Passcode…'
                    : isSetupMode
                    ? 'Save Passcode & Unlock'
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
                    }}
                  >
                    Forgot or need to set a custom passcode?
                  </button>
                )}
              </div>
            </form>

            {/* Trust Footer */}
            <div className="glass-trust-footer">
              <span className="shield-icon">🛡️</span>
              <span>Secure Offline-First Committee Access · Powered by Supabase RLS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
