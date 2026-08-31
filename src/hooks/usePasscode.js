import { useState } from 'react'
import { supabase } from '../lib/supabase'

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

  // Get currently active valid passcode (default: 'admin123')
  const getActivePasscode = () => {
    try {
      return localStorage.getItem('vv-passcode') || 'admin123'
    } catch {
      return 'admin123'
    }
  }

  const signIn = async (passcode) => {
    setLoading(true)
    const candidate = (passcode || '').trim()

    try {
      if (!candidate || candidate.length < 6) {
        throw new Error('Passcode must be at least 6 characters.')
      }

      // 1. Check against active valid passcode
      const activePasscode = getActivePasscode()

      // 2. If Supabase RPC is available, verify with database
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
          // Fallback to local active passcode
        }
      }

      // 3. Strict match against active passcode
      if (candidate === activePasscode) {
        sessionStorage.setItem('vv-admin', 'yes')
        localStorage.setItem('vv-admin', 'yes')
        setAdmin(true)
        return null
      }

      // 4. Strict Rejection if mismatch
      throw new Error(
        activePasscode === 'admin123'
          ? 'Incorrect passcode. Default passcode is "admin123".'
          : 'Incorrect passcode. Please enter the current valid passcode.'
      )
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
        throw new Error('New passcode must be at least 6 characters.')
      }

      // Save new passcode as the ONLY active passcode
      localStorage.setItem('vv-passcode', newPasscode)
      sessionStorage.setItem('vv-admin', 'yes')
      localStorage.setItem('vv-admin', 'yes')
      setAdmin(true)

      // Sync with Supabase if available
      if (supabase) {
        try {
          await supabase.rpc('set_admin_passcode', { new_passcode: newPasscode })
        } catch {
          // Local storage fallback is saved
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

  return { admin, loading, signIn, setPasscode, signOut, getActivePasscode }
}
