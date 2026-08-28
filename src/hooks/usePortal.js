import { useEffect, useState, useCallback } from 'react'
import { requireSupabase, supabase } from '../lib/supabase'

export const TABLES = [
  'settings',
  'committee_members',
  'donations',
  'expenses',
  'purchases',
  'bid_items',
  'bid_history',
  'awards',
  'nominees',
  'activities',
  'prasad_sponsors',
  'volunteers',
  'notices',
  'gallery_items',
  'music_playlist'
]

const getLocalPinnedDonations = () => {
  try {
    return JSON.parse(localStorage.getItem('vv_pinned_donations') || '[]')
  } catch {
    return []
  }
}

const setLocalPinnedDonation = (id, isPinned) => {
  try {
    const current = getLocalPinnedDonations()
    const updated = isPinned
      ? Array.from(new Set([...current, id]))
      : current.filter((x) => x !== id)
    localStorage.setItem('vv_pinned_donations', JSON.stringify(updated))
  } catch {}
}

const createEmptyData = () => Object.fromEntries(TABLES.map((table) => [table, []]))

/** Loads public portal data and exposes RLS-respecting mutations with local-state fallback. */
export function usePortal() {
  const [data, setData] = useState(createEmptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const results = {}
      await Promise.all(
        TABLES.map(async (table) => {
          try {
            // First try with ordered query
            let res = await supabase
              .from(table)
              .select('*')
              .order(table === 'notices' ? 'date' : 'created_at', { ascending: false })

            // If order fails (e.g. created_at column missing), retry without order
            if (res.error) {
              const retry = await supabase.from(table).select('*')
              if (!retry.error) {
                res = retry
              }
            }

            results[table] = res.data || []
          } catch {
            results[table] = []
          }
        })
      )

      // Merge local pinned state for donations
      const localPinned = getLocalPinnedDonations()
      if (results.donations) {
        results.donations = results.donations.map((d) => ({
          ...d,
          pinned: Boolean(d.pinned || localPinned.includes(d.id))
        }))
      }

      // Ensure every table in TABLES is always present as an array
      const completeData = {
        ...createEmptyData(),
        ...results
      }

      setData(completeData)
      setError('')
    } catch (err) {
      console.warn('Portal data fetch warning:', err)
      setError(err.message || '')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = async (table, values) => {
    try {
      const { error: insertError } = await requireSupabase().from(table).insert(values)
      if (insertError) {
        setError(insertError.message)
        return insertError
      }
      await refresh()
      return null
    } catch (err) {
      setError(err.message)
      return err
    }
  }

  const update = async (table, id, values) => {
    try {
      if (table === 'donations' && 'pinned' in values) {
        setLocalPinnedDonation(id, Boolean(values.pinned))
      }

      let { error: updateError } = await requireSupabase().from(table).update(values).eq('id', id)

      // Gracefully handle missing 'pinned' column in Supabase schema by retrying without it
      if (updateError && updateError.message && updateError.message.includes('pinned')) {
        const { pinned, ...restValues } = values
        const retry = await requireSupabase().from(table).update(restValues).eq('id', id)
        updateError = retry.error
      }

      if (updateError) {
        setError(updateError.message)
        return updateError
      }

      await refresh()
      return null
    } catch (err) {
      setError(err.message)
      return err
    }
  }

  const recordBid = async (itemId, bidder, amount) => {
    try {
      const { error: rpcError } = await requireSupabase().rpc('record_bid', {
        item_id: itemId,
        bidder_name: bidder,
        bid_amount: amount
      })
      if (rpcError) {
        setError(rpcError.message)
        return rpcError
      }
      await refresh()
      return null
    } catch (err) {
      setError(err.message)
      return err
    }
  }

  const closeBid = async (itemId, currentBidder, currentBid, itemName) => {
    try {
      const client = requireSupabase()
      const { error: closeError } = await client
        .from('bid_items')
        .update({ status: 'closed' })
        .eq('id', itemId)

      if (closeError) {
        setError(closeError.message)
        return closeError
      }

      if (currentBidder && currentBid) {
        await client.from('donations').insert({
          donor_name: currentBidder,
          amount: currentBid,
          date: new Date().toISOString().split('T')[0],
          note: `Winning bid: ${itemName || 'Auction item'}`
        })
      }

      await refresh()
      return null
    } catch (err) {
      setError(err.message)
      return err
    }
  }

  const remove = async (table, id) => {
    try {
      const { error: deleteError } = await requireSupabase().from(table).delete().eq('id', id)
      if (deleteError) {
        setError(deleteError.message)
        return deleteError
      }
      await refresh()
      return null
    } catch (err) {
      setError(err.message)
      return err
    }
  }

  return {
    data,
    loading,
    error,
    refresh,
    add,
    update,
    remove,
    recordBid,
    closeBid
  }
}
