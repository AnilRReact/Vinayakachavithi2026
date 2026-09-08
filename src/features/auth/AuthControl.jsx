import React from 'react'
import { Button } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export function AuthControl({ auth, onOpenLogin }) {
  const { admin, authorized, role, currentUser, signOut } = auth
  const { toast } = useToast()

  const handleSignOut = () => {
    try {
      signOut()
      if (toast && typeof toast.info === 'function') {
        toast.info('🔒 Switched to Public Devotee Lock Mode.')
      }
    } catch {}
  }

  if (admin) {
    return (
      <div className="auth-status-container">
        <span className="admin-badge admin-master" title="Master Administrator — Full permissions to manage, edit, and authorize">
          <span className="status-dot green"></span>
          <b>👑 Admin Mode</b>
        </span>
        <button
          type="button"
          className="auth-header-lock-btn"
          onClick={handleSignOut}
          title="Lock portal and return to public devotee mode"
        >
          🔒 Lock
        </button>
      </div>
    )
  }

  if (authorized) {
    const memberName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Member'
    return (
      <div className="auth-status-container">
        <span className="admin-badge authorized-member" title={`Logged in as ${currentUser?.name || 'Authorized Member'} (${currentUser?.designation || 'Auditor'})`}>
          <span className="status-dot blue"></span>
          <b>🛡️ {memberName}</b>
        </span>
        <button
          type="button"
          className="auth-header-lock-btn"
          onClick={handleSignOut}
          title="Lock portal and return to public devotee mode"
        >
          🔒 Lock
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="auth-lock-mode-badge"
      onClick={onOpenLogin}
      title="Currently in Public Devotee Lock Mode. Click to sign in as Admin or Authorized Member."
    >
      <span className="lock-icon-wrap">🔒</span>
      <span className="lock-label">Lock Mode</span>
      <span className="lock-action-text">Unlock</span>
    </button>
  )
}
