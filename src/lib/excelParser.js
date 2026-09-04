/**
 * Universal Excel & CSV Data Extraction Engine for Vinayaka Vedika
 * Supports .xlsx, .xls, and .csv files with smart column auto-detection,
 * fuzzy matching, validation, normalization, and sample template generation.
 */

export const SEGMENT_CONFIGS = {
  donations: {
    id: 'donations',
    label: 'Donations & Chanda (చందా / విరాళాలు)',
    icon: '💰',
    table: 'donations',
    requiredFields: ['donor_name', 'amount'],
    fields: [
      {
        name: 'donor_name',
        label: 'Donor Name',
        required: true,
        aliases: ['name', 'donor', 'devotee', 'contributor', 'donor_name', 'chanda_name', 'person', 'పేరు', 'భక్తుడు', 'దాత', 'చందాదారుడు']
      },
      {
        name: 'amount',
        label: 'Amount (₹)',
        required: true,
        type: 'number',
        aliases: ['amount', 'amt', 'chanda', 'donation', 'total', 'paid', 'rs', 'inr', 'price', 'రూపాయలు', 'మొత్తం', 'చందా']
      },
      {
        name: 'phone',
        label: 'Phone / Contact',
        aliases: ['phone', 'contact', 'mobile', 'cell', 'phone_number', 'mobile_no', 'నంబర్', 'ఫోన్', 'మొబైల్']
      },
      {
        name: 'gotram',
        label: 'Gotram / Family',
        aliases: ['gotram', 'gothram', 'gotra', 'family', 'sur_name', 'ఇంటిపేరు', 'గోత్రం']
      },
      {
        name: 'date',
        label: 'Donation Date',
        type: 'date',
        aliases: ['date', 'donation_date', 'chanda_date', 'entry_date', 'తేది', 'దినము']
      },
      {
        name: 'note',
        label: 'Note / Payment Mode',
        aliases: ['note', 'remarks', 'mode', 'upi', 'cash', 'comments', 'status', 'వివరాలు']
      }
    ],
    sampleData: [
      { 'Donor Name': 'Sri K. Venkateswarlu & Family', 'Amount (₹)': 5000, 'Phone / Contact': '9848012345', 'Gotram / Family': 'Kashyapa', 'Donation Date': '2026-09-14', 'Note / Payment Mode': 'Online UPI' },
      { 'Donor Name': 'M/s Sai Traders (Anil)', 'Amount (₹)': 10000, 'Phone / Contact': '9440156789', 'Gotram / Family': 'Bharadwaja', 'Donation Date': '2026-09-14', 'Note / Payment Mode': 'Cash Receipt' },
      { 'Donor Name': 'Sri R. Ramakrishna Garu', 'Amount (₹)': 2500, 'Phone / Contact': '9989011223', 'Gotram / Family': 'Kaundinya', 'Donation Date': '2026-09-15', 'Note / Payment Mode': 'Prasadam Seva' }
    ]
  },
  expenses: {
    id: 'expenses',
    label: 'Expenses & Purchases (ఖర్చులు)',
    icon: '💸',
    table: 'expenses',
    requiredFields: ['item', 'amount'],
    fields: [
      {
        name: 'item',
        label: 'Item / Purpose',
        required: true,
        aliases: ['item', 'name', 'purpose', 'description', 'particulars', 'material', 'item_name', 'వస్తువు', 'వివరము']
      },
      {
        name: 'amount',
        label: 'Amount (₹)',
        required: true,
        type: 'number',
        aliases: ['amount', 'amt', 'cost', 'spent', 'price', 'total', 'rs', 'inr', 'ఖర్చు', 'మొత్తం']
      },
      {
        name: 'category',
        label: 'Category',
        aliases: ['category', 'cat', 'type', 'head', 'group', 'ఖర్చు_రకం', 'విభాగం']
      },
      {
        name: 'paid_to',
        label: 'Paid To / Vendor',
        aliases: ['paid_to', 'vendor', 'shop', 'receiver', 'person', 'చెల్లించినది', 'షాపు_పేరు']
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        aliases: ['date', 'expense_date', 'bill_date', 'తేది']
      },
      {
        name: 'is_asset',
        label: 'Is Reusable Asset (Yes/No)',
        type: 'boolean',
        aliases: ['is_asset', 'asset', 'reusable', 'permanent', 'ఆస్తి']
      }
    ],
    sampleData: [
      { 'Item / Purpose': 'Grand Pandal Mandapam Tent Setup', 'Amount (₹)': 35000, 'Category': 'Mandapam & Tent', 'Paid To / Vendor': 'Sri Sai Tent House', 'Date': '2026-09-12', 'Is Reusable Asset (Yes/No)': 'No' },
      { 'Item / Purpose': 'Brass Pooja Aarti Lamps (2 Sets)', 'Amount (₹)': 4500, 'Category': 'Pooja Materials', 'Paid To / Vendor': 'Lakshmi Metal Works', 'Date': '2026-09-13', 'Is Reusable Asset (Yes/No)': 'Yes' },
      { 'Item / Purpose': 'Maha Prasadam Laddu & Rice Groceries', 'Amount (₹)': 18000, 'Category': 'Food & Prasadam', 'Paid To / Vendor': 'Balaji Kirana Stores', 'Date': '2026-09-14', 'Is Reusable Asset (Yes/No)': 'No' }
    ]
  },
  prasad_sponsors: {
    id: 'prasad_sponsors',
    label: 'Prasad & Annadanam Sponsors (ప్రసాద దాతలు)',
    icon: '🍛',
    table: 'prasad_sponsors',
    requiredFields: ['sponsor_name', 'item'],
    fields: [
      {
        name: 'sponsor_name',
        label: 'Sponsor Name',
        required: true,
        aliases: ['sponsor_name', 'name', 'sponsor', 'devotee', 'donor', 'దాత_పేరు', 'పేరు']
      },
      {
        name: 'item',
        label: 'Prasadam / Food Item',
        required: true,
        aliases: ['item', 'prasadam', 'food', 'dish', 'menu', 'item_name', 'ప్రసాదం']
      },
      {
        name: 'date',
        label: 'Date / Day',
        type: 'date',
        aliases: ['date', 'day', 'seva_date', 'తేది']
      },
      {
        name: 'amount',
        label: 'Contribution Amount (₹)',
        type: 'number',
        aliases: ['amount', 'amt', 'cost', 'val', 'rs', 'విలువ', 'మొత్తం']
      },
      {
        name: 'phone',
        label: 'Phone / Contact',
        aliases: ['phone', 'contact', 'mobile', 'cell', 'ఫోన్']
      },
      {
        name: 'note',
        label: 'Special Notes',
        aliases: ['note', 'remarks', 'details', 'వివరాలు']
      }
    ],
    sampleData: [
      { 'Sponsor Name': 'Sri M. Ramesh & Brothers', 'Prasadam / Food Item': 'Maha Annadanam (500 Devotees)', 'Date / Day': '2026-09-14', 'Contribution Amount (₹)': 25000, 'Phone / Contact': '9849012345', 'Special Notes': 'Day 1 Grand Annadanam' },
      { 'Sponsor Name': 'Smt. & Sri G. Anjaneyulu', 'Prasadam / Food Item': '108 Modaks & Dry Fruit Laddu', 'Date / Day': '2026-09-15', 'Contribution Amount (₹)': 5000, 'Phone / Contact': '9440198765', 'Special Notes': 'Special Morning Harathi' }
    ]
  },
  volunteers: {
    id: 'volunteers',
    label: 'Volunteers & Seva Duty Roster (సేవకులు)',
    icon: '👥',
    table: 'volunteers',
    requiredFields: ['name', 'duty'],
    fields: [
      {
        name: 'name',
        label: 'Volunteer Name',
        required: true,
        aliases: ['name', 'volunteer', 'youth', 'person', 'member', 'సేవకుడు', 'పేరు']
      },
      {
        name: 'duty',
        label: 'Assigned Seva Duty',
        required: true,
        aliases: ['duty', 'role', 'assignment', 'responsibility', 'seva', 'పని', 'బాధ్యత']
      },
      {
        name: 'date',
        label: 'Duty Date',
        type: 'date',
        aliases: ['date', 'duty_date', 'shift', 'తేది']
      },
      {
        name: 'contact',
        label: 'Phone / Mobile',
        aliases: ['contact', 'phone', 'mobile', 'cell', 'ఫోన్']
      },
      {
        name: 'note',
        label: 'Duty Notes / Shift',
        aliases: ['note', 'remarks', 'shift_time', 'వివరాలు']
      }
    ],
    sampleData: [
      { 'Volunteer Name': 'K. Sai Krishna', 'Assigned Seva Duty': 'Prasadam Counter & Queue Management', 'Duty Date': '2026-09-14', 'Phone / Mobile': '9848099887', 'Duty Notes / Shift': 'Morning 08:00 AM - 01:00 PM' },
      { 'Volunteer Name': 'P. Vamsi', 'Assigned Seva Duty': 'Sound System & Cultural Stage Coordination', 'Duty Date': '2026-09-14', 'Phone / Mobile': '9848011223', 'Duty Notes / Shift': 'Evening Harathi' }
    ]
  },
  activities: {
    id: 'activities',
    label: 'Pooja & Event Schedule (పూజా కార్యక్రమాలు)',
    icon: '🪔',
    table: 'activities',
    requiredFields: ['title', 'date'],
    fields: [
      {
        name: 'title',
        label: 'Pooja / Event Title',
        required: true,
        aliases: ['title', 'pooja', 'event', 'program', 'ceremony', 'కార్యక్రమం', 'పూజ_పేరు']
      },
      {
        name: 'date',
        label: 'Date',
        required: true,
        type: 'date',
        aliases: ['date', 'event_date', 'day', 'తేది']
      },
      {
        name: 'start_time',
        label: 'Time',
        aliases: ['start_time', 'time', 'timing', 'start', 'సమయం']
      },
      {
        name: 'location',
        label: 'Venue / Location',
        aliases: ['location', 'venue', 'place', 'spot', 'స్థలం']
      },
      {
        name: 'description',
        label: 'Pooja Details / Priest',
        aliases: ['description', 'details', 'notes', 'priest', 'వివరణ']
      }
    ],
    sampleData: [
      { 'Pooja / Event Title': 'Ganapathi Homam & Prana Pratishtha', 'Date': '2026-09-14', 'Time': '08:30 AM', 'Venue / Location': 'Main Pandal', 'Pooja Details / Priest': 'Conducted by Sri Rama Murthy Siddhanti' },
      { 'Pooja / Event Title': 'Sahasra Modaka Maha Harathi', 'Date': '2026-09-15', 'Time': '07:30 PM', 'Venue / Location': 'Main Pandal', 'Pooja Details / Priest': 'All devotees are welcome' }
    ]
  },
  committee_members: {
    id: 'committee_members',
    label: 'Committee Members (కమిటీ సభ్యులు)',
    icon: '🎖️',
    table: 'committee_members',
    requiredFields: ['name', 'role'],
    fields: [
      {
        name: 'name',
        label: 'Member Name',
        required: true,
        aliases: ['name', 'member', 'person', 'పేరు', 'సభ్యుడు']
      },
      {
        name: 'role',
        label: 'Designation / Role',
        required: true,
        aliases: ['role', 'designation', 'position', 'title', 'పదవి', 'హోదా']
      },
      {
        name: 'phone',
        label: 'Phone / Contact',
        aliases: ['phone', 'contact', 'mobile', 'cell', 'ఫోన్']
      },
      {
        name: 'photo_url',
        label: 'Photo URL',
        aliases: ['photo_url', 'photo', 'image', 'pic']
      }
    ],
    sampleData: [
      { 'Member Name': 'Sri K. Venkat Reddy', 'Designation / Role': 'President (అధ్యక్షులు)', 'Phone / Contact': '9848012345', 'Photo URL': '' },
      { 'Member Name': 'Sri T. Suresh Kumar', 'Designation / Role': 'Treasurer (కోశాధికారి)', 'Phone / Contact': '9440156789', 'Photo URL': '' }
    ]
  }
}

