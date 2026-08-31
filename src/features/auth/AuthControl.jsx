import { Button } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export function AuthControl({ auth, onOpenLogin }) {
  const { admin, signOut } = auth
  const { toast } = useToast()

  const handleSignOut = () => {
    try {
      signOut()
      if (toast && typeof toast.info === 'function') {
        toast.info('Signed out of admin mode.')
      }
    } catch {}
  }

  if (admin) {
    return (
      <div className="auth-status-container">
        <span className="admin-badge" title="You have full editing permissions">
          <span className="status-dot"></span> 🔓 Admin Unlocked
        </span>
        <Button
          kind="secondary"
          size="small"
          onClick={handleSignOut}
          title="Lock and sign out of admin mode"
        >
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <Button
      kind="secondary"
      className="admin-login-btn"
      onClick={onOpenLogin}
      title="Open Admin Login page to enter passcode"
    >
      <span aria-hidden="true">🔒</span> Admin sign in
    </Button>
  )
}
