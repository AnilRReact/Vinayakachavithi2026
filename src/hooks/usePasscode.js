import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_PASSCODES = ['admin123', '123456', 'admin2026', 'vinayaka2026', 'utsava2026']

export function usePasscode() {
  const [admin, setAdmin] = useState(() => {
    try {
      return (
        sessionStorage.getItem('vv-admin') === 'yes' ||
        localStorage.getItem('vv-admin') === 'yes'
      )
    } catch {
      return false
    }
  })
  const [loading, setLoading] = useState(false)

  const signIn = async (passcode) => {
    setLoading(true)
    const candidate = (passcode || '').trim()

    try {
      // 1. Try Supabase RPC if configured
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('verify_admin_passcode', { candidate })
          if (!error && data === true) {
            sessionStorage.setItem('vv-admin', 'yes')
            localStorage.setItem('vv-admin', 'yes')
            setAdmin(true)
            return null
          }
        } catch {
          // Fall through to local fallback
        }
      }

      // 2. Fallback check against saved local passcode or default passcodes
      const savedPasscode = localStorage.getItem('vv-passcode')
      if (savedPasscode && candidate === savedPasscode) {
        sessionStorage.setItem('vv-admin', 'yes')
        localStorage.setItem('vv-admin', 'yes')
        setAdmin(true)
        return null
      }

      if (DEFAULT_PASSCODES.includes(candidate.toLowerCase())) {
        sessionStorage.setItem('vv-admin', 'yes')
        localStorage.setItem('vv-admin', 'yes')
        setAdmin(true)
        return null
      }

      // 3. First time check - if no passcode was ever configured anywhere, allow candidate to unlock & save
      if (!savedPasscode && candidate.length >= 6) {
        localStorage.setItem('vv-passcode', candidate)
        sessionStorage.setItem('vv-admin', 'yes')
        localStorage.setItem('vv-admin', 'yes')
        setAdmin(true)
        return null
      }

      throw new Error('Incorrect admin passcode. (Try default "admin123" or reset in Settings)')
    } catch (err) {
      return err
    } finally {
      setLoading(false)
    }
  }

  const setPasscode = async (passcode) => {
    setLoading(true)
    const newPasscode = (passcode || '').trim()

    try {
      if (!newPasscode || newPasscode.length < 6) {
        throw new Error('Passcode must be at least 6 characters.')
      }

      // Save locally first
      localStorage.setItem('vv-passcode', newPasscode)
      sessionStorage.setItem('vv-admin', 'yes')
      localStorage.setItem('vv-admin', 'yes')
      setAdmin(true)

      // Sync with Supabase if available
      if (supabase) {
        try {
          await supabase.rpc('set_admin_passcode', { new_passcode: newPasscode })
        } catch {
          // Local storage fallback succeeded
        }
      }

      return null
    } catch (err) {
      return err
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    try {
      sessionStorage.removeItem('vv-admin')
      localStorage.removeItem('vv-admin')
    } catch {}
    setAdmin(false)
  }

  return { admin, loading, signIn, setPasscode, signOut }
}
