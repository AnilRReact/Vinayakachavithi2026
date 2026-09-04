import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

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

// Default seed data for initial offline / fresh load
const DEFAULT_SETTINGS = [
  {
    id: 'default-settings',
    village_name: 'Vinayaka Vedika',
    tagline: 'Our village celebration, in one place.',
    festival_date: '2026-09-14',
    morning_aarti_time: '06:30 AM',
    evening_aarti_time: '07:30 PM',
    daily_schedule_note: 'Daily Pooja & Maha Harathi every morning & evening.',
    google_drive_upload_url: 'https://script.google.com/macros/s/AKfycbw3O382NowkBlPVFSfGbMEOM5SOw453GXbYLJQl5pmpFSTBfEHIvV2ok5UvoHH-wgIkEA/exec'
  }
]

const getLocalTable = (table) => {
  try {
    const raw = localStorage.getItem(`vv_data_${table}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  if (table === 'settings') return DEFAULT_SETTINGS
  return []
}

const setLocalTable = (table, items) => {
  try {
    localStorage.setItem(`vv_data_${table}`, JSON.stringify(items))
  } catch {}
}

const getInitialData = () => {
  const initial = {}
  TABLES.forEach((table) => {
    initial[table] = getLocalTable(table)
  })
  return initial
}

/**
 * Promise timeout helper to prevent hanging queries
 */
function withTimeout(promise, ms = 2500) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Fetch timed out')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}

/**
 * Offline-first, resilient portal data hook.
 * Never blocks the UI or gets stuck on loading.
 */
export function usePortal() {
  const [data, setData] = useState(getInitialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isFirstLoad = useRef(true)

  const refresh = useCallback(async () => {
    // If Supabase client is not available or unconfigured, end loading immediately
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Query all tables with a strict 3-second timeout so we NEVER get stuck on "Preparing the vedika..."
      await withTimeout(
        Promise.all(
          TABLES.map(async (table) => {
            try {
              let res = await supabase
                .from(table)
                .select('*')
                .order(table === 'notices' ? 'date' : 'created_at', { ascending: false })

              if (res.error) {
                const retry = await supabase.from(table).select('*')
                if (!retry.error) res = retry
              }

              if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
                setLocalTable(table, res.data)
                setData((prev) => ({ ...prev, [table]: res.data }))
              }
            } catch {
              // Gracefully ignore individual table failures and use local data
            }
          })
        ),
        3000
      )
    } catch {
      // Timeout or network error - continue using local storage data smoothly
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }, [])

  useEffect(() => {
    // Immediate unlock after 1.5s as an absolute safety barrier
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    refresh().finally(() => {
      clearTimeout(safetyTimer)
      setLoading(false)
    })

    return () => clearTimeout(safetyTimer)
  }, [refresh])

  const add = async (table, values) => {
    const newItem = {
      id: values.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      ...values
    }

    // 1. Immediately update local state & storage (Instant UI feedback!)
    setData((prev) => {
      const currentList = prev[table] || []
      const updatedList = [newItem, ...currentList]
      setLocalTable(table, updatedList)
      return { ...prev, [table]: updatedList }
    })

    // 2. Sync to Supabase in the background if available
    if (supabase) {
      try {
        const { error: insertError } = await supabase.from(table).insert(values)
        if (!insertError) {
          // background refresh
          refresh()
        }
      } catch {
        // Fallback already active
      }
    }

    return null
  }

  const update = async (table, id, values) => {
    // 1. Immediately update local state & storage
    setData((prev) => {
      const currentList = prev[table] || []
      const updatedList = currentList.map((item) =>
        item.id === id ? { ...item, ...values } : item
      )
      setLocalTable(table, updatedList)
      return { ...prev, [table]: updatedList }
    })

    // 2. Sync to Supabase in background
    if (supabase) {
      try {
        await supabase.from(table).update(values).eq('id', id)
      } catch {
        // Local state already updated
      }
    }

    return null
  }

  const remove = async (table, id) => {
    // 1. Immediately remove from local state & storage
    setData((prev) => {
      const currentList = prev[table] || []
      const updatedList = currentList.filter((item) => item.id !== id)
      setLocalTable(table, updatedList)
      return { ...prev, [table]: updatedList }
    })

    // 2. Sync deletion to Supabase in background
    if (supabase) {
      try {
        await supabase.from(table).delete().eq('id', id)
      } catch {
        // Local state already updated
      }
    }

    return null
  }

  const recordBid = async (itemId, bidder, amount) => {
    // Update local bid state immediately
    const bidEntry = {
      id: `bid_${Date.now()}`,
      item_id: itemId,
      bidder_name: bidder,
      bid_amount: amount,
      created_at: new Date().toISOString()
    }

    setData((prev) => {
      const prevBids = prev.bid_history || []
      const updatedBids = [bidEntry, ...prevBids]
      setLocalTable('bid_history', updatedBids)

      const prevItems = prev.bid_items || []
      const updatedItems = prevItems.map((item) =>
        item.id === itemId
          ? { ...item, current_bid: amount, current_bidder: bidder }
          : item
      )
      setLocalTable('bid_items', updatedItems)

      return {
        ...prev,
        bid_history: updatedBids,
        bid_items: updatedItems
      }
    })

    if (supabase) {
      try {
        await supabase.rpc('record_bid', {
          item_id: itemId,
          bidder_name: bidder,
          bid_amount: amount
        })
      } catch {
        // Local state already updated
      }
    }

    return null
  }

  const closeBid = async (itemId, currentBidder, currentBid, itemName) => {
    setData((prev) => {
      const prevItems = prev.bid_items || []
      const updatedItems = prevItems.map((item) =>
        item.id === itemId ? { ...item, status: 'closed' } : item
      )
      setLocalTable('bid_items', updatedItems)

      let updatedDonations = prev.donations || []
      if (currentBidder && currentBid) {
        const donationEntry = {
          id: `donation_auction_${Date.now()}`,
          donor_name: currentBidder,
          amount: currentBid,
          date: new Date().toISOString().split('T')[0],
          note: `Winning bid: ${itemName || 'Auction item'}`
        }
        updatedDonations = [donationEntry, ...updatedDonations]
        setLocalTable('donations', updatedDonations)
      }

      return {
        ...prev,
        bid_items: updatedItems,
        donations: updatedDonations
      }
    })

    if (supabase) {
      try {
        await supabase.from('bid_items').update({ status: 'closed' }).eq('id', itemId)
        if (currentBidder && currentBid) {
          await supabase.from('donations').insert({
            donor_name: currentBidder,
            amount: currentBid,
            date: new Date().toISOString().split('T')[0],
            note: `Winning bid: ${itemName || 'Auction item'}`
          })
        }
      } catch {}
    }

    return null
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
