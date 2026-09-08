import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_PASSCODE = 'admin123'
const STORAGE_KEYS = {
  ADMIN: 'vv-admin',
  ROLE: 'vv-role',
  USER: 'vv-user',
  PASSCODE: 'vv-passcode',
  MEMBERS: 'vv-authorized-members'
}

// Initial sample authorized members if none exist
const DEFAULT_MEMBERS = [
  {
    id: 'auth_treasurer_01',
    name: 'Sri K. Venkateswarlu Garu',
    designation: 'Treasurer (కోశాధికారి)',
    phone: '9848012345',
    pin: '789123',
    role: 'authorized',
    created_at: new Date().toISOString()
  },
  {
    id: 'auth_secretary_02',
    name: 'Sri T. Suresh Kumar Garu',
    designation: 'General Secretary (కార్యదర్శి)',
    phone: '9440156789',
    pin: '456789',
    role: 'authorized',
    created_at: new Date().toISOString()
  }
]

export function usePasscode() {
  const [role, setRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_KEYS.ROLE)
      if (savedRole === 'admin' || savedRole === 'authorized') return savedRole
      if (localStorage.getItem(STORAGE_KEYS.ADMIN) === 'yes' || sessionStorage.getItem(STORAGE_KEYS.ADMIN) === 'yes') {
        return 'admin'
      }
      return 'guest'
    } catch {
      return 'guest'
    }
  })

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [authorizedMembers, setAuthorizedMembers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS))
      return DEFAULT_MEMBERS
    } catch {
      return DEFAULT_MEMBERS
    }
  })

  const [loading, setLoading] = useState(false)

  const admin = role === 'admin'
  const authorized = role === 'admin' || role === 'authorized'

  // Sync authorized members to localStorage whenever state changes
  const saveAuthorizedMembers = useCallback((newList) => {
    setAuthorizedMembers(newList)
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(newList))
    } catch {}
  }, [])

  // Get currently active master admin passcode (default: 'admin123')
  const getActivePasscode = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PASSCODE) || DEFAULT_PASSCODE
    } catch {
      return DEFAULT_PASSCODE
    }
  }, [])

  // 1. Sign In via Master Admin Passcode
  const signInWithPasscode = async (passcode) => {
    setLoading(true)
    const candidate = (passcode || '').trim()

    try {
      if (!candidate || candidate.length < 6) {
        throw new Error('Passcode must be at least 6 characters.')
      }

      const activePasscode = getActivePasscode()

      // Verify with Supabase RPC if configured
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('verify_admin_passcode', { candidate })
          if (!error && data === true) {
            const adminUser = { id: 'admin_master', name: 'Master Administrator', role: 'admin', designation: 'Festival President / Admin' }
            localStorage.setItem(STORAGE_KEYS.ADMIN, 'yes')
            sessionStorage.setItem(STORAGE_KEYS.ADMIN, 'yes')
            localStorage.setItem(STORAGE_KEYS.ROLE, 'admin')
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser))
            setRole('admin')
            setCurrentUser(adminUser)
            return null
          }
        } catch {}
      }

      // Check against local active passcode
      if (candidate === activePasscode) {
        const adminUser = { id: 'admin_master', name: 'Master Administrator', role: 'admin', designation: 'Festival President / Admin' }
        localStorage.setItem(STORAGE_KEYS.ADMIN, 'yes')
        sessionStorage.setItem(STORAGE_KEYS.ADMIN, 'yes')
        localStorage.setItem(STORAGE_KEYS.ROLE, 'admin')
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser))
        setRole('admin')
        setCurrentUser(adminUser)
        return null
      }

      // Also check if candidate matches any authorized member PIN directly
      const matchingMember = authorizedMembers.find((m) => String(m.pin).trim() === candidate)
      if (matchingMember) {
        const userObj = {
          id: matchingMember.id,
          name: matchingMember.name,
          role: 'authorized',
          designation: matchingMember.designation || 'Authorized Committee Member',
          phone: matchingMember.phone
        }
        localStorage.setItem(STORAGE_KEYS.ROLE, 'authorized')
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj))
        setRole('authorized')
        setCurrentUser(userObj)
        return null
      }

      throw new Error('Incorrect passcode or access PIN. Please verify credentials.')
    } catch (err) {
      return err
    } finally {
      setLoading(false)
    }
  }

  // 2. Sign In via Authorized Member Phone + 6-Digit PIN / OTP
  const signInWithMemberPin = async (phoneInput = '', pinInput = '') => {
    setLoading(true)
    const cleanPhone = String(phoneInput || '').replace(/[^0-9]/g, '')
    const cleanPin = String(pinInput || '').trim()

    try {
      if (!cleanPhone || cleanPhone.length < 10) {
        throw new Error('Please enter a valid 10-digit mobile number.')
      }
      if (!cleanPin || cleanPin.length !== 6) {
        throw new Error('Access PIN / OTP must be a 6-digit number.')
      }

      // Find member in authorized list
      const member = authorizedMembers.find((m) => {
        const mPhone = String(m.phone || '').replace(/[^0-9]/g, '')
        return mPhone.includes(cleanPhone) || cleanPhone.includes(mPhone)
      })

      if (!member) {
        throw new Error('Mobile number is not registered in the authorized committee list. Contact Admin.')
      }

      if (String(member.pin).trim() !== cleanPin) {
        throw new Error('Incorrect 6-digit PIN / OTP for this mobile number.')
      }

      const userObj = {
        id: member.id,
        name: member.name,
        role: member.role || 'authorized',
        designation: member.designation || 'Authorized Member',
        phone: member.phone
      }

      localStorage.setItem(STORAGE_KEYS.ROLE, 'authorized')
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj))
      setRole('authorized')
      setCurrentUser(userObj)
      return null
    } catch (err) {
      return err
    } finally {
      setLoading(false)
    }
  }

  // Generic Smart Sign-In wrapper (supports either passcode or phone+pin)
  const signIn = async (candidate, maybePin) => {
    if (maybePin) {
      return signInWithMemberPin(candidate, maybePin)
    }
    return signInWithPasscode(candidate)
  }

  // Set / Change Master Admin Passcode
  const setPasscode = async (passcode) => {
    setLoading(true)
    const newPasscode = (passcode || '').trim()

    try {
      if (!newPasscode || newPasscode.length < 6) {
        throw new Error('New passcode must be at least 6 characters.')
      }

      localStorage.setItem(STORAGE_KEYS.PASSCODE, newPasscode)
      localStorage.setItem(STORAGE_KEYS.ADMIN, 'yes')
      sessionStorage.setItem(STORAGE_KEYS.ADMIN, 'yes')
      localStorage.setItem(STORAGE_KEYS.ROLE, 'admin')

      const adminUser = { id: 'admin_master', name: 'Master Administrator', role: 'admin', designation: 'Festival President / Admin' }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser))
      setRole('admin')
      setCurrentUser(adminUser)

      if (supabase) {
        try {
          await supabase.rpc('set_admin_passcode', { new_passcode: newPasscode })
        } catch {}
      }

      return null
    } catch (err) {
      return err
    } finally {
      setLoading(false)
    }
  }

  // 3. Member Authorization Management (Admin Only)
  const addAuthorizedMember = (memberData) => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString()
    const newMember = {
      id: `auth_${Date.now()}`,
      name: (memberData.name || '').trim(),
      designation: (memberData.designation || 'Committee Member').trim(),
      phone: (memberData.phone || '').trim(),
      pin: memberData.pin ? String(memberData.pin).trim() : randomPin,
      role: memberData.role || 'authorized',
      created_at: new Date().toISOString()
    }

    const updated = [newMember, ...authorizedMembers]
    saveAuthorizedMembers(updated)
    return newMember
  }

  const updateAuthorizedMember = (id, updates) => {
    const updated = authorizedMembers.map((m) => (m.id === id ? { ...m, ...updates } : m))
    saveAuthorizedMembers(updated)
    return true
  }

  const removeAuthorizedMember = (id) => {
    const updated = authorizedMembers.filter((m) => m.id !== id)
    saveAuthorizedMembers(updated)
    return true
  }

  const regenerateMemberPin = (id) => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString()
    updateAuthorizedMember(id, { pin: newPin })
    return newPin
  }

  // 4. Lock / Sign Out of Portal
  const signOut = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN)
      localStorage.removeItem(STORAGE_KEYS.ADMIN)
      localStorage.removeItem(STORAGE_KEYS.ROLE)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } catch {}
    setRole('guest')
    setCurrentUser(null)
  }

  return {
    admin,
    authorized,
    role,
    currentUser,
    authorizedMembers,
    loading,
    signIn,
    signInWithPasscode,
    signInWithMemberPin,
    setPasscode,
    addAuthorizedMember,
    updateAuthorizedMember,
    removeAuthorizedMember,
    regenerateMemberPin,
    signOut,
    getActivePasscode
  }
}
