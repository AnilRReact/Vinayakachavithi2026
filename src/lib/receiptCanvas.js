import { currency, fmtDate, tier } from './formatters'
import templateIvoryToran from '../assets/template-ivory-toran.png'
import templateMarigoldArch from '../assets/template-marigold-arch.png'
import templateLotusBlossom from '../assets/template-lotus-blossom.png'
import templateBgRed from '../assets/template-bg-red.jpg'
import templateBgYellow from '../assets/template-bg-yellow.jpg'
import templateBgGreen from '../assets/template-bg-green.jpg'
import templateBgPurple from '../assets/template-bg-purple.jpg'

export const TEMPLATE_THEMES = {
  ivory: {
    id: 'ivory',
    label: 'Ivory Toran (4K)',
    icon: '🪔',
    desc: 'Bells, Leaves & Kalash',
    orientation: 'portrait',
    bg: templateIvoryToran,
    width: 2160,
    height: 3040,
    primaryColor: '#68150F',
    accentColor: '#B45309',
    goldColor: '#D97706',
    boxBg: 'rgba(255, 251, 235, 0.95)',
    boxBorder: '#D97706'
  },
  marigold: {
    id: 'marigold',
    label: 'Marigold Arch (4K)',
    icon: '🌼',
    desc: 'Garlands & Mandala',
    orientation: 'portrait',
    bg: templateMarigoldArch,
    width: 2160,
    height: 3040,
    primaryColor: '#78170D',
    accentColor: '#C2410C',
    goldColor: '#F59E0B',
    boxBg: 'rgba(255, 253, 240, 0.95)',
    boxBorder: '#F59E0B'
  },
  lotus: {
    id: 'lotus',
    label: 'Lotus Blossom (4K)',
    icon: '🌸',
    desc: 'Seated Lotus Ganesha',
    orientation: 'portrait',
    bg: templateLotusBlossom,
    width: 2160,
    height: 3040,
    primaryColor: '#5C1410',
    accentColor: '#9A3412',
    goldColor: '#D97706',
    boxBg: 'rgba(254, 248, 236, 0.95)',
    boxBorder: '#D97706'
  },
  red: {
    id: 'red',
    label: 'Sacred Red (4K)',
    icon: '🔴',
    desc: '2026 Red Idol',
    orientation: 'landscape',
    bg: templateBgRed,
    width: 3200,
    height: 1800,
    accent: '#D7952F',
    panelBg: 'rgba(28, 4, 3, 0.92)'
  },
  yellow: {
    id: 'yellow',
    label: 'Golden Saffron (4K)',
    icon: '🟡',
    desc: '2026 Saffron Idol',
    orientation: 'landscape',
    bg: templateBgYellow,
    width: 3200,
    height: 1800,
    accent: '#F59E0B',
    panelBg: 'rgba(32, 18, 3, 0.92)'
  },
  green: {
    id: 'green',
    label: 'Emerald Seva (4K)',
    icon: '🟢',
    desc: '2026 Green Idol',
    orientation: 'landscape',
    bg: templateBgGreen,
    width: 3200,
    height: 1800,
    accent: '#22C55E',
    panelBg: 'rgba(6, 25, 14, 0.92)'
  },
  purple: {
    id: 'purple',
    label: 'Royal Amethyst (4K)',
    icon: '🟣',
    desc: '2026 Purple Idol',
    orientation: 'landscape',
    bg: templateBgPurple,
    width: 3200,
    height: 1800,
    accent: '#C084FC',
    panelBg: 'rgba(22, 6, 30, 0.92)'
  }
}

/**
 * Resolves the default 4K theme for a given segment type
 */
export function getDefaultThemeForSegment(type = 'donation') {
  if (type === 'activity' || type === 'event' || type === 'notice') return 'ivory'
  if (type === 'sponsor' || type === 'donation' || type === 'auction') return 'marigold'
  if (type === 'award' || type === 'volunteer' || type === 'nominee') return 'lotus'
  return 'marigold'
}

