/**
 * WhatsApp Instant Messaging & Receipt Generator for Vinayaka Vedika 2026
 */

/**
 * Clean phone number to standard international format without '+' or spaces
 */
export function sanitizePhoneNumber(phone) {
  if (!phone) return ''
  let cleaned = String(phone).replace(/[^0-9]/g, '')
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  return cleaned
}

/**
 * 1-Click WhatsApp Donation Receipt in auspicious Telugu & English
 */
export function openDonationWhatsAppReceipt({
  donor,
  amount,
  receiptNo,
  paymentMode = 'Cash',
  gotram = '',
  date = new Date().toLocaleDateString('en-IN'),
  villageName = 'శ్రీ వరసిద్ధి వినాయక ఉత్సవ సమితి 2026'
}) {
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN')
  const cleanPhone = sanitizePhoneNumber(donor?.phone || donor?.mobile || '')

  const lines = [
    `🚩 *${villageName}* 🚩`,
    `✨ *శ్రీ గణేశ విరాళం రసీదు / DONATION RECEIPT* ✨`,
    `───────────────────────`,
    `👤 *భక్తుని పేరు (Donor):* ${donor?.name || 'భక్తులు'}`,
    gotram ? `🌿 *గోత్రం (Gotram):* ${gotram}` : null,
    `💰 *మొత్తం (Amount):* ₹${formattedAmount}/-`,
    `🧾 *రసీదు నం (Receipt No):* #${receiptNo || `VV-2026-${Math.floor(1000 + Math.random() * 9000)}`}`,
    `💳 *విధానం (Payment Mode):* ${paymentMode}`,
    `📅 *తేదీ (Date):* ${date}`,
    `───────────────────────`,
    `🙏 *ఆ విఘ్నేశ్వరుని కృపాకటాక్షాలు మీ కుటుంబంపై ఎల్లప్పుడూ ఉండాలని కోరుకుంటున్నాము.*`,
    `_గణపతి బాప్పా మోరియా!_ 🌺`
  ].filter(Boolean)

  const messageText = lines.join('\n')
  const encodedText = encodeURIComponent(messageText)

  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`

  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 1-Click WhatsApp Volunteer Duty Alert
 */
export function openVolunteerDutyWhatsApp({
  name,
  phone,
  duty,
  shiftTime,
  date = new Date().toLocaleDateString('en-IN'),
  villageName = 'వినాయక ఉత్సవ కమిటీ 2026'
}) {
  const cleanPhone = sanitizePhoneNumber(phone)

  const lines = [
    `🚩 *${villageName} - వాలంటీర్ సేవా డ్యూటీ* 🚩`,
    `───────────────────────`,
    `నమస్కారం *${name}* గారు,`,
    ``,
    `మీకు కేటాయించిన ఉత్సవ సేవా బాధ్యత:`,
    `🎯 *బాధ్యత (Duty):* ${duty || 'సాధారణ సేవ'}`,
    shiftTime ? `⏰ *సమయం (Shift Time):* ${shiftTime}` : null,
    `📅 *తేదీ (Date):* ${date}`,
    `📍 *ప్రాంగణం (Location):* వినాయక మండపం`,
    `───────────────────────`,
    `సమయానికి విచ్చేసి గణనాథుని సేవలో పాల్గొనవలసిందిగా కోరుతున్నాము.`,
    `_గణపతి బాప్పా మోరియా!_ 🌺`
  ].filter(Boolean)

  const messageText = lines.join('\n')
  const encodedText = encodeURIComponent(messageText)

  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`

  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 1-Click WhatsApp Laddu Auction Winner Alert
 */
export function openLadduBidWinnerWhatsApp({
  bidderName,
  phone,
  amount,
  item = 'మహా ప్రసాదం లడ్డూ (Maha Prasadam Laddu)',
  villageName = 'శ్రీ వినాయక ఉత్సవ కమిటీ 2026'
}) {
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN')
  const cleanPhone = sanitizePhoneNumber(phone)

  const lines = [
    `🏆 *${villageName}* 🏆`,
    `🎉 *మహా లడ్డూ వేలం గెలుపొందిన శుభాకాంక్షలు!* 🎉`,
    `───────────────────────`,
    `శ్రీ/శ్రీమతి: *${bidderName}* గారికి,`,
    ``,
    `మీరు అత్యధిక వేలం పాడి *${item}* ను కైవసం చేసుకున్నారు!`,
    `💰 *గెలుపొందిన మొత్తం (Winning Bid):* ₹${formattedAmount}/-`,
    `📅 *తేదీ:* ${new Date().toLocaleDateString('en-IN')}`,
    `───────────────────────`,
    `మీ ఇంట ఆ గణనాథుడు సుఖసంతోషాలు, ఆయురారోగ్యాలు నింపాలని మనస్ఫూర్తిగా కోరుకుంటున్నాము.`,
    `_జై గణేష్! గణపతి బాప్పా మోరియా!_ 🌺`
  ].filter(Boolean)

  const messageText = lines.join('\n')
  const encodedText = encodeURIComponent(messageText)

  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`

  window.open(url, '_blank', 'noopener,noreferrer')
}

