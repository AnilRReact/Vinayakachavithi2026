import { currency, fmtDate, tier } from './formatters'
import ganeshIdol2026 from '../assets/ganesh-idol-2026.jpg'
import ganeshIdolRed from '../assets/ganesh-idol-red.jpg'
import ganeshIdolYellow from '../assets/ganesh-idol-yellow.jpg'
import ganeshIdolGreen from '../assets/ganesh-idol-green.jpg'
import ganeshIdolPurple from '../assets/ganesh-idol-purple.jpg'

export const TEMPLATE_THEMES = {
  ivory: {
    id: 'ivory',
    label: 'Ivory Toran & Kalash (4K)',
    icon: '🪔',
    desc: 'Bells, Leaves & Deepam',
    orientation: 'portrait',
    width: 2160,
    height: 3040,
    primaryColor: '#5C1410',
    accentColor: '#B45309',
    goldColor: '#D97706'
  },
  marigold: {
    id: 'marigold',
    label: 'Marigold Arch (4K)',
    icon: '🌼',
    desc: 'Garlands & Archway',
    orientation: 'portrait',
    width: 2160,
    height: 3040,
    primaryColor: '#78170D',
    accentColor: '#C2410C',
    goldColor: '#F59E0B'
  },
  lotus: {
    id: 'lotus',
    label: 'Lotus Blossom (4K)',
    icon: '🌸',
    desc: 'Lotus Ganesha & Blossoms',
    orientation: 'portrait',
    width: 2160,
    height: 3040,
    primaryColor: '#4A0E0A',
    accentColor: '#9A3412',
    goldColor: '#D97706'
  },
  red: {
    id: 'red',
    label: 'Sacred Red 2026 Idol (4K)',
    icon: '🔴',
    desc: 'Official Red Idol',
    orientation: 'landscape',
    width: 3200,
    height: 1800,
    idolImg: ganeshIdolRed || ganeshIdol2026,
    accent: '#D7952F',
    bgStart: '#2A0403',
    bgEnd: '#58100B',
    panelBg: 'rgba(28, 4, 3, 0.93)'
  },
  yellow: {
    id: 'yellow',
    label: 'Golden Saffron 2026 Idol (4K)',
    icon: '🟡',
    desc: 'Official Saffron Idol',
    orientation: 'landscape',
    width: 3200,
    height: 1800,
    idolImg: ganeshIdolYellow || ganeshIdol2026,
    accent: '#F59E0B',
    bgStart: '#2E1503',
    bgEnd: '#683608',
    panelBg: 'rgba(32, 18, 3, 0.93)'
  },
  green: {
    id: 'green',
    label: 'Emerald Seva 2026 Idol (4K)',
    icon: '🟢',
    desc: 'Official Green Idol',
    orientation: 'landscape',
    width: 3200,
    height: 1800,
    idolImg: ganeshIdolGreen || ganeshIdol2026,
    accent: '#22C55E',
    bgStart: '#06190E',
    bgEnd: '#134626',
    panelBg: 'rgba(6, 25, 14, 0.93)'
  },
  purple: {
    id: 'purple',
    label: 'Royal Amethyst 2026 Idol (4K)',
    icon: '🟣',
    desc: 'Official Purple Idol',
    orientation: 'landscape',
    width: 3200,
    height: 1800,
    idolImg: ganeshIdolPurple || ganeshIdol2026,
    accent: '#C084FC',
    bgStart: '#16061E',
    bgEnd: '#431355',
    panelBg: 'rgba(22, 6, 30, 0.93)'
  }
}

/**
 * Resolves the default 4K theme for a given segment type
 */