/**
 * Normalizes string for fuzzy comparison
 */
function normalizeHeader(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\u0C00-\u0C7F]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Parses numeric currency strings like "₹ 5,000/-" into 5000
 */
export function parseAmount(val) {
  if (typeof val === 'number') return Math.round(val)
  if (!val) return 0
  const clean = String(val).replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(clean)
  return isNaN(parsed) ? 0 : Math.round(parsed)
}

/**
 * Parses various date formats into YYYY-MM-DD
 */
export function parseDate(val, defaultDate = new Date().toISOString().slice(0, 10)) {
  if (!val) return defaultDate
  if (val instanceof Date && !isNaN(val)) return val.toISOString().slice(0, 10)

  // Check if it's an Excel serial date number
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().slice(0, 10)
  }

  const str = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

  // Format DD/MM/YYYY or DD-MM-YYYY
  const parts1 = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (parts1) {
    const day = parts1[1].padStart(2, '0')
    const month = parts1[2].padStart(2, '0')
    const year = parts1[3]
    return `${year}-${month}-${day}`
  }

  // Fallback native date parsing
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return defaultDate
}

/**
 * Built-in robust CSV Parser (RFC 4180 compliant)
 */
export function parseCSV(text = '') {
  const cleanText = text.replace(/^\uFEFF/, '') // Strip UTF-8 BOM
  const lines = []
  let currentRow = []
  let currentField = ''
  let insideQuotes = false

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"'
          i++ // skip escaped quote
        } else {
          insideQuotes = false
        }
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        insideQuotes = true
      } else if (char === ',' || char === '\t' || char === ';') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') i++
        currentRow.push(currentField.trim())
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow)
        }
        currentRow = []
        currentField = ''
      } else {
        currentField += char
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow)
    }
  }

  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = lines[0].map((h) => h.replace(/^["']|["']$/g, '').trim())
  const rows = []

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r]
    const rowObj = {}
    let hasVal = false
    headers.forEach((h, idx) => {
      const val = line[idx] !== undefined ? line[idx] : ''
      rowObj[h] = val
      if (val) hasVal = true
    })
    if (hasVal) rows.push(rowObj)
  }

  return { headers, rows }
}

