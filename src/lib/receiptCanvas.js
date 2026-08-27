import { currency, fmtDate, tier } from './formatters'

/**
 * Loads an image from URL and returns a Promise resolving to HTMLImageElement.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image: ' + src))
    img.src = src
  })
}

/**
 * Generates a high-resolution, festive 1600x900 appreciation card / receipt
 * using the official Lord Ganesha backdrop template.
 *
 * @param {Object} record - The donor or sponsor record
 * @param {Object} settings - Festival settings (village_name, etc.)
 * @param {string} type - 'donation' | 'sponsor' | 'auction'
 */
export async function generateFestivalCard(record = {}, settings = {}, type = 'donation') {
  const canvas = document.createElement('canvas')
  const width = 1600
  const height = 900
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const villageName = settings.village_name || 'Vinayaka Vedika'
  const dateStr = fmtDate(record.date)
  const noteStr = record.note ? `“${record.note}”` : ''
  const recordId = (record.id || '0000').slice(0, 6).toUpperCase()

  // Determine donor vs sponsor specific fields
  let personName = 'Devotee / Contributor'
  let mainHighlight = ''
  let subHighlight = ''
  let cardTitle = 'DONATION APPRECIATION RECEIPT'
  let receiptNoLabel = `Receipt No: #VV-2026-${recordId}`

  if (type === 'sponsor') {
    personName = record.sponsor_name || record.name || 'Devotee Sponsor'
    cardTitle = 'PRASAD & BHANDARA SPONSOR CARD'
    receiptNoLabel = `Sponsor Ref: #PR-2026-${recordId}`
    mainHighlight = record.item || 'Maha Prasadam'
    subHighlight = '★ DEDICATED SEVA SPONSOR ★'
  } else if (type === 'auction') {
    personName = record.current_bidder || record.donor_name || record.name || 'Winning Bidder'
    cardTitle = 'DAY 3 AUCTION WINNER CARD'
    receiptNoLabel = `Auction Ref: #AUC-2026-${recordId}`
    mainHighlight = record.amount ? currency.format(record.amount) : (record.item_name || 'Winning Bid')
    subHighlight = '★ AUCTION PATRON ★'
  } else {
    // Default: donation
    personName = record.donor_name || record.name || 'Generous Contributor'
    cardTitle = 'DONATION APPRECIATION RECEIPT'
    const donorTier = tier(record.amount || 0)
    mainHighlight = currency.format(record.amount || 0)
    subHighlight = `★ ${donorTier.toUpperCase()} PATRON ★`
  }

  // 1. Draw Background Image
  try {
    const bgImg = await loadImage('/assets/ganesha-template-bg.jpg')
    ctx.drawImage(bgImg, 0, 0, width, height)
  } catch {
    // Fallback gradient if background image fails
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#5a0e08')
    bgGrad.addColorStop(0.5, '#7c1c10')
    bgGrad.addColorStop(1, '#9b2612')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)
  }

  // 2. Right Side Card Panel (Glassmorphism overlay on the mandala area)
  const panelX = 560
  const panelY = 70
  const panelW = 980
  const panelH = 760
  const panelCenterX = panelX + panelW / 2

  // Frosted dark-crimson card backdrop
  ctx.save()
  ctx.fillStyle = 'rgba(28, 6, 5, 0.78)'
  ctx.strokeStyle = '#D7952F'
  ctx.lineWidth = 3
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.roundRect(panelX, panelY, panelW, panelH, 18)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Inner gold decorative border
  ctx.strokeStyle = 'rgba(245, 180, 50, 0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20, 14)
  ctx.stroke()

  // 3. Header Banner Inside Card
  ctx.textAlign = 'center'

  // Sacred Mantra
  ctx.fillStyle = '#FFE0A0'
  ctx.font = 'bold 22px Mukta, sans-serif'
  ctx.fillText('🌿 ॐ శ్రీ గణేశాయ నమః 🌿 ॐ GANAPATHI BAPPA MORYA 🌿', panelCenterX, panelY + 48)

  // Village / Pandal Name
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 44px Georgia, "Yatra One", serif'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 8
  ctx.fillText(`🪔 ${villageName} 🪔`, panelCenterX, panelY + 104)
  ctx.shadowBlur = 0

  // Card Subtitle / Type
  ctx.fillStyle = '#FFD54F'
  ctx.font = 'bold 24px Mukta, sans-serif'
  ctx.fillText(cardTitle, panelCenterX, panelY + 144)

  // Meta Bar (Receipt No + Date)
  ctx.fillStyle = '#E0D2C0'
  ctx.font = '18px Mukta, sans-serif'
  ctx.fillText(`${receiptNoLabel}   ·   📅 ${dateStr}`, panelCenterX, panelY + 176)

  // Golden Divider
  ctx.strokeStyle = '#D7952F'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(panelX + 60, panelY + 196)
  ctx.lineTo(panelX + panelW - 60, panelY + 196)
  ctx.stroke()

  // 4. Recipient Presentation
  ctx.fillStyle = '#F5E6D3'
  ctx.font = '22px Mukta, sans-serif'
  ctx.fillText('Received with heartfelt devotion and gratitude from:', panelCenterX, panelY + 240)

  // Person / Sponsor Name
  ctx.fillStyle = '#FFF1B8'
  ctx.font = 'bold 48px Georgia, "Yatra One", serif'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 10
  ctx.fillText(personName, panelCenterX, panelY + 304)
  ctx.shadowBlur = 0

  // Sub Highlight (Tier or Sponsor Badge)
  ctx.fillStyle = '#FFA726'
  ctx.font = 'bold 20px Mukta, sans-serif'
  ctx.fillText(subHighlight, panelCenterX, panelY + 344)

  // 5. Main Highlight Box (Amount or Sponsored Item)
  const boxW = 540
  const boxH = 92
  const boxX = panelCenterX - boxW / 2
  const boxY = panelY + 372

  ctx.fillStyle = 'rgba(255, 248, 230, 0.12)'
  ctx.strokeStyle = '#FFCA28'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 38px Mukta, Georgia, sans-serif'
  ctx.fillText(mainHighlight, panelCenterX, boxY + 58)

  // 6. Gotram / Dedication Note (if present)
  let nextY = boxY + boxH + 34
  if (noteStr) {
    ctx.fillStyle = '#FFE57F'
    ctx.font = 'italic 21px Georgia, serif'
    ctx.fillText(`Gotram / Purpose: ${noteStr}`, panelCenterX, nextY)
    nextY += 34
  }

  // 7. Sacred Blessing Quote
  ctx.fillStyle = '#FFF8E1'
  ctx.font = 'italic 21px Georgia, serif'
  ctx.fillText('“May Lord Vighnaharta Ganesha bestow boundless peace, health,', panelCenterX, nextY + 12)
  ctx.fillText('joy, and prosperity upon you and your family.” 🙏', panelCenterX, nextY + 42)

  // 8. Footer Seal & Committee Signature
  const footerY = panelY + panelH - 34
  ctx.strokeStyle = 'rgba(215, 149, 47, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(panelX + 40, footerY - 24)
  ctx.lineTo(panelX + panelW - 40, footerY - 24)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#81C784'
  ctx.font = 'bold 18px Mukta, sans-serif'
  ctx.fillText('✓ Verified Official Record', panelX + 44, footerY)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#FFD54F'
  ctx.font = 'bold 20px Mukta, sans-serif'
  ctx.fillText('Utsava Committee 🙏', panelX + panelW - 44, footerY)

  return canvas
}

/**
 * Generates and triggers download of the PNG festival appreciation card.
 */
export async function downloadFestivalCard(record, settings = {}, type = 'donation') {
  try {
    const canvas = await generateFestivalCard(record, settings, type)
    const rawName = record.donor_name || record.sponsor_name || record.name || 'patron'
    const sanitizedName = rawName.replace(/[^a-z0-9]/gi, '_')
    const prefix = type === 'sponsor' ? 'Sponsor' : type === 'auction' ? 'Auction' : 'Receipt'

    const link = document.createElement('a')
    link.download = `${prefix}_${sanitizedName}_2026.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    return true
  } catch {
    return false
  }
}

/**
 * Backward compatibility alias for donations.
 */
export async function downloadReceiptImage(donation, settings) {
  return downloadFestivalCard(donation, settings, 'donation')
}
