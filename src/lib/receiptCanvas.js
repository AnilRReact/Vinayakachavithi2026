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
    idolImg: ganeshIdol2026,
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
    idolImg: ganeshIdolYellow || ganeshIdol2026,
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
    idolImg: ganeshIdol2026,
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
// VECTOR ART & ORNAMENT HELPERS (RAZOR-SHARP AT 4K RESOLUTION)
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
 * Draws prominent, sacred Lord Ganesha Medallion with glowing sunburst halo and beaded gold frame
 */
function drawGaneshaMedallion(ctx, idol, cx, cy, radius = 185) {
  ctx.save()

  // 1. Radiant sunburst aura rays around Ganesha
  const rays = 36
  for (let i = 0; i < rays; i++) {
    const angle = (i * Math.PI * 2) / rays
    const x1 = cx + Math.cos(angle) * (radius * 0.92)
    const y1 = cy + Math.sin(angle) * (radius * 0.92)
    const x2 = cx + Math.cos(angle) * (radius * 1.35)
    const y2 = cy + Math.sin(angle) * (radius * 1.35)

    ctx.strokeStyle = i % 2 === 0 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.25)'
    ctx.lineWidth = i % 2 === 0 ? 4 : 2.5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // 2. Glowing golden background circle behind Ganesha
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius)
  grad.addColorStop(0, '#FEF9C3')
  grad.addColorStop(0.5, '#FDE68A')
  grad.addColorStop(0.85, '#F59E0B')
  grad.addColorStop(1, '#B45309')

  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(245, 158, 11, 0.6)'
  ctx.shadowBlur = 35
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // 3. Draw Lord Ganesha Idol (Clipped to Circle)
  if (idol) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2)
    ctx.clip()

    const cropW = idol.width
    const cropH = Math.round(idol.height * 0.72)
    ctx.drawImage(idol, 0, 0, cropW, cropH, cx - radius + 8, cy - radius + 8, (radius - 8) * 2, (radius - 8) * 2)
    ctx.restore()
  } else {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#7C2414'
    ctx.font = 'bold 110px "Yatra One", Georgia, serif'
    ctx.fillText('ॐ', cx, cy + 6)
  }

  // 4. Heavy Polished Gold Rim
  ctx.strokeStyle = '#D97706'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#FEF08A'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2)
  ctx.stroke()

  // 5. Beaded gold ring
  const beads = 32
  for (let i = 0; i < beads; i++) {
    const angle = (i * Math.PI * 2) / beads
    const bx = cx + Math.cos(angle) * (radius + 14)
    const by = cy + Math.sin(angle) * (radius + 14)
    ctx.fillStyle = '#D97706'
    ctx.beginPath()
    ctx.arc(bx, by, 4.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(bx, by, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Draws the Lower Lord Ganesha Shrine & Lotus Mandapam to fill the lower card with divine beauty
 */
function drawLowerGaneshaShrine(ctx, idol, cx, cy = 2220) {
  ctx.save()

  // 1. Shloka / Mantra Heading above Lower Shrine
  ctx.textAlign = 'center'
  ctx.fillStyle = '#9A3412'
  ctx.font = 'bold 36px "Yatra One", Mukta, serif'
  ctx.fillText('॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥', cx, cy - 310)

  // 2. Ornate Golden Temple Arch Frame behind Lower Ganesha
  const archW = 860
  const archH = 560
  const archX = cx - archW / 2
  const archY = cy - 270

  // Glowing background aura inside arch
  const auraGrad = ctx.createRadialGradient(cx, cy - 60, 40, cx, cy - 60, 420)
  auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)')
  auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)')
  auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')

  ctx.fillStyle = auraGrad
  ctx.beginPath()
  ctx.roundRect(archX, archY, archW, archH, 28)
  ctx.fill()

  // Arch pillars and golden frame
  ctx.strokeStyle = '#D97706'
  ctx.lineWidth = 4.5
  ctx.beginPath()
  ctx.roundRect(archX, archY, archW, archH, 28)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(archX + 12, archY + 12, archW - 24, archH - 24, 20)
  ctx.stroke()

  // 3. Blooming Pink Lotus Throne
  drawPinkLotus(ctx, cx, cy + 110, 2.3)

  // 4. Seated Lord Ganesha Idol Artwork
  if (idol) {
    const idolW = 440
    const idolH = 440
    const idolX = cx - idolW / 2
    const idolY = cy - 230

    ctx.save()
    // Soft circular aura behind idol image
    ctx.shadowColor = 'rgba(245, 158, 11, 0.7)'
    ctx.shadowBlur = 30
    ctx.beginPath()
    ctx.arc(cx, cy - 20, 200, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(idol, 0, 0, idol.width, idol.height, idolX, idolY, idolW, idolH)
    ctx.restore()

    // Golden frame ring around lower idol
    ctx.strokeStyle = '#D97706'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(cx, cy - 20, 200, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 5. Modak Prasad Platter at Ganesha's Feet
  ctx.fillStyle = '#D97706'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 180, 80, 22, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#F59E0B'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 176, 74, 18, 0, 0, Math.PI * 2)
  ctx.fill()

  // Golden Modak sweets
  const modakColors = ['#FEF08A', '#FDE047', '#FBBF24']
  const modakPositions = [
    [cx, cy + 164],
    [cx - 24, cy + 172],
    [cx + 24, cy + 172],
    [cx - 46, cy + 178],
    [cx + 46, cy + 178]
  ]
  modakPositions.forEach(([mx, my], idx) => {
    ctx.fillStyle = modakColors[idx % modakColors.length]
    ctx.beginPath()
    ctx.moveTo(mx, my - 14)
    ctx.quadraticCurveTo(mx + 12, my + 6, mx, my + 6)
    ctx.quadraticCurveTo(mx - 12, my + 6, mx, my - 14)
    ctx.fill()
  })

  // Tag below lower shrine
  ctx.fillStyle = '#78350F'
  ctx.font = 'bold 34px Mukta, sans-serif'
  ctx.fillText('🪔 సర్వ విఘ్న నివారణ శ్రీ వరసిద్ధి వినాయక దివ్యానుగ్రహం 🪔', cx, cy + 245)

  ctx.restore()
}

/**
 * Draws decorated, luxury gold-embossed Name Banner with generous padding, 3D border, and ornamental side flourishes
 */
function drawDecoratedNameBanner(ctx, personName, cx, bannerY, bannerW = 1600, bannerH = 180, accentColor = '#7C2414', goldColor = '#D97706') {
  ctx.save()
  const bx = cx - bannerW / 2
  const by = bannerY

  // 1. 3D Shadow
  ctx.shadowColor = 'rgba(124, 36, 20, 0.15)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8

  // 2. Banner Gradient Fill (Rich Ivory / Cream with Gold Glow)
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by + bannerH)
  bgGrad.addColorStop(0, '#FFFDF8')
  bgGrad.addColorStop(0.5, '#FEF9EB')
  bgGrad.addColorStop(1, '#FFFDF8')

  ctx.fillStyle = bgGrad
  ctx.beginPath()
  ctx.roundRect(bx, by, bannerW, bannerH, 22)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // 3. Heavy Gold Embossed Border
  ctx.strokeStyle = goldColor
  ctx.lineWidth = 5.5
  ctx.beginPath()
  ctx.roundRect(bx, by, bannerW, bannerH, 22)
  ctx.stroke()

  // 4. Thin Inner Border
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(bx + 12, by + 12, bannerW - 24, bannerH - 24, 16)
  ctx.stroke()

  // 5. Decorative Corner Flourishes
  const cornerDots = [
    [bx + 24, by + 24],
    [bx + bannerW - 24, by + 24],
    [bx + 24, by + bannerH - 24],
    [bx + bannerW - 24, by + bannerH - 24]
  ]
  cornerDots.forEach(([x, y]) => {
    ctx.fillStyle = goldColor
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Side Ornamental Ribbon Flourishes
  ctx.fillStyle = goldColor
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('❖ ✦', bx + 44, by + bannerH / 2)
  ctx.textAlign = 'right'
  ctx.fillText('✦ ❖', bx + bannerW - 44, by + bannerH / 2)

  // 6. Bold Name with Rich Drop Shadow & Classical Typography
  ctx.textAlign = 'center'
  ctx.fillStyle = accentColor
  const fontSize = personName.length > 25 ? (personName.length > 35 ? 64 : 74) : 88
  ctx.font = `bold ${fontSize}px Georgia, "Yatra One", serif`
  ctx.shadowColor = 'rgba(124, 36, 20, 0.25)'
  ctx.shadowBlur = 10
  ctx.fillText(`༺ ${personName} ༻`, cx, by + bannerH / 2 + 4)
  ctx.shadowBlur = 0

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
  ctx.moveTo(60, 85)
  ctx.quadraticCurveTo(width / 2, 120, width - 60, 85)
  ctx.stroke()

  const leavesCount = 13
  const step = (width - 240) / (leavesCount - 1)

  for (let i = 0; i < leavesCount; i++) {
    const lx = 120 + i * step
    const progress = i / (leavesCount - 1)
    const ly = 85 + Math.sin(progress * Math.PI) * 32

    // Mango leaf
    ctx.save()
    ctx.translate(lx, ly)
    ctx.fillStyle = i % 2 === 0 ? '#15803D' : '#166534'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(22, 65, 0, 120)
    ctx.quadraticCurveTo(-22, 65, 0, 0)
    ctx.fill()

    // Leaf vein
    ctx.strokeStyle = '#4ADE80'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 5)
    ctx.lineTo(0, 110)
    ctx.stroke()
    ctx.restore()

    // Marigold flower on top of leaf
    ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#EA580C'
    ctx.beginPath()
    ctx.arc(lx, ly, 16, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(lx, ly, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  // Hanging brass bells on left and right
  const bells = [
    [150, 170],
    [width - 150, 170]
  ]

  bells.forEach(([bx, by]) => {
    ctx.strokeStyle = '#B45309'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(bx, 90)
    ctx.lineTo(bx, by)
    ctx.stroke()

    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.moveTo(bx - 30, by + 46)
    ctx.quadraticCurveTo(bx - 26, by, bx, by)
    ctx.quadraticCurveTo(bx + 26, by, bx + 30, by + 46)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#D97706'
    ctx.beginPath()
    ctx.roundRect(bx - 34, by + 44, 68, 10, 5)
    ctx.fill()

    ctx.fillStyle = '#78350F'
    ctx.beginPath()
    ctx.arc(bx, by + 60, 7, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}

/**
 * Draws sacred Kalash with coconut, mango leaves, and glowing oil deepam lamps at base
 */
function drawKalashAndDiyas(ctx, width, height) {
  ctx.save()
  const cy = height - 160
  const cx = width / 2

  // Center glowing oil diya
  const diyaGrad = ctx.createRadialGradient(cx, cy - 25, 5, cx, cy - 25, 80)
  diyaGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)')
  diyaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)')
  diyaGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')

  ctx.fillStyle = diyaGrad
  ctx.beginPath()
  ctx.arc(cx, cy - 25, 80, 0, Math.PI * 2)
  ctx.fill()

  // Diya lamp body
  ctx.fillStyle = '#B45309'
  ctx.beginPath()
  ctx.moveTo(cx - 65, cy)
  ctx.quadraticCurveTo(cx, cy + 45, cx + 65, cy)
  ctx.quadraticCurveTo(cx + 85, cy - 18, cx, cy - 10)
  ctx.quadraticCurveTo(cx - 85, cy - 18, cx - 65, cy)
  ctx.fill()

  // Flame
  ctx.fillStyle = '#FDE047'
  ctx.beginPath()
  ctx.moveTo(cx, cy - 58)
  ctx.quadraticCurveTo(cx + 16, cy - 26, cx, cy - 8)
  ctx.quadraticCurveTo(cx - 16, cy - 26, cx, cy - 58)
  ctx.fill()

  // Left and Right Kalash pots
  const kalashPositions = [cx - 520, cx + 520]
  kalashPositions.forEach((kx) => {
    // Copper pot
    ctx.fillStyle = '#C2410C'
    ctx.beginPath()
    ctx.arc(kx, cy + 8, 50, 0, Math.PI * 2)
    ctx.fill()

    // Pot neck & rim
    ctx.fillStyle = '#D97706'
    ctx.beginPath()
    ctx.roundRect(kx - 32, cy - 46, 64, 14, 4)
    ctx.fill()

    // Mango leaves
    ctx.fillStyle = '#15803D'
    ctx.beginPath()
    ctx.moveTo(kx - 40, cy - 40)
    ctx.lineTo(kx - 68, cy - 85)
    ctx.lineTo(kx - 22, cy - 62)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(kx + 40, cy - 40)
    ctx.lineTo(kx + 68, cy - 85)
    ctx.lineTo(kx + 22, cy - 62)
    ctx.fill()

    // Coconut top
    ctx.fillStyle = '#78350F'
    ctx.beginPath()
    ctx.moveTo(kx - 26, cy - 44)
    ctx.quadraticCurveTo(kx, cy - 110, kx + 26, cy - 44)
    ctx.fill()

    // Swastik on pot
    ctx.fillStyle = '#FEF08A'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('卐', kx, cy + 16)
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
    const y = 150 + i * step
    const color1 = i % 2 === 0 ? '#F59E0B' : '#EA580C'
    const color2 = i % 2 === 0 ? '#EA580C' : '#F59E0B'

    ctx.fillStyle = color1
    ctx.beginPath()
    ctx.arc(garlandLeft, y, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(garlandLeft, y, 9, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = color2
    ctx.beginPath()
    ctx.arc(garlandRight, y, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(garlandRight, y, 9, 0, Math.PI * 2)
    ctx.fill()
  }

  const topCount = 14
  const topStep = (width - 320) / topCount
  for (let i = 0; i <= topCount; i++) {
    const x = 160 + i * topStep
    const y = 120 + Math.sin((i / topCount) * Math.PI) * 36
    ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#EA580C'
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FEF08A'
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
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

  const petals = [
    { x: 0, y: -55, angle: 0 },
    { x: -32, y: -42, angle: -0.3 },
    { x: 32, y: -42, angle: 0.3 },
    { x: -60, y: -22, angle: -0.6 },
    { x: 60, y: -22, angle: 0.6 },
    { x: -82, y: 0, angle: -0.9 },
    { x: 82, y: 0, angle: 0.9 }
  ]

  petals.forEach(({ x, y, angle }) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    const petalGrad = ctx.createLinearGradient(0, -45, 0, 35)
    petalGrad.addColorStop(0, '#F43F5E')
    petalGrad.addColorStop(0.5, '#FB7185')
    petalGrad.addColorStop(1, '#FFF1F2')

    ctx.fillStyle = petalGrad
    ctx.beginPath()
    ctx.moveTo(0, -45)
    ctx.quadraticCurveTo(22, 0, 0, 35)
    ctx.quadraticCurveTo(-22, 0, 0, -45)
    ctx.fill()
    ctx.restore()
  })

  ctx.fillStyle = '#FDE047'
  ctx.beginPath()
  ctx.ellipse(0, 8, 34, 14, 0, 0, Math.PI * 2)
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

  // Preload Lord Ganesha Idol image
  const idol = await loadImage(theme.idolImg || ganeshIdol2026)

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
      bgGrad.addColorStop(0, '#FFFDF8')
      bgGrad.addColorStop(0.5, '#FFFBF0')
      bgGrad.addColorStop(1, '#FFF5DF')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // 2. Ornate Outer Gold Border
      drawOrnateFrame(ctx, 70, 70, W - 140, H - 140, '#D97706', 24)

      // 3. Hanging Mango Leaf Toran & Bells
      drawHangingToran(ctx, W, H)

      // 4. TOP LORD GANESHA SACRED MEDALLION
      drawGaneshaMedallion(ctx, idol, cx, 430, 180)

      // 5. Sacred Invocation Tag
      ctx.textAlign = 'center'
      ctx.fillStyle = '#78350F'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('🌿 YOU ARE CORDIALLY INVITED TO CELEBRATE 🌿', cx, 680)

      // 6. Main Card Title
      ctx.fillStyle = '#5C1410'
      ctx.font = 'bold 88px Georgia, "Yatra One", serif'
      ctx.shadowColor = 'rgba(92, 20, 16, 0.25)'
      ctx.shadowBlur = 10
      ctx.fillText(cardTitle, cx, 785)
      ctx.shadowBlur = 0

      // 7. Village / Pandal Name
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 52px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 865)

      // Gold divider
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 360, 900)
      ctx.lineTo(cx + 360, 900)
      ctx.stroke()

      // 8. Prompt Text
      ctx.fillStyle = '#44403C'
      ctx.font = '38px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 960)

      // 9. DECORATED, BOLD NAME HIGHLIGHT BANNER
      drawDecoratedNameBanner(ctx, personName, cx, 1000, 1600, 175, '#7C2414', '#D97706')

      // 10. Sub Highlight Badge
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1225)

      // 11. Main Highlight Box (Date, Time, Amount, Item)
      const boxW = 1600
      const boxH = 185
      const boxX = cx - boxW / 2
      const boxY = 1265

      ctx.fillStyle = 'rgba(255, 251, 235, 0.98)'
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 4.5
      ctx.shadowColor = 'rgba(217, 119, 6, 0.18)'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#7C2414'
      ctx.font = mainHighlight.length > 30 ? 'bold 50px Mukta, sans-serif' : 'bold 64px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 110)

      // 12. Ref No & Date / Venue / Blessings in Frosted Card
      let infoY = boxY + boxH + 60
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, infoY)

      infoY += 55
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 36px Georgia, serif'
        ctx.fillText(noteStr, cx, infoY)
        infoY += 55
      }

      ctx.fillStyle = '#44403C'
      ctx.font = 'italic 36px Georgia, serif'
      ctx.fillText(blessingLine1, cx, infoY)
      ctx.fillText(blessingLine2, cx, infoY + 48)

      // 13. MAJESTIC LOWER LORD GANESHA SHRINE & LOTUS MANDAPAM (Fills the lower card beautifully!)
      drawLowerGaneshaShrine(ctx, idol, cx, 2220)

      // 14. Bottom Sacred Kalash & Deepam Lamps
      drawKalashAndDiyas(ctx, W, H)

      // 15. Verification Footer
      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('✓ Verified Official Festival Record · Utsava Committee 🙏', cx, H - 90)
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
      drawOrnateFrame(ctx, 70, 70, W - 140, H - 140, '#F59E0B', 24)

      // 3. Side & Top Cascading Marigold Garlands
      drawMarigoldSideGarlands(ctx, W, H)

      // 4. TOP LORD GANESHA SACRED MEDALLION
      drawGaneshaMedallion(ctx, idol, cx, 430, 180)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#9A3412'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('🪔 UTSAVA SEVA & ANNADANAM BLESSING 🪔', cx, 680)

      // Main Title
      ctx.fillStyle = '#78170D'
      ctx.font = 'bold 88px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 785)

      // Village Name
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 52px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 865)

      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 360, 900)
      ctx.lineTo(cx + 360, 900)
      ctx.stroke()

      // Prompt
      ctx.fillStyle = '#44403C'
      ctx.font = '38px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 960)

      // DECORATED, BOLD NAME HIGHLIGHT BANNER
      drawDecoratedNameBanner(ctx, personName, cx, 1000, 1600, 175, '#78170D', '#F59E0B')

      // Sub Highlight
      ctx.fillStyle = '#C2410C'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1225)

      // Highlight Box
      const boxW = 1600
      const boxH = 185
      const boxX = cx - boxW / 2
      const boxY = 1265

      ctx.fillStyle = 'rgba(255, 253, 240, 0.98)'
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#78170D'
      ctx.font = mainHighlight.length > 30 ? 'bold 50px Mukta, sans-serif' : 'bold 64px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 110)

      let infoY = boxY + boxH + 60
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, infoY)

      infoY += 55
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 36px Georgia, serif'
        ctx.fillText(noteStr, cx, infoY)
        infoY += 55
      }

      ctx.fillStyle = '#44403C'
      ctx.font = 'italic 36px Georgia, serif'
      ctx.fillText(blessingLine1, cx, infoY)
      ctx.fillText(blessingLine2, cx, infoY + 48)

      // MAJESTIC LOWER LORD GANESHA SHRINE & LOTUS MANDAPAM
      drawLowerGaneshaShrine(ctx, idol, cx, 2220)

      // Bottom Diya & Kalash
      drawKalashAndDiyas(ctx, W, H)

      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('✓ Official Verified Record · Utsava Committee 🙏', cx, H - 90)
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
      drawOrnateFrame(ctx, 70, 70, W - 140, H - 140, '#D97706', 24)

      // 3. TOP LORD GANESHA SACRED MEDALLION with Pink Lotus
      drawGaneshaMedallion(ctx, idol, cx, 430, 180)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#78350F'
      ctx.font = 'italic 36px Georgia, serif'
      ctx.fillText('Shree Ganeshaya Namah · Seva Puraskar', cx, 680)

      // Main Title
      ctx.fillStyle = '#4A0E0A'
      ctx.font = 'bold 88px Georgia, "Yatra One", serif'
      ctx.fillText(cardTitle, cx, 785)

      // Village Name
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 52px Mukta, sans-serif'
      ctx.fillText(`🪔 ${villageName} 2026 🪔`, cx, 865)

      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - 360, 900)
      ctx.lineTo(cx + 360, 900)
      ctx.stroke()

      // Prompt
      ctx.fillStyle = '#44403C'
      ctx.font = '38px Mukta, sans-serif'
      ctx.fillText(promptText, cx, 960)

      // DECORATED, BOLD NAME HIGHLIGHT BANNER
      drawDecoratedNameBanner(ctx, personName, cx, 1000, 1600, 175, '#4A0E0A', '#D97706')

      // Sub Highlight
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText(subHighlight, cx, 1225)

      // Highlight Box
      const boxW = 1600
      const boxH = 185
      const boxX = cx - boxW / 2
      const boxY = 1265

      ctx.fillStyle = 'rgba(254, 248, 236, 0.98)'
      ctx.strokeStyle = '#D97706'
      ctx.lineWidth = 4.5
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxW, boxH, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#4A0E0A'
      ctx.font = mainHighlight.length > 30 ? 'bold 50px Mukta, sans-serif' : 'bold 64px Mukta, Georgia, sans-serif'
      ctx.fillText(mainHighlight, cx, boxY + 110)

      let infoY = boxY + boxH + 60
      ctx.fillStyle = '#292524'
      ctx.font = 'bold 38px Mukta, sans-serif'
      ctx.fillText(`${refLabel}   ·   📅 ${fmtDate(record.date)}`, cx, infoY)

      infoY += 55
      if (noteStr) {
        ctx.fillStyle = '#78350F'
        ctx.font = 'italic 36px Georgia, serif'
        ctx.fillText(noteStr, cx, infoY)
        infoY += 55
      }

      ctx.fillStyle = '#44403C'
      ctx.font = 'italic 36px Georgia, serif'
      ctx.fillText(blessingLine1, cx, infoY)
      ctx.fillText(blessingLine2, cx, infoY + 48)

      // MAJESTIC LOWER LORD GANESHA SHRINE & LOTUS MANDAPAM
      drawLowerGaneshaShrine(ctx, idol, cx, 2220)

      // Bottom Diya & Kalash
      drawKalashAndDiyas(ctx, W, H)

      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 36px Mukta, sans-serif'
      ctx.fillText('✓ Official Committee Honour · Utsava Committee 🙏', cx, H - 90)
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
    ctx.fillText(promptText, panelCenterX, panelY + 475)

    // DECORATED BOLD NAME BANNER
    drawDecoratedNameBanner(ctx, personName, panelCenterX, panelY + 520, 1680, 165, '#FFF1B8', theme.accent || '#D7952F')

    // Sub Highlight
    ctx.fillStyle = '#FFA726'
    ctx.font = 'bold 42px Mukta, sans-serif'
    ctx.fillText(subHighlight, panelCenterX, panelY + 735)

    // Highlight Box
    const boxW = 1440
    const boxH = 170
    const boxX = panelCenterX - boxW / 2
    const boxY = panelY + 775

    ctx.fillStyle = 'rgba(255, 248, 230, 0.15)'
    ctx.strokeStyle = '#FFCA28'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = mainHighlight.length > 35 ? 'bold 56px Mukta, sans-serif' : 'bold 74px Mukta, Georgia, sans-serif'
    ctx.fillText(mainHighlight, panelCenterX, boxY + 105)

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
