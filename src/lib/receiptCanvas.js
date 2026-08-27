import { currency, fmtDate, tier } from './formatters'
import ganeshaBg from '../assets/ganesha-template-bg.jpg'

/**
 * Loads an image from URL and returns a Promise resolving to HTMLImageElement or null.
 */
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Generates a high-resolution 1600x900 festive appreciation card / receipt / certificate
 * using the official Lord Ganesha backdrop template for all record types.
 *
 * @param {Object} record - The entity record
 * @param {Object} settings - Festival settings (village_name, etc.)
 * @param {string} type - 'donation' | 'sponsor' | 'volunteer' | 'notice' | 'activity' | 'award' | 'nominee' | 'auction'
 */
export async function generateFestivalCard(record = {}, settings = {}, type = 'donation') {
  const canvas = document.createElement('canvas')
  const width = 1600
  const height = 900
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const villageName = settings.village_name || 'Vinayaka Vedika'
  const recordId = (record.id || '0000').slice(0, 6).toUpperCase()

  let personName = 'Devotee / Contributor'
  let cardTitle = 'DONATION APPRECIATION RECEIPT'
  let refLabel = `Receipt No: #VV-2026-${recordId}`
  let subHighlight = '★ PATRON ★'
  let mainHighlight = ''
  let promptText = 'Received with heartfelt devotion and gratitude from:'
  let noteStr = record.note ? `“${record.note}”` : ''
  let blessingLine1 = '“May Lord Vighnaharta Ganesha bestow boundless peace, health,'
  let blessingLine2 = 'joy, and prosperity upon you and your family.” 🙏'

  if (type === 'sponsor') {
    personName = record.sponsor_name || record.name || 'Devotee Sponsor'
    cardTitle = 'PRASAD & BHANDARA SPONSOR'
    refLabel = `Sponsor Ref: #PR-2026-${recordId}`
    subHighlight = '★ DEDICATED SEVA SPONSOR ★'
    mainHighlight = record.item || 'Maha Prasadam'
    promptText = 'Sponsored with devotion & seva by:'
  } else if (type === 'volunteer') {
    personName = record.name || 'Dedicated Volunteer'
    cardTitle = 'VOLUNTEER SEVA DUTY PASS'
    refLabel = `Seva ID: #VOL-2026-${recordId}`
    subHighlight = '★ UTSAVA SEVA VOLUNTEER ★'
    mainHighlight = `Duty: ${record.duty || 'Festival Seva'}`
    promptText = 'Official festival seva assigned to:'
    noteStr = `Duty Date: ${fmtDate(record.date)}${record.contact ? ` · 📞 ${record.contact}` : ''}`
    blessingLine1 = '“May Lord Ganesha shower divine grace upon you for your'
    blessingLine2 = 'dedicated and selfless service to the community.” 🙏'
  } else if (type === 'notice') {
    personName = villageName
    cardTitle = 'OFFICIAL PANDAL ANNOUNCEMENT'
    refLabel = `Notice Ref: #NOT-2026-${recordId}`
    subHighlight = record.pinned ? '★ PINNED IMPORTANT ANNOUNCEMENT ★' : '★ PUBLIC FESTIVAL NOTICE ★'
    mainHighlight = record.message || 'Festival Announcement'
    promptText = 'Official announcement for all devotees & villagers:'
    noteStr = `Published on: ${fmtDate(record.date)}`
    blessingLine1 = '“Ganapathi Bappa Morya! All devotees and families are'
    blessingLine2 = 'warmly welcome to join the festivities and poojas.” 🙏'
  } else if (type === 'activity' || type === 'event') {
    personName = record.title || 'Festival Event'
    cardTitle = 'POOJA & EVENT INVITATION'
    refLabel = `Event Ref: #EVT-2026-${recordId}`
    subHighlight = '★ CORDIAL INVITATION ★'
    mainHighlight = `📅 ${fmtDate(record.date)}${record.start_time ? ` at ${record.start_time}` : ''}`
    promptText = 'You and your family are cordially invited to:'
    noteStr = `📍 Venue: ${record.location || villageName} ${record.description ? `· ${record.description}` : ''}`
    blessingLine1 = '“Join the sacred rituals and receive the divine blessings'
    blessingLine2 = 'of Lord Vighnaharta Sri Ganesha.” 🙏'
  } else if (type === 'award') {
    personName = record.recipient || 'Honoured Devotee'
    cardTitle = 'SEVA PURASKAR · RECOGNITION AWARD'
    refLabel = `Award Ref: #AWD-2026-${recordId}`
    subHighlight = `★ ${record.year || '2026'} FESTIVAL HONOUR ★`
    mainHighlight = `🏆 ${record.title || 'Seva Puraskar'}`
    promptText = 'Presented in recognition of distinguished service to:'
    noteStr = record.note ? `Citation: “${record.note}”` : ''
    blessingLine1 = '“In deep appreciation for your invaluable dedication,'
    blessingLine2 = 'generosity, and devotion to our village celebration.” 🙏'
  } else if (type === 'nominee') {
    personName = record.name || 'Pandal Mandali'
    cardTitle = 'BEST PANDAL RECOGNITION'
    refLabel = `Entry Ref: #PAN-2026-${recordId}`
    subHighlight = '★ UTSAVA PANDAL COMPETITION ★'
    mainHighlight = `🎪 ${record.name}`
    promptText = 'Official festival pandal nominee:'
    noteStr = record.note ? `Theme: “${record.note}”` : ''
    blessingLine1 = '“May Lord Ganesha bless your youth mandali with boundless'
    blessingLine2 = 'energy, unity, harmony, and grand success.” 🙏'
  } else if (type === 'auction') {
    personName = record.current_bidder || record.donor_name || record.name || 'Winning Bidder'
    cardTitle = 'DAY 3 AUCTION WINNER CARD'
    refLabel = `Auction Ref: #AUC-2026-${recordId}`
    subHighlight = '★ AUCTION PATRON ★'
    mainHighlight = record.amount ? currency.format(record.amount) : (record.item_name || 'Winning Bid')
    promptText = 'Sacred prasadam / laddu auction awarded to:'
    noteStr = record.item_name ? `Item: ${record.item_name}` : ''
    blessingLine1 = '“May the sacred prasadam bring health, prosperity, and'
    blessingLine2 = 'immense auspiciousness to your home.” 🙏'
  } else {
    // Default: donation
    personName = record.donor_name || record.name || 'Generous Contributor'
    cardTitle = 'DONATION APPRECIATION RECEIPT'
    refLabel = `Receipt No: #VV-2026-${recordId}`
    const donorTier = tier(record.amount || 0)
    subHighlight = `★ ${donorTier.toUpperCase()} PATRON ★`
    mainHighlight = currency.format(record.amount || 0)
    promptText = 'Received with heartfelt devotion and gratitude from:'
  }

  // 1. Draw Background Image or Fallback Gradient
  const bgImg = await loadImage(ganeshaBg)
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height)
  } else {
    // Rich fallback gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#380604')
    bgGrad.addColorStop(0.4, '#6a160d')
    bgGrad.addColorStop(0.8, '#8b2014')
    bgGrad.addColorStop(1, '#a82c1a')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)

    // Gold outer frame
    ctx.strokeStyle = '#D7952F'
    ctx.lineWidth = 10
    ctx.strokeRect(20, 20, width - 40, height - 40)
  }

  // 2. Right Side Card Panel
  const panelX = 560
  const panelY = 60
  const panelW = 980
  const panelH = 780
  const panelCenterX = panelX + panelW / 2

  // Frosted dark-crimson card backdrop
  ctx.save()
  ctx.fillStyle = 'rgba(28, 6, 5, 0.88)'
  ctx.strokeStyle = '#D7952F'
  ctx.lineWidth = 3
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.roundRect(panelX, panelY, panelW, panelH, 18)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Inner gold decorative border
  ctx.strokeStyle = 'rgba(245, 180, 50, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20, 14)
  ctx.stroke()

  // 3. Header Banner Inside Card
  ctx.textAlign = 'center'

  // Sacred Mantra
  ctx.fillStyle = '#FFE0A0'
  ctx.font = 'bold 22px Mukta, sans-serif'
  ctx.fillText('🌿 ॐ శ్రీ గణేశాయ నమః 🌿 ॐ GANAPATHI BAPPA MORYA 🌿', panelCenterX, panelY + 46)

  // Village / Pandal Name
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 44px Georgia, "Yatra One", serif'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 8
  ctx.fillText(`🪔 ${villageName} 🪔`, panelCenterX, panelY + 100)
  ctx.shadowBlur = 0

  // Card Subtitle / Type
  ctx.fillStyle = '#FFD54F'
  ctx.font = 'bold 24px Mukta, sans-serif'
  ctx.fillText(cardTitle, panelCenterX, panelY + 138)

  // Meta Bar (Ref No + Date)
  const dateStr = fmtDate(record.date)
  ctx.fillStyle = '#E0D2C0'
  ctx.font = '18px Mukta, sans-serif'
  ctx.fillText(`${refLabel}   ·   📅 ${dateStr}`, panelCenterX, panelY + 170)

  // Golden Divider
  ctx.strokeStyle = '#D7952F'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(panelX + 60, panelY + 188)
  ctx.lineTo(panelX + panelW - 60, panelY + 188)
  ctx.stroke()

  // 4. Prompt & Person / Entity Presentation
  ctx.fillStyle = '#F5E6D3'
  ctx.font = '22px Mukta, sans-serif'
  ctx.fillText(promptText, panelCenterX, panelY + 230)

  // Person / Entity Name (with auto font size scaling)
  ctx.fillStyle = '#FFF1B8'
  ctx.font = personName.length > 28 ? 'bold 36px Georgia, serif' : 'bold 46px Georgia, "Yatra One", serif'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 10
  ctx.fillText(personName, panelCenterX, panelY + 290)
  ctx.shadowBlur = 0

  // Sub Highlight (Tier or Badge)
  ctx.fillStyle = '#FFA726'
  ctx.font = 'bold 20px Mukta, sans-serif'
  ctx.fillText(subHighlight, panelCenterX, panelY + 328)

  // 5. Main Highlight Box
  const boxW = 620
  const boxH = 88
  const boxX = panelCenterX - boxW / 2
  const boxY = panelY + 352

  ctx.fillStyle = 'rgba(255, 248, 230, 0.14)'
  ctx.strokeStyle = '#FFCA28'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = mainHighlight.length > 35 ? 'bold 28px Mukta, sans-serif' : 'bold 36px Mukta, Georgia, sans-serif'
  ctx.fillText(mainHighlight, panelCenterX, boxY + 54)

  // 6. Gotram / Detail / Description (if present)
  let nextY = boxY + boxH + 34
  if (noteStr) {
    ctx.fillStyle = '#FFE57F'
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText(noteStr, panelCenterX, nextY)
    nextY += 34
  }

  // 7. Sacred Blessing Quote
  ctx.fillStyle = '#FFF8E1'
  ctx.font = 'italic 21px Georgia, serif'
  ctx.fillText(blessingLine1, panelCenterX, nextY + 10)
  ctx.fillText(blessingLine2, panelCenterX, nextY + 38)

  // 8. Footer Seal & Signature
  const footerY = panelY + panelH - 32
  ctx.strokeStyle = 'rgba(215, 149, 47, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(panelX + 40, footerY - 22)
  ctx.lineTo(panelX + panelW - 40, footerY - 22)
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
 * Generates and triggers download of the PNG festival appreciation card for any record type.
 */
export async function downloadFestivalCard(record, settings = {}, type = 'donation') {
  try {
    const canvas = await generateFestivalCard(record, settings, type)
    const rawName =
      record.donor_name ||
      record.sponsor_name ||
      record.recipient ||
      record.title ||
      record.name ||
      'Festival_Card'
    const sanitizedName = rawName.slice(0, 30).replace(/[^a-z0-9]/gi, '_')
    const prefix = type.toUpperCase()

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
