import React, { useState, useEffect } from 'react'

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      // Guide for iOS Safari or manual installation
      alert('To install this app on your phone:\n\n📱 Android: Tap the 3 dots in Chrome → "Install App" or "Add to Home Screen".\n\n🍎 iPhone: Tap the Share button at the bottom of Safari → "Add to Home Screen".')
    }
  }

  if (isInstalled) return null

  return (
    <button
      type="button"
      className="btn-install-app"
      onClick={handleInstallClick}
      title="Install Vinayaka Vedika as a mobile application on your phone"
    >
      <span className="install-icon">📲</span>
      <span className="install-text">Install App</span>
    </button>
  )
}
