import { useState } from 'react'
import ganeshArt from '../../assets/ganesh-art-login.png'
import { useToast } from '../../context/ToastContext'

export function LoginPage({ auth, settings = {}, onBack, onLoginSuccess }) {
  const { signInWithPasscode, signInWithMemberPin, setPasscode, loading, getActivePasscode, authorizedMembers } = auth
  const { toast } = useToast()

  const [loginMode, setLoginMode] = useState('admin') // 'admin' | 'member' | 'setup'
  const [passcode, setPasscodeVal] = useState('')
  const [memberPhone, setMemberPhone] = useState('')
  const [memberPin, setMemberPin] = useState('')
  const [newPasscodeVal, setNewPasscodeVal] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const villageName = settings.village_name || 'Vinayaka Vedika'
  const activeCode = getActivePasscode ? getActivePasscode() : 'admin123'

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (loginMode === 'setup') {
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
          if (toast?.success) toast.success('🎉 New admin passcode saved successfully! Unlocked.')
          if (onLoginSuccess) onLoginSuccess()
        }
      } catch (err) {
        setErrorMsg(err?.message || 'Failed to save passcode.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      if (!passcode || passcode.trim().length < 6) {
        setErrorMsg('Passcode must be at least 6 characters.')
        return
      }

      setIsSubmitting(true)
      try {
        const err = await signInWithPasscode(passcode.trim())
        if (err) {
          setErrorMsg(err.message || 'Incorrect passcode. Please enter the valid passcode.')
        } else {
          if (toast?.success) toast.success('🎉 Welcome Committee Admin! Application unlocked.')
          if (onLoginSuccess) onLoginSuccess()
        }
      } catch (err) {
        setErrorMsg(err?.message || 'Authentication error.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleMemberSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!memberPhone || memberPhone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number.')
      return
    }
    if (!memberPin || memberPin.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit access PIN / OTP provided by Admin.')
      return
    }

    setIsSubmitting(true)
    try {
      const err = await signInWithMemberPin(memberPhone.trim(), memberPin.trim())
      if (err) {
        setErrorMsg(err.message || 'Verification failed. Please check phone number and PIN.')
      } else {
        if (toast?.success) toast.success('🎉 Welcome Authorized Committee Member! Financial ledgers unlocked.')
        if (onLoginSuccess) onLoginSuccess()
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
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
            <span>Return to Public Devotee View</span>
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
              <p className="glass-mantra">🌿 Om Sri Ganeshaya Namaha 🌿</p>
              <h2 className="glass-ganesh-title">{villageName}</h2>
              <p className="glass-ganesh-subtitle">
                Official Festival Portal & Role-Based Authorization
              </p>
              <div className="glass-shloka">
                <span>“Vakratunda Mahakaya Suryakoti Samaprabha | Nirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ||”</span>
              </div>
            </div>
          </div>

          {/* Right Column: Frosted Glass Auth Panel */}
          <div className="glass-form-col">
            {/* Mode Switcher Tabs */}
            <div className="auth-mode-tab-bar">
              <button
                type="button"
                className={`auth-mode-tab ${loginMode === 'admin' || loginMode === 'setup' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('admin')
                  setErrorMsg('')
                }}
              >
                👑 Master Admin
              </button>
              <button
                type="button"
                className={`auth-mode-tab ${loginMode === 'member' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('member')
                  setErrorMsg('')
                }}
              >
                📱 Member PIN / OTP
              </button>
            </div>

            {/* Panel Header */}
            <div className="glass-form-header">
              <div className="glass-key-badge">
                <span className="key-icon">{loginMode === 'member' ? '🛡️' : '🗝️'}</span>
              </div>
              <h1 className="glass-title">
                {loginMode === 'setup'
                  ? 'Set / Change Master Passcode'
                  : loginMode === 'member'
                  ? 'Authorized Member Sign In'
                  : 'Master Admin Sign In'}
              </h1>
              <p className="glass-desc">
                {loginMode === 'setup'
                  ? 'Set a new secure committee passcode (min. 6 characters).'
                  : loginMode === 'member'
                  ? 'Enter your registered mobile number and the 6-digit access PIN / OTP assigned by Admin to view full expenses and collections.'
                  : 'Enter the committee master passcode to unlock full editing, expenses, records, and authorization management.'}
              </p>
            </div>

            {/* Hint Card for Master Admin */}
            {loginMode === 'admin' && (
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

            {/* Form Mode 1 & 2: Master Admin / Setup */}
            {(loginMode === 'admin' || loginMode === 'setup') && (
              <form className="glass-auth-form" onSubmit={handleAdminSubmit}>
                {loginMode === 'admin' ? (
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
                      >
                        {showPassword ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="glass-error-banner" role="alert">
                    <span className="error-icon">⚠</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="glass-submit-btn"
                >
                  <span className="btn-glow"></span>
                  <span className="btn-text">
                    {isSubmitting || loading
                      ? 'Verifying…'
                      : loginMode === 'setup'
                      ? 'Save New Passcode & Unlock'
                      : '🔓 Unlock Master Admin'}
                  </span>
                </button>

                <div className="glass-toggle-row">
                  {loginMode === 'setup' ? (
                    <button
                      type="button"
                      className="glass-link-btn"
                      onClick={() => {
                        setLoginMode('admin')
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
                        setLoginMode('setup')
                        setErrorMsg('')
                        setPasscodeVal('')
                      }}
                    >
                      Forgot or need to change committee passcode?
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Form Mode 3: Member Phone + 6-Digit PIN */}
            {loginMode === 'member' && (
              <form className="glass-auth-form" onSubmit={handleMemberSubmit}>
                <div className="glass-field-group">
                  <label htmlFor="member-phone" className="glass-field-label">
                    <span>Registered Mobile Number</span>
                    <span className="req-dot">*</span>
                  </label>
                  <div className="glass-input-wrapper">
                    <span className="input-leading-icon">📱</span>
                    <input
                      id="member-phone"
                      type="tel"
                      required
                      placeholder="e.g. 9848012345"
                      value={memberPhone}
                      disabled={isSubmitting || loading}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      autoFocus
                      className="glass-input"
                      inputMode="tel"
                    />
                  </div>
                </div>

                <div className="glass-field-group">
                  <label htmlFor="member-pin" className="glass-field-label">
                    <span>6-Digit Access PIN / OTP</span>
                    <span className="req-dot">*</span>
                  </label>
                  <div className="glass-input-wrapper">
                    <span className="input-leading-icon">🔢</span>
                    <input
                      id="member-pin"
                      type={showPassword ? 'text' : 'password'}
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit PIN"
                      value={memberPin}
                      disabled={isSubmitting || loading}
                      onChange={(e) => setMemberPin(e.target.value)}
                      className="glass-input"
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      className="glass-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPassword ? '👁️‍🗨️' : '👁️'}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="glass-error-banner" role="alert">
                    <span className="error-icon">⚠</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="glass-submit-btn"
                >
                  <span className="btn-glow"></span>
                  <span className="btn-text">
                    {isSubmitting || loading ? 'Verifying PIN…' : '🛡️ Unlock Member Access'}
                  </span>
                </button>

                <p className="member-auth-hint" style={{ fontSize: '0.8rem', color: '#fed7aa', textAlign: 'center', marginTop: '12px' }}>
                  Need an Access PIN? Contact the Master Admin / President to register your phone number.
                </p>
              </form>
            )}

            {/* Trust Footer */}
            <div className="glass-trust-footer">
              <span className="shield-icon">🛡️</span>
              <span>Role-Based Security · Multi-Tier Authorization System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