export function getDefaultThemeForSegment(type = 'donation') {
  if (type === 'activity' || type === 'event' || type === 'notice') return 'ivory'
  if (type === 'sponsor' || type === 'donation' || type === 'auction') return 'marigold'
  if (type === 'award' || type === 'volunteer' || type === 'nominee') return 'lotus'
  return 'ivory'
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

// ===========================================================================
// VECTOR ART HELPERS (RAZOR-SHARP AT 4K RESOLUTION)
// ===========================================================================

/**
 * Draws an ornate gold border frame with decorative corners
 */
function drawOrnateFrame(ctx, x, y, w, h, goldColor = '#D97706', innerPadding = 24) {
  ctx.save()

  // Outer primary gold border
  ctx.strokeStyle = goldColor
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 20)
  ctx.stroke()

  // Thin secondary inner border
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x + innerPadding, y + innerPadding, w - innerPadding * 2, h - innerPadding * 2, 14)
  ctx.stroke()

  // Corner floral ornaments
  const cornerSize = 48
  const corners = [
    [x + innerPadding, y + innerPadding],
    [x + w - innerPadding, y + innerPadding],
    [x + innerPadding, y + h - innerPadding],
    [x + w - innerPadding, y + h - innerPadding]
  ]

  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = goldColor
    ctx.beginPath()
    ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = goldColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, Math.PI * 2)
    ctx.stroke()
  })

  ctx.restore()
}

/**
 * Draws a glowing sacred Om Ganesha insignia with radiant sunburst
 */
