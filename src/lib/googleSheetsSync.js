/**
 * Google Sheets Real-time Auto-Sync Helper for Vinayaka Vedika 2026
 * Dispatches non-blocking background sync payloads to Google Apps Script Web App
 */

const DEFAULT_GDRIVE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbw3O382NowkBlPVFSfGbMEOM5SOw453GXbYLJQl5pmpFSTBfEHIvV2ok5UvoHH-wgIkEA/exec'

function getWebhookUrl() {
  try {
    return (
      import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
      localStorage.getItem('vv_gdrive_upload_url') ||
      DEFAULT_GDRIVE_WEBHOOK
    )
  } catch {
    return DEFAULT_GDRIVE_WEBHOOK
  }
}

/**
 * Dispatches an event to append a record to Google Sheets
 */
export async function syncRecordToGoogleSheets(sheetType, record) {
  const webhookUrl = getWebhookUrl()
  if (!webhookUrl) return { success: false, error: 'No webhook configured' }

  const payload = {
    action: 'append_row',
    sheet: sheetType, // 'donations', 'expenses', 'bids', 'volunteers'
    timestamp: new Date().toISOString(),
    data: record
  }

  try {
    // Non-blocking fire-and-forget with fetch keepalive / cors
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })

    if (!res.ok) {
      console.warn(`Google Sheets sync returned status ${res.status}`)
    }
    return { success: true }
  } catch (err) {
    // Graceful offline fallback: log warning without blocking UI
    console.warn('Google Sheets auto-sync offline/error:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Auto-sync wrapper for new donation
 */
export function syncNewDonation(donation) {
  return syncRecordToGoogleSheets('Donations', {
    Date: donation.date || new Date().toISOString().split('T')[0],
    Donor_Name: donation.name || donation.donor_name || 'Anonymous',
    Amount: donation.amount || 0,
    Phone: donation.phone || donation.mobile || '',
    Gotram: donation.gotram || '',
    Payment_Mode: donation.payment_mode || donation.method || 'Cash',
    Notes: donation.notes || ''
  })
}

/**
 * Auto-sync wrapper for new expense
 */
export function syncNewExpense(expense) {
  return syncRecordToGoogleSheets('Expenses', {
    Date: expense.date || new Date().toISOString().split('T')[0],
    Category: expense.category || 'General',
    Item: expense.item || expense.description || '',
    Amount: expense.amount || 0,
    Paid_To: expense.paid_to || expense.vendor || '',
    Payment_Mode: expense.payment_mode || 'Cash',
    Receipt_Photo: expense.receipt_url || ''
  })
}

