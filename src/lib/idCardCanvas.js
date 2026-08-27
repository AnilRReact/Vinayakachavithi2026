/**
 * Helper to load an image from URL with CORS
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

function drawAvatarFallback(ctx, name, cx, cy, radius) {
  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
  grad.addColorStop(0, '#7C2414')
  grad.addColorStop(1, '#9B2612')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 90px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name?.[0]?.toUpperCase() || 'ॐ', cx, cy)
  ctx.textBaseline = 'alphabetic'
}

/**
 * Generates a high-resolution 800x1200 vertical ID Badge for a Committee Member
 * and returns the canvas element.
 */
export async function generateIdCardCanvas(member = {}, settings = {}) {
  const canvas = document.createElement('canvas')
  const width = 800
  const height = 1200
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const villageName = settings.village_name || 'Vinayaka Vedika'
  const memberName = member.name || 'Committee Member'
  const memberRole = member.role || 'Member'
  const memberPhone = member.phone || ''
  const idNumber = `VV-2026-${(member.id || '0000').slice(0, 6).toUpperCase()}`

  // 1. Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#FFFDF8')
  bgGrad.addColorStop(0.3, '#FAF3E3')
  bgGrad.addColorStop(1, '#F3E5C8')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Outer Ornate Golden & Red Border
  ctx.strokeStyle = '#D7952F'
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, width - 40, height - 40)

  ctx.strokeStyle = '#7C2414'
  ctx.lineWidth = 2.5
  ctx.strokeRect(32, 32, width - 64, height - 64)

  // Corner Dots
  const corners = [
    [32, 32],
    [width - 32, 32],
    [32, height - 32],
    [width - 32, height - 32]
  ]
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = '#D7952F'
    ctx.beginPath()
    ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fill()
  })

  // 3. Lanyard Slot Punch Cutout at Top
  ctx.fillStyle = '#25211D'
  ctx.beginPath()
  ctx.roundRect(width / 2 - 50, 42, 100, 16, 8)
  ctx.fill()

  // 4. Header Band
  const headerY = 72
  const headerH = 170
  const headerGrad = ctx.createLinearGradient(0, headerY, 0, headerY + headerH)
  headerGrad.addColorStop(0, '#7C2414')
  headerGrad.addColorStop(1, '#9B2612')
  ctx.fillStyle = headerGrad
  ctx.fillRect(34, headerY, width - 68, headerH)

  // Top Sacred Text
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFE0A0'
  ctx.font = 'bold 20px Mukta, sans-serif'
  ctx.fillText('🌿 ॐ శ్రీ గణేశాయ నమః 🌿', width / 2, headerY + 36)

  // Village / Pandal Name
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px Georgia, "Yatra One", serif'
  ctx.fillText(`🪔 ${villageName} 🪔`, width / 2, headerY + 84)

  // Subtitle
  ctx.fillStyle = '#FFD54F'
  ctx.font = 'bold 20px Mukta, sans-serif'
  ctx.fillText('UTSAVA COMMITTEE · OFFICIAL ID BADGE', width / 2, headerY + 122)

  ctx.fillStyle = '#FFE0B2'
  ctx.font = '16px Mukta, sans-serif'
  ctx.fillText('VINAYAKA CHAVITHI 2026', width / 2, headerY + 148)

  // 5. Photo Section (Center Circle with Gold Ring)
  const photoCenterX = width / 2
  const photoCenterY = 380
  const photoRadius = 110

  // Outer Gold Glow Ring
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCenterX, photoCenterY, photoRadius + 8, 0, Math.PI * 2)
  ctx.fillStyle = '#D7952F'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
  ctx.shadowBlur = 12
  ctx.fill()
  ctx.restore()

  // Clip Circle for Member Photo
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2)
  ctx.clip()

  if (member.photo_url) {
    try {
      const img = await loadImage(member.photo_url)
      // Draw centered object-fit cover
      const scale = Math.max((photoRadius * 2) / img.width, (photoRadius * 2) / img.height)
      const x = photoCenterX - (img.width / 2) * scale
      const y = photoCenterY - (img.height / 2) * scale
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    } catch {
      // Fallback initial
      drawAvatarFallback(ctx, memberName, photoCenterX, photoCenterY, photoRadius)
    }
  } else {
    drawAvatarFallback(ctx, memberName, photoCenterX, photoCenterY, photoRadius)
  }
  ctx.restore()

  // Inner Photo Border
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2)
  ctx.stroke()

  // 6. Member Name
  ctx.textAlign = 'center'
  ctx.fillStyle = '#7C2414'
  ctx.font = 'bold 44px Georgia, "Yatra One", serif'
  ctx.fillText(memberName, width / 2, 545)

  // 7. Role / Designation Badge
  const badgeW = 440
  const badgeH = 54
  const badgeX = width / 2 - badgeW / 2
  const badgeY = 575

  ctx.fillStyle = '#7C2414'
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10)
  ctx.fill()

  ctx.strokeStyle = '#D7952F'
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.fillStyle = '#FFF8E7'
  ctx.font = 'bold 24px Mukta, sans-serif'
  ctx.fillText(`★ ${memberRole.toUpperCase()} ★`, width / 2, badgeY + 36)

  // 8. Details Card Box
  const boxW = 660
  const boxH = 290
  const boxX = width / 2 - boxW / 2
  const boxY = 660

  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#E2D3B8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 14)
  ctx.fill()
  ctx.stroke()

  // Grid details
  const rows = [
    ['MEMBER ID', `#${idNumber}`],
    ['PHONE / CONTACT', memberPhone ? `+91 ${memberPhone}` : 'Registered on File'],
    ['CELEBRATION', 'Vinayaka Chavithi 2026'],
    ['AUTHORIZED FOR', 'Stage, Aarti & Festival Seva']
  ]

  let rowY = boxY + 54
  rows.forEach(([label, value], idx) => {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#854D0E'
    ctx.font = 'bold 18px Mukta, sans-serif'
    ctx.fillText(label, boxX + 36, rowY)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#25211D'
    ctx.font = idx === 0 ? 'bold 22px monospace' : 'bold 20px Mukta, sans-serif'
    ctx.fillText(value, boxX + boxW - 36, rowY)

    if (idx < rows.length - 1) {
      ctx.strokeStyle = '#F0E6D2'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(boxX + 24, rowY + 16)
      ctx.lineTo(boxX + boxW - 24, rowY + 16)
      ctx.stroke()
    }

    rowY += 58
  })

  // 9. Verification Seal & Security Hologram
  const sealY = 1005
  ctx.fillStyle = '#F4EADA'
  ctx.beginPath()
  ctx.roundRect(width / 2 - 300, sealY, 600, 68, 8)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#166534'
  ctx.font = 'bold 18px Mukta, sans-serif'
  ctx.fillText('✓ AUTHORIZED COMMITTEE BADGE', width / 2 - 270, sealY + 42)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#7C2414'
  ctx.font = 'bold 20px Mukta, sans-serif'
  ctx.fillText('Utsava Committee 🙏', width / 2 + 270, sealY + 42)

  // 10. Footer Small Text
  ctx.textAlign = 'center'
  ctx.fillStyle = '#8C827A'
  ctx.font = '14px Mukta, sans-serif'
  ctx.fillText('This official badge must be worn or produced during festival events.', width / 2, 1120)
  ctx.fillText(`Issued by ${villageName} Committee · 2026`, width / 2, 1144)

  return canvas
}