/**
 * Reads any File (.xlsx, .xls, .csv) and returns extracted { headers, rows }
 */
export async function parseUploadedFile(file) {
  const fileName = file.name.toLowerCase()

  // 1. Try XLSX (SheetJS) if available
  try {
    const XLSX = await import('xlsx').catch(() => null)
    if (XLSX && (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv'))) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false })

      if (jsonData && jsonData.length > 0) {
        const headers = Object.keys(jsonData[0] || {})
        return { headers, rows: jsonData, totalRows: jsonData.length }
      }
    }
  } catch (err) {
    console.warn('XLSX parsing fallback to text reader:', err)
  }

  // 2. CSV / Plain text fallback
  const text = await file.text()
  const result = parseCSV(text)
  return { headers: result.headers, rows: result.rows, totalRows: result.rows.length }
}

/**
 * Computes Smart Auto-Column Mapping for a segment type
 */
export function autoMapColumns(headers = [], segmentKey = 'donations') {
  const config = SEGMENT_CONFIGS[segmentKey] || SEGMENT_CONFIGS.donations
  const mapping = {} // { targetFieldName: sourceHeaderName }

  config.fields.forEach((field) => {
    let bestMatch = null
    const targetNorm = normalizeHeader(field.name)
    const labelNorm = normalizeHeader(field.label)

    for (const h of headers) {
      const hNorm = normalizeHeader(h)

      // Exact match
      if (hNorm === targetNorm || hNorm === labelNorm) {
        bestMatch = h
        break
      }

      // Alias match
      if (field.aliases && field.aliases.some((alias) => hNorm === normalizeHeader(alias) || hNorm.includes(normalizeHeader(alias)))) {
        bestMatch = h
        break
      }
    }

    mapping[field.name] = bestMatch || ''
  })

  return mapping
}

/**
 * Extracts and sanitizes raw rows into validated target records
 */
export function extractAndValidateRows(rows = [], mapping = {}, segmentKey = 'donations') {
  const config = SEGMENT_CONFIGS[segmentKey] || SEGMENT_CONFIGS.donations
  const validRecords = []
  const invalidRecords = []
  let totalAmountSum = 0

  rows.forEach((rawRow, idx) => {
    const record = {}
    let isValid = true
    const errors = []

    config.fields.forEach((field) => {
      const sourceCol = mapping[field.name]
      const rawVal = sourceCol ? rawRow[sourceCol] : ''

      if (field.type === 'number') {
        const num = parseAmount(rawVal)
        record[field.name] = num
        if (field.name === 'amount') totalAmountSum += num
      } else if (field.type === 'date') {
        record[field.name] = parseDate(rawVal)
      } else if (field.type === 'boolean') {
        const str = String(rawVal).toLowerCase().trim()
        record[field.name] = str === 'yes' || str === 'true' || str === '1' || str === 'y' || str === 'అవును'
      } else {
        record[field.name] = String(rawVal || '').trim()
      }
    })

    // Check required fields
    config.requiredFields.forEach((req) => {
      if (!record[req] || (typeof record[req] === 'string' && record[req].trim().length === 0)) {
        isValid = false
        const fieldMeta = config.fields.find((f) => f.name === req)
        errors.push(`Missing required field: ${fieldMeta ? fieldMeta.label : req}`)
      }
    })

    const extractedItem = {
      _rowIndex: idx + 1,
      _isValid: isValid,
      _errors: errors,
      _raw: rawRow,
      ...record
    }

    if (isValid) {
      validRecords.push(extractedItem)
    } else {
      invalidRecords.push(extractedItem)
    }
  })

  return {
    validRecords,
    invalidRecords,
    totalAmountSum,
    totalCount: rows.length,
    validCount: validRecords.length,
    invalidCount: invalidRecords.length
  }
}

/**
 * Downloads a ready-to-use Sample Excel / CSV template for organizers
 */
export async function downloadSampleTemplate(segmentKey = 'donations', format = 'xlsx') {
  const config = SEGMENT_CONFIGS[segmentKey] || SEGMENT_CONFIGS.donations
  const sampleData = config.sampleData || []
  const fileName = `Sample_${config.id.toUpperCase()}_Template_2026.${format}`

  // Try XLSX export if available
  if (format === 'xlsx') {
    try {
      const XLSX = await import('xlsx').catch(() => null)
      if (XLSX) {
        const worksheet = XLSX.utils.json_to_sheet(sampleData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, config.label.slice(0, 30))
        XLSX.writeFile(workbook, fileName)
        return true
      }
    } catch (err) {
      console.warn('XLSX export fallback to CSV:', err)
    }
  }

  // CSV Fallback export
  const headers = Object.keys(sampleData[0] || {})
  const csvLines = [headers.join(',')]

  sampleData.forEach((row) => {
    const line = headers.map((h) => {
      const val = String(row[h] || '').replace(/"/g, '""')
      return `"${val}"`
    })
    csvLines.push(line.join(','))
  })

  const csvContent = '\uFEFF' + csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Sample_${config.id.toUpperCase()}_Template_2026.csv`
  link.click()
  return true
}

/**
 * Exports any existing portal table data to CSV / Excel
 */
export async function exportTableToExcel(dataArray = [], segmentKey = 'donations', fileName = 'Festival_Data_2026.xlsx') {
  if (!dataArray || dataArray.length === 0) return false
  const config = SEGMENT_CONFIGS[segmentKey] || SEGMENT_CONFIGS.donations

  // Clean data keys for clean Excel columns
  const formattedRows = dataArray.map((row) => {
    const formatted = {}
    config.fields.forEach((field) => {
      formatted[field.label] = row[field.name] !== undefined ? row[field.name] : ''
    })
    return formatted
  })

  try {
    const XLSX = await import('xlsx').catch(() => null)
    if (XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(formattedRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, config.label.slice(0, 30))
      XLSX.writeFile(workbook, fileName)
      return true
    }
  } catch {}

  // CSV fallback
  const headers = Object.keys(formattedRows[0] || {})
  const csvLines = [headers.join(',')]
  formattedRows.forEach((row) => {
    const line = headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`)
    csvLines.push(line.join(','))
  })

  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName.replace(/\.xlsx$/, '.csv')
  link.click()
  return true
}

