import React from 'react'
import { numberToIndianRupeesWords } from '../lib/numberToWords'
import { openDonationWhatsAppReceipt } from '../lib/whatsapp'

export function OfficialReceiptModal({ donation, settings = {}, onClose }) {
  if (!donation) return null

  const receiptNo = donation.receipt_no || donation.id
    ? `VV-2026-${String(donation.receipt_no || donation.id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`
    : `VV-2026-${Math.floor(1000 + Math.random() * 9000)}`

  const committeeName = settings.festival_title || settings.village_name || 'Sri Vinayaka Utsava Samithi 2026'
  const villageName = settings.village_name || 'Vinayaka Vedika'
  const dateFormatted = donation.date
    ? new Date(donation.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  const amountNum = Number(donation.amount || 0)
  const amountInWords = numberToIndianRupeesWords(amountNum)
  const paymentMode = donation.payment_mode || donation.method || 'Cash'

  const qrData = encodeURIComponent(
    `VINAYAKA-VEDIKA-2026|RECEIPT:${receiptNo}|DONOR:${donation.name || 'Anonymous'}|AMOUNT:INR ${amountNum}|DATE:${donation.date || ''}`
  )
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${qrData}&margin=4`

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    openDonationWhatsAppReceipt({
      donor: donation,
      amount: amountNum,
      receiptNo,
      paymentMode,
      gotram: donation.gotram,
      date: dateFormatted,
      villageName: committeeName
    })
  }

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Action Controls Topbar (Hidden on Print) */}
        <div className="receipt-top-actions no-print">
          <div className="receipt-actions-left">
            <button className="btn-print-action" onClick={handlePrint}>
              🖨️ Print / Save PDF
            </button>
            <button className="btn-whatsapp-action" onClick={handleWhatsApp}>
              📲 Send WhatsApp
            </button>
          </div>
          <button className="btn-close-receipt" onClick={onClose} aria-label="Close receipt modal">
            ✕
          </button>
        </div>

        {/* Printable Temple Receipt Document */}
        <div className="temple-receipt-sheet" id="printable-receipt">
          {/* Ornamental Border */}
          <div className="receipt-inner-border">
            {/* Header */}
            <div className="receipt-header">
              <div className="receipt-ganesha-emblem">
                <span className="ganesha-symbol">卐</span>
                <span className="om-symbol">ॐ</span>
                <span className="ganesha-symbol">卐</span>
              </div>
              <h2 className="receipt-committee-title">{committeeName}</h2>
              <p className="receipt-committee-subtitle">
                {villageName} • Sri Ganesha Navaratri Mahotsavam 2026
              </p>
              <div className="receipt-divider-ornament">❖ ❖ ❖</div>
              <div className="receipt-badge-pill">
                OFFICIAL DONATION RECEIPT
              </div>
            </div>

            {/* Meta Row: Receipt No & Date */}
            <div className="receipt-meta-grid">
              <div className="receipt-meta-item">
                <span className="meta-label">Receipt No:</span>
                <span className="meta-value bold-accent">{receiptNo}</span>
              </div>
              <div className="receipt-meta-item meta-right">
                <span className="meta-label">Date:</span>
                <span className="meta-value">{dateFormatted}</span>
              </div>
            </div>

            {/* Devotee Info Table */}
            <table className="receipt-details-table">
              <tbody>
                <tr>
                  <td className="field-label">Donor Name:</td>
                  <td className="field-value highlight-name">{donation.name || 'Devotee / Contributor'}</td>
                </tr>
                {donation.gotram && (
                  <tr>
                    <td className="field-label">Gotram / Family:</td>
                    <td className="field-value">{donation.gotram}</td>
                  </tr>
                )}
                {donation.phone && (
                  <tr>
                    <td className="field-label">Mobile Number:</td>
                    <td className="field-value">{donation.phone}</td>
                  </tr>
                )}
                <tr>
                  <td className="field-label">Payment Mode:</td>
                  <td className="field-value">
                    <span className="payment-mode-tag">{paymentMode.toUpperCase()}</span>
                  </td>
                </tr>
                {donation.notes && (
                  <tr>
                    <td className="field-label">Purpose / Notes:</td>
                    <td className="field-value italic-note">{donation.notes}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Amount Box */}
            <div className="receipt-amount-container">
              <div className="amount-digit-box">
                <span className="rupee-symbol">₹</span>
                <span className="amount-number">{amountNum.toLocaleString('en-IN')}</span>
                <span className="amount-suffix">/-</span>
              </div>
              <div className="amount-words-box">
                <span className="words-label">Amount in Words:</span>
                <span className="words-value">{amountInWords}</span>
              </div>
            </div>

            {/* Blessing Note */}
            <div className="receipt-blessing-banner">
              🙏 May Lord Ganesha bestow peace, prosperity, and good health upon your family! 🙏
            </div>

            {/* Footer with QR Code and Signatures */}
            <div className="receipt-footer-grid">
              <div className="receipt-qr-col">
                <img
                  src={qrUrl}
                  alt="Receipt Verification QR"
                  className="receipt-qr-img"
                  loading="lazy"
                />
                <span className="qr-caption">Scan to Verify Authenticity</span>
              </div>

              <div className="receipt-stamp-col">
                <div className="temple-seal-stamp">
                  <div className="seal-inner">
                    <span>Sri Varasiddhi Vinayaka</span>
                    <span className="seal-center">★ 2026 ★</span>
                    <span>Utsava Samithi</span>
                  </div>
                </div>
              </div>

              <div className="receipt-signature-col">
                <div className="signature-line"></div>
                <span className="signature-title">Authorized Signatory</span>
                <span className="signature-sub">(Treasurer / President)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
