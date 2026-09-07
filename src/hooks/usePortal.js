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

const DEFAULT_SETTINGS = [
  {
    id: 'default-settings',
    village_name: 'Vinayaka Vedika 2026',
    tagline: 'Our village celebration, in one place.',
    festival_date: '2026-09-14',
    morning_aarti_time: '06:30 AM',
    evening_aarti_time: '07:30 PM',
    daily_schedule_note: 'Daily Pooja & Maha Harathi every morning & evening. All devotees are welcome.',
    google_drive_upload_url: 'https://script.google.com/macros/s/AKfycbx1uG_Vy7dQDjUbzUHEtvRC8v8bQa7WVQ090PO8RaJo2LeirNa4B4Y9VpZojEyci51G/exec'
  }
]

const getLocalTable = (table) => {
  try {
    const raw = localStorage.getItem(`vv_data_${table}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
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

function withTimeout(promise, ms = 3500) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Fetch timed out')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}

/**
 * Real-time Multi-device Portal Data Hook.
 * Synchronizes across all mobile phones, tablets, and computers.
 */
export function usePortal() {
  const [data, setData] = useState(getInitialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isFirstLoad = useRef(true)

  // Master synchronization function
  const refresh = useCallback(async () => {
    // 1. Fetch from Central Serverless Cloud Sync API (/api/portal-sync)
    try {
      const res = await withTimeout(fetch('/api/portal-sync', { method: 'GET' }), 4000)
      if (res && res.ok) {
        const json = await res.json()
        if (json && json.data) {
          const cloudData = json.data
          setData((prev) => {
            const next = { ...prev }
            TABLES.forEach((table) => {
              if (Array.isArray(cloudData[table])) {
                next[table] = cloudData[table]
                setLocalTable(table, cloudData[table])
              }
            })
            return next
          })
        }
      }
    } catch (apiErr) {
      // Offline fallback already loaded from localStorage
    }

    // 2. Query Supabase directly if client is configured
    if (supabase) {
      try {
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
              } catch {}
            })
          ),
          3500
        )
      } catch {}
    }

    setLoading(false)
    isFirstLoad.current = false
  }, [])

  useEffect(() => {
    // Initial fetch on mount
    refresh()

    // Safety timer to clear loading spinner
    const timer = setTimeout(() => setLoading(false), 800)

    // Periodic real-time background sync (every 6 seconds) across all active mobile devices
    const interval = setInterval(() => {
      refresh()
    }, 6000)

    // Auto-sync when switching back to tab/browser on mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  const add = async (table, values) => {
    const newItem = {
      id: values.id || `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      ...values
    }

    // 1. Immediately update local state & storage (0ms instant UI feedback!)
    setData((prev) => {
      const currentList = prev[table] || []
      const updatedList = [newItem, ...currentList.filter((i) => i.id !== newItem.id)]
      setLocalTable(table, updatedList)
      return { ...prev, [table]: updatedList }
    })

    // 2. Broadcast to Central Cloud Serverless Sync API (/api/portal-sync)
    try {
      fetch('/api/portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', table, record: newItem })
      }).catch(() => {})
    } catch {}

    // 3. Sync to Supabase in background if available
    if (supabase) {
      try {
        await supabase.from(table).insert(newItem)
      } catch {}
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

    // 2. Broadcast to Central Cloud Serverless Sync API
    try {
      fetch('/api/portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', table, id, record: values })
      }).catch(() => {})
    } catch {}

    // 3. Sync to Supabase in background
    if (supabase) {
      try {
        await supabase.from(table).update(values).eq('id', id)
      } catch {}
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

    // 2. Broadcast deletion to Central Cloud Serverless Sync API
    try {
      fetch('/api/portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', table, id })
      }).catch(() => {})
    } catch {}

    // 3. Sync deletion to Supabase in background
    if (supabase) {
      try {
        await supabase.from(table).delete().eq('id', id)
      } catch {}
    }

    return null
  }

  const recordBid = async (itemId, bidder, amount) => {
    const bidEntry = {
      id: `bid_${Date.now()}`,
      bid_item_id: itemId,
      bidder: bidder,
      amount: Number(amount),
      created_at: new Date().toISOString()
    }

    // 1. Update bid items & history locally
    setData((prev) => {
      const updatedBidItems = (prev.bid_items || []).map((item) =>
        item.id === itemId
          ? { ...item, current_bid: Number(amount), current_bidder: bidder }
          : item
      )
      const updatedHistory = [bidEntry, ...(prev.bid_history || [])]

      setLocalTable('bid_items', updatedBidItems)
      setLocalTable('bid_history', updatedHistory)

      return {
        ...prev,
        bid_items: updatedBidItems,
        bid_history: updatedHistory
      }
    })

    // 2. Broadcast to Central Cloud Serverless Sync API
    try {
      fetch('/api/portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          table: 'bid_items',
          id: itemId,
          record: { current_bid: Number(amount), current_bidder: bidder }
        })
      }).catch(() => {})

      fetch('/api/portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          table: 'bid_history',
          record: bidEntry
        })
      }).catch(() => {})
    } catch {}

    // 3. Sync to Supabase in background
    if (supabase) {
      try {
        await supabase.from('bid_history').insert(bidEntry)
        await supabase.from('bid_items').update({
          current_bid: Number(amount),
          current_bidder: bidder
        }).eq('id', itemId)
      } catch {}
    }

    return null
  }

  const closeBid = async (itemId) => {
    const item = (data.bid_items || []).find((i) => i.id === itemId)
    if (!item) return new Error('Auction item not found.')

    // Update status to closed
    await update('bid_items', itemId, { status: 'closed' })

    // If there was a winning bidder, auto-record winning donation
    if (item.current_bidder && item.current_bid) {
      await add('donations', {
        donor_name: item.current_bidder,
        amount: Number(item.current_bid),
        date: new Date().toISOString().split('T')[0],
        note: `Winning Bid: ${item.item_name} (Laddu Auction)`
      })
    }

    return null
  }

  const syncAllToCloud = async (customData) => {
    const payloadData = customData || data
    try {
      const res = await fetch('/api/portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_sync', allData: payloadData })
      })
      if (!res.ok) throw new Error('Failed to push data to cloud.')
      return null
    } catch (err) {
      return err
    }
  }

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    refresh,
    recordBid,
    closeBid,
    syncAllToCloud
  }
}