/**
 * Loads an image from URL with CORS
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
 * Generates an Ultra High-Definition 4K festive card / invitation / certificate
 *
 * @param {Object} record - The entity record
 * @param {Object} settings - Festival settings (village_name, etc.)
 * @param {string} type - 'donation' | 'sponsor' | 'volunteer' | 'notice' | 'activity' | 'award' | 'nominee' | 'auction'
 * @param {string} themeOverride - 'ivory' | 'marigold' | 'lotus' | 'red' | 'yellow' | 'green' | 'purple'
 */
export async function generateFestivalCard(record = {}, settings = {}, type = 'donation', themeOverride = null) {
  const activeThemeKey = themeOverride || getDefaultThemeForSegment(type)
  const theme = TEMPLATE_THEMES[activeThemeKey] || TEMPLATE_THEMES.marigold

  const canvas = document.createElement('canvas')
  canvas.width = theme.width
  canvas.height = theme.height
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
    cardTitle = 'PRASAD & BHANDARA SEVA SPONSOR'
    refLabel = `Sponsor Ref: #PR-2026-${recordId}`
    subHighlight = '★ DEDICATED SEVA SPONSOR ★'
    mainHighlight = record.item || 'Maha Prasadam'
    promptText = 'Sponsored with devotion & seva by:'
    blessingLine1 = '“May Lord Ganesha and Goddess Lakshmi shower divine abundance,'
    blessingLine2 = 'health, and joy on your family for your sacred Annadanam seva.” 🙏'
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
    cardTitle = 'POOJA & UTSAVA INVITATION'
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
    cardTitle = 'BEST PANDAL CONTEST RECOGNITION'
    refLabel = `Entry Ref: #PAN-2026-${recordId}`
    subHighlight = '★ UTSAVA PANDAL COMPETITION ★'
    mainHighlight = `🎪 ${record.name}`
    promptText = 'Official festival pandal nominee:'
    noteStr = record.note ? `Theme: “${record.note}”` : ''
    blessingLine1 = '“May Lord Ganesha bless your youth mandali with boundless'
    blessingLine2 = 'energy, unity, harmony, and grand success.” 🙏'
  } else if (type === 'auction') {
    personName = record.current_bidder || record.donor_name || record.name || 'Winning Bidder'
    cardTitle = 'DAY 3 AUCTION WINNER CERTIFICATE'
    refLabel = `Auction Ref: #AUC-2026-${recordId}`
    subHighlight = '★ SACRED PRASADAM AUCTION WINNER ★'
    mainHighlight = record.amount ? currency.format(record.amount) : (record.item_name || 'Winning Bid')
    promptText = 'Sacred laddu / prasadam auction awarded to:'
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

  // Draw 4K Background Template
  const bgImg = await loadImage(theme.bg)
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, theme.width, theme.height)
  }

  // =========================================================================
  // 1. PORTRAIT 4K RENDERING (Ivory Toran, Marigold Arch, Lotus Blossom)
  // =========================================================================
  if (theme.orientation === 'portrait') {
    const cx = theme.width / 2

    // --- TEMPLATE 1: IVORY TORAN & BELLS (POOJAS & INVITATIONS) ---
    if (activeThemeKey === 'ivory') {
      ctx.textAlign = 'center'

      // Top Tag / Invocation
      ctx.fillStyle = '#9A3412'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText('🌿 ॐ శ్రీ గణేశాయ నమః · YOU ARE CORDIALLY INVITED 🌿', cx, 1100)

      // Main Card Title
      ctx.fillStyle = '#6B1710'
      ctx.font = 'bold 84px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 1220)

      // Village Name Banner
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 54px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 1310)

      // Prompt Text
      ctx.fillStyle = '#44403C'
      ctx.font = '40px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 1420)

      // Person / Entity Name
      ctx.fillStyle = '#7C2414'
      ctx.font = personName.length > 25 ? 'bold 64px Georgia, serif' : 'bold 80px Georgia, "Yatra One", serif'
      ctx.fillText(personName, cx, 1530)

      // Sub Highlight Badge
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1610)

      // Highlight Box (Date, Time, Amount, Item)
      const boxW = 1440
      const boxH = 200
      const boxX = cx - boxW / 2
      const boxY = 1660

      ctx.fillStyle = 'rgba(255, 251, 235, 0.92)'
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#7C2414'
      ctx.font = mainHighlight.length > 30 ? 'bold 52px Mukta, sans-serif' : 'bold 64px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 120)

      // Venue / Reference / Date
      let nextY = boxY + boxH + 70
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, nextY)

      nextY += 60
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 38px Georgia, serif'
        ctx.fillText(noteStr, cx, nextY)
        nextY += 60
      }

      // Blessing
      ctx.fillStyle = '#57534E'
      ctx.font = 'italic 36px Georgia, serif'
      ctx.fillText(blessingLine1, cx, nextY)
      ctx.fillText(blessingLine2, cx, nextY + 50)

      // Verification Footer
      const footY = 2440
      ctx.strokeStyle = '#E7E5E4'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - 500, footY - 40)
      ctx.lineTo(cx + 500, footY - 40)
      ctx.stroke()

      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 34px Mukta, sans-serif'
      ctx.fillText('✓ Official Utsava Invitation & Record', cx, footY)
    }

    // --- TEMPLATE 2: MARIGOLD GARLAND ARCH (SPONSORS & DONATIONS) ---
    else if (activeThemeKey === 'marigold') {
      ctx.textAlign = 'center'

      // Top Tag
      ctx.fillStyle = '#9A3412'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText('🪔 JOIN US FOR THE GRAND SEVA CELEBRATION 🪔', cx, 1150)

      // Main Card Title
      ctx.fillStyle = '#78170D'
      ctx.font = 'bold 82px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 1260)

      // Village
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 52px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 1345)

      // Prompt
      ctx.fillStyle = '#44403C'
      ctx.font = '40px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 1445)

      // Person Name
      ctx.fillStyle = '#7C2414'
      ctx.font = personName.length > 25 ? 'bold 64px Georgia, serif' : 'bold 78px Georgia, "Yatra One", serif'
      ctx.fillText(personName, cx, 1545)

      // Sub Highlight
      ctx.fillStyle = '#C2410C'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1625)

      // Highlight Box
      const boxW = 1440
      const boxH = 200
      const boxX = cx - boxW / 2
      const boxY = 1675

      ctx.fillStyle = 'rgba(255, 253, 240, 0.95)'
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 4.5
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#7A150D'
      ctx.font = mainHighlight.length > 30 ? 'bold 52px Mukta, sans-serif' : 'bold 64px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 120)

      let nextY = boxY + boxH + 70
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, nextY)

      nextY += 60
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 38px Georgia, serif'
        ctx.fillText(noteStr, cx, nextY)
        nextY += 60
      }

      ctx.fillStyle = '#57534E'
      ctx.font = 'italic 36px Georgia, serif'
      ctx.fillText(blessingLine1, cx, nextY)
      ctx.fillText(blessingLine2, cx, nextY + 50)

      const footY = 2440
      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 34px Mukta, sans-serif'
      ctx.fillText('✓ Official Verified Record · Utsava Committee 🙏', cx, footY)
    }

    // --- TEMPLATE 3: LOTUS BLOSSOM & FLORAL (AWARDS & VOLUNTEERS) ---
    else if (activeThemeKey === 'lotus') {
      ctx.textAlign = 'center'

      // Invocation
      ctx.fillStyle = '#7C2414'
      ctx.font = 'italic 38px Georgia, serif'
      ctx.fillText('Shree Ganeshaya Namah', cx, 1640)

      ctx.fillStyle = '#78350F'
      ctx.font = 'italic 34px Georgia, serif'
      ctx.fillText('We seek the divine blessings of Lord Ganesha, the remover of obstacles.', cx, 1720)

      // Main Card Title
      ctx.fillStyle = '#5C1410'
      ctx.font = 'bold 78px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 1830)

      // Village
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 50px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 1910)

      // Prompt
      ctx.fillStyle = '#44403C'
      ctx.font = '38px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 2000)

      // Person Name
      ctx.fillStyle = '#7C2414'
      ctx.font = personName.length > 25 ? 'bold 64px Georgia, serif' : 'bold 78px Georgia, "Yatra One", serif'
      ctx.fillText(personName, cx, 2100)

      // Highlight Box
      const boxW = 1440
      const boxH = 190
      const boxX = cx - boxW / 2
      const boxY = 2150

      ctx.fillStyle = 'rgba(254, 248, 236, 0.95)'
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#7C2414'
      ctx.font = mainHighlight.length > 30 ? 'bold 48px Mukta, sans-serif' : 'bold 60px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 115)

      let nextY = boxY + boxH + 65
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, nextY)

      nextY += 55
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 36px Georgia, serif'
        ctx.fillText(noteStr, cx, nextY)
        nextY += 55
      }

      ctx.fillStyle = '#57534E'
      ctx.font = 'italic 34px Georgia, serif'
      ctx.fillText(blessingLine1, cx, nextY)
      ctx.fillText(blessingLine2, cx, nextY + 46)

      const footY = 2760
      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 34px Mukta, sans-serif'
      ctx.fillText('✓ Official Committee Honour · Utsava Committee 🙏', cx, footY)
    }
  }

  // =========================================================================
  // 2. LANDSCAPE 4K RENDERING (2026 Red, Yellow, Green, Purple Idols)
  // =========================================================================
  else {
    const scale = 2 // 3200x1800 4K
    const panelX = 1120
    const panelY = 120
    const panelW = 1960
    const panelH = 1560
    const panelCenterX = panelX + panelW / 2

    // Frosted Card Backdrop
    ctx.save()
    ctx.fillStyle = theme.panelBg || 'rgba(28, 4, 3, 0.92)'
    ctx.strokeStyle = theme.accent || '#D7952F'
    ctx.lineWidth = 6
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
    ctx.shadowBlur = 48
    ctx.beginPath()
    ctx.roundRect(panelX, panelY, panelW, panelH, 36)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Inner gold border
    ctx.strokeStyle = 'rgba(255, 215, 100, 0.55)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(panelX + 20, panelY + 20, panelW - 40, panelH - 40, 28)
    ctx.stroke()

    ctx.textAlign = 'center'

    // Mantra
    ctx.fillStyle = '#FFE0A0'
    ctx.font = 'bold 44px Mukta, sans-serif'
    ctx.fillText('🌿 ॐ శ్రీ గణేశాయ నమః 🌿 ॐ GANAPATHI BAPPA MORYA 🌿', panelCenterX, panelY + 92)

    // Village
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 88px Georgia, "Yatra One", serif'
    ctx.fillText(`🪔 ${villageName} 🪔`, panelCenterX, panelY + 200)

    // Card Title
    ctx.fillStyle = '#FFD54F'
    ctx.font = 'bold 48px Mukta, sans-serif'
    ctx.fillText(cardTitle, panelCenterX, panelY + 276)

    // Meta Bar
    ctx.fillStyle = '#E0D2C0'
    ctx.font = '36px Mukta, sans-serif'
    ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, panelCenterX, panelY + 340)

    // Divider
    ctx.strokeStyle = theme.accent || '#D7952F'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(panelX + 120, panelY + 376)
    ctx.lineTo(panelX + panelW - 120, panelY + 376)
    ctx.stroke()

    // Prompt
    ctx.fillStyle = '#F5E6D3'
    ctx.font = '44px Mukta, sans-serif'
    ctx.fillText(promptText, panelCenterX, panelY + 460)

    // Person Name
    ctx.fillStyle = '#FFF1B8'
    ctx.font = personName.length > 28 ? 'bold 72px Georgia, serif' : 'bold 92px Georgia, "Yatra One", serif'
    ctx.fillText(personName, panelCenterX, panelY + 580)

    // Sub Highlight
    ctx.fillStyle = '#FFA726'
    ctx.font = 'bold 40px Mukta, sans-serif'
    ctx.fillText(subHighlight, panelCenterX, panelY + 656)

    // Highlight Box
    const boxW = 1240
    const boxH = 176
    const boxX = panelCenterX - boxW / 2
    const boxY = panelY + 704

    ctx.fillStyle = 'rgba(255, 248, 230, 0.14)'
    ctx.strokeStyle = '#FFCA28'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = mainHighlight.length > 35 ? 'bold 56px Mukta, sans-serif' : 'bold 72px Mukta, Georgia, sans-serif'
    ctx.fillText(mainHighlight, panelCenterX, boxY + 108)

    let nextY = boxY + boxH + 68
    if (noteStr) {
      ctx.fillStyle = '#FFE57F'
      ctx.font = 'italic 40px Georgia, serif'
      ctx.fillText(noteStr, panelCenterX, nextY)
      nextY += 68
    }

    ctx.fillStyle = '#FFF8E1'
    ctx.font = 'italic 42px Georgia, serif'
    ctx.fillText(blessingLine1, panelCenterX, nextY + 20)
    ctx.fillText(blessingLine2, panelCenterX, nextY + 76)

    const footerY = panelY + panelH - 64
    ctx.strokeStyle = 'rgba(215, 149, 47, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(panelX + 80, footerY - 44)
    ctx.lineTo(panelX + panelW - 80, footerY - 44)
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = '#81C784'
    ctx.font = 'bold 36px Mukta, sans-serif'
    ctx.fillText('✓ Verified Official Record', panelX + 88, footerY)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#FFD54F'
    ctx.font = 'bold 40px Mukta, sans-serif'
    ctx.fillText('Utsava Committee 🙏', panelX + panelW - 88, footerY)
  }

  return canvas
}