function drawOmGaneshaEmblem(ctx, cx, cy, radius = 130) {
  ctx.save()

  // Sunburst aura rays
  const rays = 32
  for (let i = 0; i < rays; i++) {
    const angle = (i * Math.PI * 2) / rays
    const x1 = cx + Math.cos(angle) * (radius * 0.9)
    const y1 = cy + Math.sin(angle) * (radius * 0.9)
    const x2 = cx + Math.cos(angle) * (radius * 1.35)
    const y2 = cy + Math.sin(angle) * (radius * 1.35)

    ctx.strokeStyle = i % 2 === 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.2)'
    ctx.lineWidth = i % 2 === 0 ? 3.5 : 2
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // Golden circular halo medallion
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius)
  grad.addColorStop(0, '#FEF3C7')
  grad.addColorStop(0.6, '#FDE68A')
  grad.addColorStop(0.9, '#F59E0B')
  grad.addColorStop(1, '#B45309')

  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(245, 158, 11, 0.5)'
  ctx.shadowBlur = 30
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Outer beaded gold ring
  ctx.strokeStyle = '#78350F'
  ctx.lineWidth = 4
  ctx.stroke()

  const beads = 28
  for (let i = 0; i < beads; i++) {
    const angle = (i * Math.PI * 2) / beads
    const bx = cx + Math.cos(angle) * (radius - 12)
    const by = cy + Math.sin(angle) * (radius - 12)
    ctx.fillStyle = '#78350F'
    ctx.beginPath()
    ctx.arc(bx, by, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Sacred Om symbol
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#7C2414'
  ctx.font = 'bold 110px "Yatra One", "Noto Serif Telugu", Georgia, serif'
  ctx.fillText('ॐ', cx, cy + 6)

  ctx.restore()
}

/**
 * Draws hanging mango leaves, marigold flowers, and golden brass temple bells
 */
function drawHangingToran(ctx, width, height) {
  ctx.save()

  // Top hanging garland rope
  ctx.strokeStyle = '#D97706'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(60, 90)
  ctx.quadraticCurveTo(width / 2, 130, width - 60, 90)
  ctx.stroke()

  const leavesCount = 13
  const step = (width - 240) / (leavesCount - 1)

  for (let i = 0; i < leavesCount; i++) {
    const lx = 120 + i * step
    const progress = i / (leavesCount - 1)
    const ly = 90 + Math.sin(progress * Math.PI) * 35

    // Mango leaf
    ctx.save()
    ctx.translate(lx, ly)
    ctx.fillStyle = i % 2 === 0 ? '#15803D' : '#166534'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(24, 70, 0, 130)
    ctx.quadraticCurveTo(-24, 70, 0, 0)
    ctx.fill()

    // Leaf vein
    ctx.strokeStyle = '#4ADE80'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 5)
    ctx.lineTo(0, 120)
    ctx.stroke()
    ctx.restore()

    // Marigold flower on top of leaf
    ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#EA580C'
    ctx.beginPath()
    ctx.arc(lx, ly, 18, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(lx, ly, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Hanging brass bells on left and right
  const bells = [
    [160, 180],
    [width - 160, 180]
  ]

  bells.forEach(([bx, by]) => {
    // Chain
    ctx.strokeStyle = '#B45309'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(bx, 100)
    ctx.lineTo(bx, by)
    ctx.stroke()

    // Bell dome
    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.moveTo(bx - 32, by + 50)
    ctx.quadraticCurveTo(bx - 28, by, bx, by)
    ctx.quadraticCurveTo(bx + 28, by, bx + 32, by + 50)
    ctx.closePath()
    ctx.fill()

    // Bell rim
    ctx.fillStyle = '#D97706'
    ctx.beginPath()
    ctx.roundRect(bx - 36, by + 48, 72, 12, 6)
    ctx.fill()

    // Clapper
    ctx.fillStyle = '#78350F'
    ctx.beginPath()
    ctx.arc(bx, by + 66, 8, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}

/**
 * Draws sacred Kalash with coconut, mango leaves, and glowing oil deepam lamps at base
 */
function drawKalashAndDiyas(ctx, width, height) {
  ctx.save()
  const cy = height - 190
  const cx = width / 2

  // Center glowing oil diya
  const diyaGrad = ctx.createRadialGradient(cx, cy - 30, 5, cx, cy - 30, 80)
  diyaGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)')
  diyaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)')
  diyaGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')

  ctx.fillStyle = diyaGrad
  ctx.beginPath()
  ctx.arc(cx, cy - 30, 80, 0, Math.PI * 2)
  ctx.fill()

  // Diya lamp body
  ctx.fillStyle = '#B45309'
  ctx.beginPath()
  ctx.moveTo(cx - 70, cy)
  ctx.quadraticCurveTo(cx, cy + 50, cx + 70, cy)
  ctx.quadraticCurveTo(cx + 90, cy - 20, cx, cy - 10)
  ctx.quadraticCurveTo(cx - 90, cy - 20, cx - 70, cy)
  ctx.fill()

  // Flame
  ctx.fillStyle = '#FDE047'
  ctx.beginPath()
  ctx.moveTo(cx, cy - 65)
  ctx.quadraticCurveTo(cx + 18, cy - 30, cx, cy - 10)
  ctx.quadraticCurveTo(cx - 18, cy - 30, cx, cy - 65)
  ctx.fill()

  // Left and Right Kalash pots
  const kalashPositions = [cx - 480, cx + 480]
  kalashPositions.forEach((kx) => {
    // Copper pot
    ctx.fillStyle = '#C2410C'
    ctx.beginPath()
    ctx.arc(kx, cy + 10, 55, 0, Math.PI * 2)
    ctx.fill()

    // Pot neck & rim
    ctx.fillStyle = '#D97706'
    ctx.beginPath()
    ctx.roundRect(kx - 35, cy - 50, 70, 16, 4)
    ctx.fill()

    // Mango leaves spreading from neck
    ctx.fillStyle = '#15803D'
    ctx.beginPath()
    ctx.moveTo(kx - 45, cy - 45)
    ctx.lineTo(kx - 75, cy - 95)
    ctx.lineTo(kx - 25, cy - 70)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(kx + 45, cy - 45)
    ctx.lineTo(kx + 75, cy - 95)
    ctx.lineTo(kx + 25, cy - 70)
    ctx.fill()

    // Coconut top
    ctx.fillStyle = '#78350F'
    ctx.beginPath()
    ctx.moveTo(kx - 30, cy - 48)
    ctx.quadraticCurveTo(kx, cy - 120, kx + 30, cy - 48)
    ctx.fill()

    // Gold decorative swastik on pot
    ctx.fillStyle = '#FEF08A'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('卐', kx, cy + 18)
  })

  ctx.restore()
}

/**
 * Draws vertical cascading marigold garlands on left and right borders
 */
function drawMarigoldSideGarlands(ctx, width, height) {
  ctx.save()
  const garlandLeft = 140
  const garlandRight = width - 140
  const count = 18
  const step = (height - 300) / count

  for (let i = 0; i < count; i++) {
    const y = 160 + i * step
    const color1 = i % 2 === 0 ? '#F59E0B' : '#EA580C'
    const color2 = i % 2 === 0 ? '#EA580C' : '#F59E0B'

    // Left Garland Flower
    ctx.fillStyle = color1
    ctx.beginPath()
    ctx.arc(garlandLeft, y, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(garlandLeft, y, 10, 0, Math.PI * 2)
    ctx.fill()

    // Right Garland Flower
    ctx.fillStyle = color2
    ctx.beginPath()
    ctx.arc(garlandRight, y, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(garlandRight, y, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  // Top arching marigold garland
  const topCount = 14
  const topStep = (width - 320) / topCount
  for (let i = 0; i <= topCount; i++) {
    const x = 160 + i * topStep
    const y = 130 + Math.sin((i / topCount) * Math.PI) * 40
    ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#EA580C'
    ctx.beginPath()
    ctx.arc(x, y, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Draws blooming pink lotus flower with glowing petals
 */
function drawPinkLotus(ctx, cx, cy, scale = 1.0) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)

  // Glowing pink lotus petals
  const petals = [
    { x: 0, y: -60, angle: 0 },
    { x: -35, y: -45, angle: -0.3 },
    { x: 35, y: -45, angle: 0.3 },
    { x: -65, y: -25, angle: -0.6 },
    { x: 65, y: -25, angle: 0.6 },
    { x: -90, y: 0, angle: -0.9 },
    { x: 90, y: 0, angle: 0.9 }
  ]

  petals.forEach(({ x, y, angle }) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    const petalGrad = ctx.createLinearGradient(0, -50, 0, 40)
    petalGrad.addColorStop(0, '#F43F5E')
    petalGrad.addColorStop(0.5, '#FB7185')
    petalGrad.addColorStop(1, '#FFF1F2')

    ctx.fillStyle = petalGrad
    ctx.beginPath()
    ctx.moveTo(0, -50)
    ctx.quadraticCurveTo(24, 0, 0, 40)
    ctx.quadraticCurveTo(-24, 0, 0, -50)
    ctx.fill()
    ctx.restore()
  })

  // Lotus center pod
  ctx.fillStyle = '#FDE047'
  ctx.beginPath()
  ctx.ellipse(0, 10, 36, 16, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// ===========================================================================
// MASTER 4K FESTIVAL CARD GENERATOR
// ===========================================================================

export async function generateFestivalCard(record = {}, settings = {}, type = 'donation', themeOverride = null) {
  const activeThemeKey = themeOverride || getDefaultThemeForSegment(type)
  const theme = TEMPLATE_THEMES[activeThemeKey] || TEMPLATE_THEMES.ivory

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

  // =========================================================================
  // 1. PORTRAIT 4K RENDERING (Ivory Toran, Marigold Arch, Lotus Blossom)
  // =========================================================================
  if (theme.orientation === 'portrait') {
    const W = theme.width // 2160
    const H = theme.height // 3040
    const cx = W / 2

    // --- TEMPLATE 1: IVORY TORAN & KALASH (INVITATIONS & POOJAS) ---
    if (activeThemeKey === 'ivory') {
      // 1. Pristine Silk Ivory Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#FFFDF7')
      bgGrad.addColorStop(0.5, '#FFFBF0')
      bgGrad.addColorStop(1, '#FFF5DF')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // 2. Ornate Outer Gold Border
      drawOrnateFrame(ctx, 80, 80, W - 160, H - 160, '#D97706', 24)

      // 3. Hanging Mango Leaf Toran & Bells
      drawHangingToran(ctx, W, H)

      // 4. Centerpiece Glowing Om Ganesha Insignia
      drawOmGaneshaEmblem(ctx, cx, 580, 160)

      // 5. Card Header
      ctx.textAlign = 'center'
      ctx.fillStyle = '#78350F'
      ctx.font = 'bold 40px Mukta, sans-serif'
      ctx.fillText('🌿 YOU ARE CORDIALLY INVITED TO CELEBRATE 🌿', cx, 830)

      // 6. Main Card Title
      ctx.fillStyle = '#5C1410'
      ctx.font = 'bold 96px Georgia, "Yatra One", serif'
      ctx.shadowColor = 'rgba(92, 20, 16, 0.2)'
      ctx.shadowBlur = 10
      ctx.fillText(cardTitle, cx, 950)
      ctx.shadowBlur = 0

      // 7. Village / Pandal Name
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 56px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 1040)

      // Decorative divider
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 360, 1080)
      ctx.lineTo(cx + 360, 1080)
      ctx.stroke()

      // 8. Prompt Text
      ctx.fillStyle = '#44403C'
      ctx.font = '42px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 1160)

      // 9. Person / Entity Name
      ctx.fillStyle = '#7C2414'
      ctx.font = personName.length > 25 ? 'bold 70px Georgia, serif' : 'bold 88px Georgia, "Yatra One", serif'
      ctx.shadowColor = 'rgba(124, 36, 20, 0.25)'
      ctx.shadowBlur = 8
      ctx.fillText(personName, cx, 1270)
      ctx.shadowBlur = 0

      // 10. Sub Highlight Badge
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1345)

      // 11. Highlight Card Box (Event Details, Date, Time, Amount)
      const boxW = 1520
      const boxH = 220
      const boxX = cx - boxW / 2
      const boxY = 1400

      ctx.fillStyle = 'rgba(255, 251, 235, 0.96)'
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 4.5
      ctx.shadowColor = 'rgba(217, 119, 6, 0.15)'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 24)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#7C2414'
      ctx.font = mainHighlight.length > 30 ? 'bold 54px Mukta, sans-serif' : 'bold 68px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 130)

      // 12. Ref No & Date
      let nextY = boxY + boxH + 80
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 42px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, nextY)

      nextY += 70
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 40px Georgia, serif'
        ctx.fillText(noteStr, cx, nextY)
        nextY += 70
      }

      // 13. Sacred Blessing Quote
      ctx.fillStyle = '#44403C'
      ctx.font = 'italic 40px Georgia, serif'
      ctx.fillText(blessingLine1, cx, nextY)
      ctx.fillText(blessingLine2, cx, nextY + 54)

      // 14. Bottom Sacred Kalash & Deepam Lamps
      drawKalashAndDiyas(ctx, W, H)

      // 15. Verification Footer
      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('✓ Verified Official Festival Record · Utsava Committee 🙏', cx, H - 100)
    }

    // --- TEMPLATE 2: MARIGOLD GARLAND ARCH (SPONSORS & DONATIONS) ---
    else if (activeThemeKey === 'marigold') {
      // 1. Warm Golden Saffron Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#FFFDF5')
      bgGrad.addColorStop(0.5, '#FFFBEB')
      bgGrad.addColorStop(1, '#FEF3C7')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // 2. Outer Ornate Saffron Border
      drawOrnateFrame(ctx, 80, 80, W - 160, H - 160, '#F59E0B', 24)

      // 3. Side & Top Cascading Marigold Garlands
      drawMarigoldSideGarlands(ctx, W, H)

      // 4. Centerpiece Golden Ganesha Medallion
      drawOmGaneshaEmblem(ctx, cx, 580, 160)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#9A3412'
      ctx.font = 'bold 40px Mukta, sans-serif'
      ctx.fillText('🪔 UTSAVA SEVA & ANNADANAM BLESSING 🪔', cx, 830)

      // Main Title
      ctx.fillStyle = '#78170D'
      ctx.font = 'bold 94px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 950)

      // Village Name
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 56px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 1040)

      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 360, 1080)
      ctx.lineTo(cx + 360, 1080)
      ctx.stroke()

      // Prompt
      ctx.fillStyle = '#44403C'
      ctx.font = '42px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 1160)

      // Person Name
      ctx.fillStyle = '#7C2414'
      ctx.font = personName.length > 25 ? 'bold 70px Georgia, serif' : 'bold 88px Georgia, "Yatra One", serif'
      ctx.fillText(personName, cx, 1270)

      // Sub Highlight
      ctx.fillStyle = '#C2410C'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1345)

      // Highlight Box
      const boxW = 1520
      const boxH = 220
      const boxX = cx - boxW / 2
      const boxY = 1400

      ctx.fillStyle = 'rgba(255, 253, 240, 0.98)'
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 24)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#78170D'
      ctx.font = mainHighlight.length > 30 ? 'bold 54px Mukta, sans-serif' : 'bold 68px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 130)

      let nextY = boxY + boxH + 80
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 42px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, nextY)

      nextY += 70
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 40px Georgia, serif'
        ctx.fillText(noteStr, cx, nextY)
        nextY += 70
      }

      ctx.fillStyle = '#44403C'
      ctx.font = 'italic 40px Georgia, serif'
      ctx.fillText(blessingLine1, cx, nextY)
      ctx.fillText(blessingLine2, cx, nextY + 54)

      // Bottom Diya & Kalash
      drawKalashAndDiyas(ctx, W, H)

      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('✓ Official Verified Record · Utsava Committee 🙏', cx, H - 100)
    }

    // --- TEMPLATE 3: LOTUS BLOSSOM & PARCHMENT (AWARDS & VOLUNTEERS) ---
    else if (activeThemeKey === 'lotus') {
      // 1. Royal Parchment Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#FAF5E9')
      bgGrad.addColorStop(0.5, '#F5EBD7')
      bgGrad.addColorStop(1, '#ECE0C8')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // 2. Ornate Border
      drawOrnateFrame(ctx, 80, 80, W - 160, H - 160, '#D97706', 24)

      // 3. Pink Blooming Lotus Throne
      drawPinkLotus(ctx, cx, 580, 2.2)

      // 4. Center Om Medallion above Lotus
      drawOmGaneshaEmblem(ctx, cx, 460, 120)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#78350F'
      ctx.font = 'italic 40px Georgia, serif'
      ctx.fillText('Shree Ganeshaya Namah · Seva Puraskar', cx, 830)

      // Main Title
      ctx.fillStyle = '#4A0E0A'
      ctx.font = 'bold 92px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 950)

      // Village Name
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 56px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 1040)

      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 360, 1080)
      ctx.lineTo(cx + 360, 1080)
      ctx.stroke()

      // Prompt
      ctx.fillStyle = '#44403C'
      ctx.font = '42px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 1160)

      // Person Name
      ctx.fillStyle = '#7C2414'
      ctx.font = personName.length > 25 ? 'bold 70px Georgia, serif' : 'bold 88px Georgia, "Yatra One", serif'
      ctx.fillText(personName, cx, 1270)

      // Sub Highlight
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1345)

      // Highlight Box
      const boxW = 1520
      const boxH = 220
      const boxX = cx - boxW / 2
      const boxY = 1400

      ctx.fillStyle = 'rgba(254, 248, 236, 0.98)'
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 4.5
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 24)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#4A0E0A'
      ctx.font = mainHighlight.length > 30 ? 'bold 54px Mukta, sans-serif' : 'bold 68px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 130)

      let nextY = boxY + boxH + 80
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 42px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, nextY)

      nextY += 70
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 40px Georgia, serif'
        ctx.fillText(noteStr, cx, nextY)
        nextY += 70
      }

      ctx.fillStyle = '#44403C'
      ctx.font = 'italic 40px Georgia, serif'
      ctx.fillText(blessingLine1, cx, nextY)
      ctx.fillText(blessingLine2, cx, nextY + 54)

      drawKalashAndDiyas(ctx, W, H)

      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('✓ Official Committee Honour · Utsava Committee 🙏', cx, H - 100)
    }
  }

  // =========================================================================
  // 2. LANDSCAPE 4K RENDERING (2026 Lord Ganesha Idol Showcases)
  // =========================================================================
  else {
    const W = theme.width // 3200
    const H = theme.height // 1800

    // 1. Royal Velvet Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, theme.bgStart || '#2A0403')
    bgGrad.addColorStop(0.5, theme.bgEnd || '#58100B')
    bgGrad.addColorStop(1, theme.bgStart || '#2A0403')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Outer gold border
    drawOrnateFrame(ctx, 40, 40, W - 80, H - 80, theme.accent || '#D7952F', 20)

    // 2. Left Side: Lord Ganesha 2026 Idol Portrait Frame
    const idolX = 80
    const idolY = 80
    const idolW = 1000
    const idolH = 1640

    // Idol glow aura
    const idolGrad = ctx.createRadialGradient(idolX + idolW / 2, idolY + idolH / 2, 80, idolX + idolW / 2, idolY + idolH / 2, 600)
    idolGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)')
    idolGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.15)')
    idolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = idolGrad
    ctx.fillRect(idolX, idolY, idolW, idolH)

    if (theme.idolImg) {
      const idol = await loadImage(theme.idolImg)
      if (idol) {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(idolX + 40, idolY + 40, idolW - 80, idolH - 80, 24)
        ctx.clip()
        ctx.drawImage(idol, idolX + 40, idolY + 40, idolW - 80, idolH - 80)
        ctx.restore()

        // Gold frame around idol
        ctx.strokeStyle = theme.accent || '#D7952F'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.roundRect(idolX + 40, idolY + 40, idolW - 80, idolH - 80, 24)
        ctx.stroke()
      }
    }

    // 3. Right Side: Frosted Glass Information Panel
    const panelX = 1140
    const panelY = 80
    const panelW = 1980
    const panelH = 1640
    const panelCenterX = panelX + panelW / 2

    ctx.save()
    ctx.fillStyle = theme.panelBg || 'rgba(28, 4, 3, 0.93)'
    ctx.strokeStyle = theme.accent || '#D7952F'
    ctx.lineWidth = 5
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 40
    ctx.beginPath()
    ctx.roundRect(panelX, panelY, panelW, panelH, 28)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Inner gold decorative line
    ctx.strokeStyle = 'rgba(255, 215, 100, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(panelX + 16, panelY + 16, panelW - 32, panelH - 32, 20)
    ctx.stroke()

    ctx.textAlign = 'center'

    // Mantra
    ctx.fillStyle = '#FFE0A0'
    ctx.font = 'bold 44px Mukta, sans-serif'
    ctx.fillText('🌿 ॐ శ్రీ గణేశాయ నమః 🌿 ॐ GANAPATHI BAPPA MORYA 🌿', panelCenterX, panelY + 95)

    // Village Name
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 92px Georgia, "Yatra One", serif'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
    ctx.shadowBlur = 12
    ctx.fillText(`🪔 ${villageName} 🪔`, panelCenterX, panelY + 205)
    ctx.shadowBlur = 0

    // Card Title
    ctx.fillStyle = '#FFD54F'
    ctx.font = 'bold 50px Mukta, sans-serif'
    ctx.fillText(cardTitle, panelCenterX, panelY + 285)

    // Meta Bar
    ctx.fillStyle = '#E0D2C0'
    ctx.font = '38px Mukta, sans-serif'
    ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, panelCenterX, panelY + 355)

    // Golden Divider
    ctx.strokeStyle = theme.accent || '#D7952F'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(panelX + 140, panelY + 395)
    ctx.lineTo(panelX + panelW - 140, panelY + 395)
    ctx.stroke()

    // Prompt
    ctx.fillStyle = '#F5E6D3'
    ctx.font = '44px Mukta, sans-serif'
    ctx.fillText(promptText, panelCenterX, panelY + 480)

    // Person Name
    ctx.fillStyle = '#FFF1B8'
    ctx.font = personName.length > 28 ? 'bold 74px Georgia, serif' : 'bold 96px Georgia, "Yatra One", serif'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
    ctx.shadowBlur = 12
    ctx.fillText(personName, panelCenterX, panelY + 605)
    ctx.shadowBlur = 0

    // Sub Highlight
    ctx.fillStyle = '#FFA726'
    ctx.font = 'bold 42px Mukta, sans-serif'
    ctx.fillText(subHighlight, panelCenterX, panelY + 685)

    // Highlight Box
    const boxW = 1260
    const boxH = 180
    const boxX = panelCenterX - boxW / 2
    const boxY = panelY + 735

    ctx.fillStyle = 'rgba(255, 248, 230, 0.15)'
    ctx.strokeStyle = '#FFCA28'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = mainHighlight.length > 35 ? 'bold 56px Mukta, sans-serif' : 'bold 74px Mukta, Georgia, sans-serif'
    ctx.fillText(mainHighlight, panelCenterX, boxY + 112)

    let nextY = boxY + boxH + 75
    if (noteStr) {
      ctx.fillStyle = '#FFE57F'
      ctx.font = 'italic 42px Georgia, serif'
      ctx.fillText(noteStr, panelCenterX, nextY)
      nextY += 75
    }

    ctx.fillStyle = '#FFF8E1'
    ctx.font = 'italic 42px Georgia, serif'
    ctx.fillText(blessingLine1, panelCenterX, nextY + 20)
    ctx.fillText(blessingLine2, panelCenterX, nextY + 80)

    // Footer
    const footerY = panelY + panelH - 65
    ctx.strokeStyle = 'rgba(215, 149, 47, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(panelX + 80, footerY - 45)
    ctx.lineTo(panelX + panelW - 80, footerY - 45)
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = '#81C784'
    ctx.font = 'bold 38px Mukta, sans-serif'
    ctx.fillText('✓ Verified Official Record', panelX + 88, footerY)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#FFD54F'
    ctx.font = 'bold 42px Mukta, sans-serif'
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
