import { useState, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { usePortal } from './hooks/usePortal'
import { usePasscode } from './hooks/usePasscode'
import { ToastProvider } from './context/ToastContext'
import { Toran } from './components/ui'
import { PushNotifications } from './components/PushNotifications'
import { LanguageSelector } from './components/LanguageSelector'
import { InstallAppButton } from './components/InstallAppButton'
import { translate } from './i18n/locales'

import { AuthControl } from './features/auth/AuthControl'
import { LoginPage } from './features/auth/LoginPage'
import { Overview } from './features/overview/Overview'
import { Community } from './features/community/Community'
import { Money } from './features/money/Money'
import { Schedule } from './features/schedule/Schedule'
import { Recognition } from './features/recognition/Recognition'
import { Memories } from './features/memories/Memories'
import { Music } from './features/music/Music'
import { Help } from './features/help/Help'
import { Settings } from './features/settings/Settings'

const TABS = [
  ['Overview', 'overview', '⌂'],
  ['Community', 'community', '♟'],
  ['Money', 'money', '₹'],
  ['Schedule', 'schedule', '▦'],
  ['Recognition', 'recognition', '✦'],
  ['Memories', 'memories', '▧'],
  ['Music', 'music', '♫'],
  ['Help', 'help', '?']
]

function AppContent() {
  const portal = usePortal()
  const auth = usePasscode()
  const { data, loading, error, add, update, remove, refresh, recordBid, closeBid } = portal

  const [tab, setTab] = useState('Overview')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLoginView, setIsLoginView] = useState(false)
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('vv-locale') || 'en'
    } catch {
      return 'en'
    }
  })

  const settings = data.settings?.[0] || {}
  const isAdmin = auth.admin
  const t = (key) => translate(locale, key)

  const handleSelectTab = (selectedTab) => {
    setTab(selectedTab)
    setIsDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeLocale = (next) => {
    setLocale(next)
    try {
      localStorage.setItem('vv-locale', next)
    } catch {}
    document.documentElement.lang = next
  }

  const renderActiveScreen = () => {
    switch (tab) {
      case 'Community':
        return (
          <Community
            data={data}
            admin={isAdmin}
            add={add}
            update={update}
            remove={remove}
          />
        )
      case 'Money':
        return (
          <Money
            data={data}
            admin={isAdmin}
            add={add}
            update={update}
            remove={remove}
            recordBid={recordBid}
            closeBid={closeBid}
          />
        )
      case 'Schedule':
        return (
          <Schedule
            data={data}
            admin={isAdmin}
            add={add}
            update={update}
            remove={remove}
          />
        )
      case 'Recognition':
        return (
          <Recognition
            data={data}
            admin={isAdmin}
            add={add}
            update={update}
            remove={remove}
            refresh={refresh}
          />
        )
      case 'Memories':
        return (
          <Memories
            data={data}
            admin={isAdmin}
            add={add}
            remove={remove}
          />
        )
      case 'Music':
        return (
          <Music
            data={data}
            admin={isAdmin}
            add={add}
            update={update}
            remove={remove}
          />
        )
      case 'Help':
        return <Help data={data} />
      case 'Settings':
        return isAdmin ? (
          <Settings
            data={data}
            add={add}
            update={update}
            syncAllToCloud={portal.syncAllToCloud}
            refresh={portal.refresh}
          />
        ) : (
          <Overview data={data} admin={isAdmin} add={add} update={update} remove={remove} onNavigate={handleSelectTab} />
        )
      case 'Overview':
      default:
        return <Overview data={data} admin={isAdmin} add={add} update={update} remove={remove} onNavigate={handleSelectTab} />
    }
  }

  // If user clicked Sign In, show full-screen Glassmorphism Divine Login Page
  if (isLoginView && !isAdmin) {
    return (
      <LoginPage
        auth={auth}
        settings={settings}
        onBack={() => setIsLoginView(false)}
        onLoginSuccess={() => {
          setIsLoginView(false)
          handleSelectTab('Overview')
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <Toran />

      {/* Top Header Bar with 3-Lines Hamburger Menu Button */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 3-Lines Hamburger Menu Button (Slides all sections open on click) */}
          <button
            type="button"
            className="mobile-menu-toggle-btn"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open all festival sections"
            title="Menu: View all sections"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          <div className="brand">
            <span className="brand-mark" aria-hidden="true">ॐ</span>
            <div>
              <p className="eyebrow">Village Vinayaka Chavithi</p>
              <b>{settings.village_name || 'Vinayaka Vedika 2026'}</b>
              <small>Committee portal · 2026</small>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <InstallAppButton />
          <LanguageSelector locale={locale} onChange={changeLocale} />
          <AuthControl auth={auth} onOpenLogin={() => setIsLoginView(true)} />
        </div>
      </header>

      {/* Slide-Out Navigation Drawer (Opens smoothly when clicking 3 lines) */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <aside className="slide-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-brand">
                <span className="brand-mark-small">ॐ</span>
                <div>
                  <b>{settings.village_name || 'Vinayaka Vedika 2026'}</b>
                  <small>Festival Sections</small>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="drawer-nav">
              {TABS.map(([item, key, icon]) => (
                <button
                  key={item}
                  className={`drawer-nav-btn ${tab === item ? 'active' : ''}`}
                  onClick={() => handleSelectTab(item)}
                >
                  <span className="drawer-nav-icon">{icon}</span>
                  <span className="drawer-nav-label">{t(key)}</span>
                  {tab === item && <span className="drawer-active-dot">•</span>}
                </button>
              ))}

              {isAdmin && (
                <button
                  className={`drawer-nav-btn settings ${tab === 'Settings' ? 'active' : ''}`}
                  onClick={() => handleSelectTab('Settings')}
                >
                  <span className="drawer-nav-icon">⚙️</span>
                  <span className="drawer-nav-label">{t('settings')}</span>
                  {tab === 'Settings' && <span className="drawer-active-dot">•</span>}
                </button>
              )}
            </nav>

            <div className="drawer-footer">
              <p>🪔 <b>Sri Vinayaka Vedika 2026</b></p>
              <small>Our village celebration, in one place.</small>
            </div>
          </aside>
        </div>
      )}

      <div className="workspace">
        <aside className="sidebar">
          <p className="sidebar-label">Portal</p>
          <nav aria-label="Portal sections">
            {TABS.map(([item, key, icon]) => (
              <button
                key={item}
                className={tab === item ? 'active' : ''}
                onClick={() => handleSelectTab(item)}
              >
                <i aria-hidden="true">{icon}</i>
                <span>{t(key)}</span>
              </button>
            ))}

            {isAdmin && (
              <button
                className={tab === 'Settings' ? 'active' : ''}
                onClick={() => handleSelectTab('Settings')}
              >
                <i aria-hidden="true">⚙</i>
                <span>{t('settings')}</span>
              </button>
            )}
          </nav>

          <div className="sidebar-note">
            <span aria-hidden="true">🪔</span>
            <b>Built for the village</b>
            <small>Everything for this celebration, together in one place.</small>
          </div>
        </aside>

        <main id="main-content">
          {error && (
            <div className="setup error" role="alert">
              Could not load portal data: {error}
            </div>
          )}

          {loading ? (
            <div className="loading" role="status">
              <span className="loading-spinner">🪔</span>
              <p>Preparing the vedika…</p>
            </div>
          ) : (
            <>
              {isAdmin && (
                <div className="admin-active-status-bar">
                  <div className="admin-active-info">
                    <span className="status-dot"></span>
                    <b>🔓 Admin Mode Active</b> — <span>You have full permissions to add, edit, and delete records across all sections.</span>
                  </div>
                  <div className="admin-active-actions">
                    <button
                      type="button"
                      className="admin-bar-btn"
                      onClick={() => handleSelectTab('Settings')}
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      type="button"
                      className="admin-bar-btn signout"
                      onClick={() => auth.signOut()}
                    >
                      🔒 Lock Mode
                    </button>
                  </div>
                </div>
              )}
              {renderActiveScreen()}
              <PushNotifications session={null} />
            </>
          )}
        </main>
      </div>

      <footer>
        <Toran />
        <p>{t('footer')}</p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