/**
 * Generates and triggers download of the 4K PNG festival card.
 */
export async function downloadFestivalCard(record, settings = {}, type = 'donation', themeOverride = null) {
  try {
    const canvas = await generateFestivalCard(record, settings, type, themeOverride)
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
    link.download = `${prefix}_${sanitizedName}_2026_4K.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    return true
  } catch {
    return false
  }
}

/**
 * Shares the 4K Card/Receipt image directly via Web Share API or downloads with WhatsApp fallback
 */
export async function shareFestivalCardImage(record = {}, settings = {}, type = 'donation', themeOverride = null) {
  try {
    const canvas = await generateFestivalCard(record, settings, type, themeOverride)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Canvas blob generation failed')

    const rawName =
      record.donor_name ||
      record.sponsor_name ||
      record.recipient ||
      record.title ||
      record.name ||
      'Festival_Card'
    const fileName = `${type.toUpperCase()}_${rawName.slice(0, 24).replace(/[^a-z0-9]/gi, '_')}_4K.png`
    const file = new File([blob], fileName, { type: 'image/png' })
    const villageName = settings.village_name || 'Vinayaka Vedika'

    let shareTitle = `${villageName} 2026`
    if (type === 'donation') shareTitle = `Donation Receipt - ${rawName}`
    else if (type === 'sponsor') shareTitle = `Prasad Sponsor Card - ${rawName}`
    else if (type === 'volunteer') shareTitle = `Seva Duty Pass - ${rawName}`
    else if (type === 'notice') shareTitle = `Official Announcement - ${villageName}`
    else if (type === 'activity' || type === 'event') shareTitle = `Pooja Invitation - ${rawName}`
    else if (type === 'award') shareTitle = `Seva Puraskar Award - ${rawName}`
    else if (type === 'nominee') shareTitle = `Best Pandal Nominee - ${rawName}`
    else if (type === 'auction') shareTitle = `Auction Winner - ${rawName}`

    const shareText = `🪔 *${shareTitle}*\n*${villageName} — 2026* 🙏\nGanapathi Bappa Morya!`

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: shareTitle,
        text: shareText
      })
      return { sharedDirectly: true }
    } else {
      // Desktop / fallback
      const link = document.createElement('a')
      link.download = fileName
      link.href = canvas.toDataURL('image/png')
      link.click()

      const targetPhone = record.phone || record.contact || ''
      const digits = String(targetPhone).replace(/\D/g, '')
      const phoneParam = digits ? (digits.length === 10 ? `91${digits}` : digits) : ''
      const encoded = encodeURIComponent(
        `🪔 *${shareTitle}*\n*${villageName} 2026*\n\n(The high-resolution 4K card image has been downloaded to your device.)`
      )
      const url = phoneParam
        ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`
      window.open(url, '_blank', 'noopener,noreferrer')
      return { sharedDirectly: false, downloaded: true }
    }
  } catch (err) {
    if (err.name === 'AbortError') return { cancelled: true }
    return { error: err.message }
  }
}