/**
 * Generates and triggers download of the Member ID Badge as high-resolution PNG
 */
export async function downloadIdCard(member, settings = {}) {
  try {
    const canvas = await generateIdCardCanvas(member, settings)
    const rawName = member.name || 'Member'
    const sanitizedName = rawName.replace(/[^a-z0-9]/gi, '_')

    const link = document.createElement('a')
    link.download = `ID_Badge_${sanitizedName}_2026.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    return true
  } catch {
    return false
  }
}

/**
 * Shares the actual ID Badge image directly via Web Share API or downloads with WhatsApp fallback
 */
export async function shareIdCardImage(member = {}, settings = {}) {
  try {
    const canvas = await generateIdCardCanvas(member, settings)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Canvas blob generation failed')

    const rawName = member.name || 'Member'
    const fileName = `ID_Badge_${rawName.replace(/[^a-z0-9]/gi, '_')}_2026.png`
    const file = new File([blob], fileName, { type: 'image/png' })
    const villageName = settings.village_name || 'Vinayaka Vedika'
    const shareText = `🪔 *Official Committee ID Badge — ${member.name}* (${member.role || 'Member'})\n*${villageName} 2026*`

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Official Committee ID Badge - ${member.name}`,
        text: shareText
      })
      return { sharedDirectly: true }
    } else {
      // Desktop / fallback: download the image and open WhatsApp
      const link = document.createElement('a')
      link.download = fileName
      link.href = canvas.toDataURL('image/png')
      link.click()

      const encoded = encodeURIComponent(
        `🪔 *Official Committee ID Badge — ${member.name}* (${member.role})\n*${villageName} 2026*\n\n(The official ID badge image has been downloaded to your device.)`
      )
      const digits = String(member.phone || '').replace(/\D/g, '')
      const phoneParam = digits ? (digits.length === 10 ? `91${digits}` : digits) : ''
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

