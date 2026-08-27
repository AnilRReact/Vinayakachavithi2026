import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/** Reads the database role rather than inferring permissions from the UI. */
export function useAuth() {
  const [session, setSession] = useState(null), [role, setRole] = useState('viewer'), [loading, setLoading] = useState(true)
  const load = async (nextSession) => {
    setSession(nextSession)
    if (!nextSession || !supabase) { setRole('viewer'); setLoading(false); return }
    const { data } = await supabase.rpc('my_portal_role')
    setRole(data || 'viewer'); setLoading(false)
  }
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => load(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])
  return { session, role, loading, signOut: () => supabase?.auth.signOut() }
}
