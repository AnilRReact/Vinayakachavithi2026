import React, { useState, useMemo } from 'react'
import { exportMasterFestivalWorkbook, exportTableToExcel } from '../../lib/excelParser'

export function ReportsSection({ data = {}, admin = false, authorized = false, onOpenLogin }) {
  const [activeTab, setActiveTab] = useState('donations')
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const settings = data.settings?.[0] || {}
  const villageName = settings.village_name || 'Sri Vinayaka Vedika 2026'

  const donations = useMemo(() => data.donations || [], [data.donations])
  const expenses = useMemo(() => data.expenses || [], [data.expenses])
  const prasadSponsors = useMemo(() => data.prasad_sponsors || [], [data.prasad_sponsors])
  const committee = useMemo(() => data.committee_members || [], [data.committee_members])
  const volunteers = useMemo(() => data.volunteers || [], [data.volunteers])
  const bidItems = useMemo(() => data.bid_items || [], [data.bid_items])
  const purchases = useMemo(() => data.purchases || [], [data.purchases])
  const activities = useMemo(() => data.activities || [], [data.activities])
  const awards = useMemo(() => data.awards || [], [data.awards])

  // --- Financial Calculations ---
  const totalDonations = useMemo(
    () => donations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [donations]
  )

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  )

  const netBalance = totalDonations - totalExpenses
  const isSurplus = netBalance >= 0
  const spentPercentage = totalDonations > 0 ? Math.min(100, Math.round((totalExpenses / totalDonations) * 100)) : 0
  const balancePercentage = totalDonations > 0 ? Math.max(0, 100 - spentPercentage) : 0
  const avgDonation = donations.length > 0 ? Math.round(totalDonations / donations.length) : 0

  const reusablePurchases = useMemo(
    () => purchases.filter((p) => p.reusable),
    [purchases]
  )
  const totalAssetsWorth = useMemo(
    () => reusablePurchases.reduce((sum, p) => sum + Number(p.cost || 0), 0),
    [reusablePurchases]
  )

  // --- Expense Category Breakdown ---
  const expenseCategories = useMemo(() => {
    const map = {}
    expenses.forEach((e) => {
      const cat = e.category || 'General & Misc'
      const amt = Number(e.amount || 0)
      if (!map[cat]) {
        map[cat] = { category: cat, total: 0, count: 0 }
      }
      map[cat].total += amt
      map[cat].count += 1
    })
    const list = Object.values(map)
    list.sort((a, b) => b.total - a.total)
    return list
  }, [expenses])

  // --- Devotee Contribution Tiers ---
  const donorTiers = useMemo(() => {
    let vipCount = 0, vipTotal = 0
    let patronCount = 0, patronTotal = 0
    let supporterCount = 0, supporterTotal = 0

    donations.forEach((d) => {
      const amt = Number(d.amount || 0)
      if (amt >= 5000) {
        vipCount++
        vipTotal += amt
      } else if (amt >= 2000) {
        patronCount++
        patronTotal += amt
      } else {
        supporterCount++
        supporterTotal += amt
      }
    })

    return {
      vip: { count: vipCount, total: vipTotal, pct: totalDonations > 0 ? Math.round((vipTotal / totalDonations) * 100) : 0 },
      patron: { count: patronCount, total: patronTotal, pct: totalDonations > 0 ? Math.round((patronTotal / totalDonations) * 100) : 0 },
      supporter: { count: supporterCount, total: supporterTotal, pct: totalDonations > 0 ? Math.round((supporterTotal / totalDonations) * 100) : 0 }
    }
  }, [donations, totalDonations])

  // --- Payment Modes Breakdown ---
  const paymentModes = useMemo(() => {
    const modes = { UPI: 0, Cash: 0, Bank: 0 }
    donations.forEach((d) => {
      const mode = String(d.payment_mode || d.note || '').toLowerCase()
      const amt = Number(d.amount || 0)
      if (mode.includes('upi') || mode.includes('phonepe') || mode.includes('gpay') || mode.includes('paytm') || mode.includes('online')) {
        modes.UPI += amt
      } else if (mode.includes('bank') || mode.includes('neft') || mode.includes('cheque') || mode.includes('transfer')) {
        modes.Bank += amt
      } else {
        modes.Cash += amt
      }
    })
    return modes
  }, [donations])

  // --- Day-by-Day Timeline Breakdown ---
  const dailyTimeline = useMemo(() => {
    const daysMap = {}

    donations.forEach((d) => {
      const day = d.date || 'Undated'
      if (!daysMap[day]) daysMap[day] = { date: day, income: 0, expense: 0 }
      daysMap[day].income += Number(d.amount || 0)
    })

    expenses.forEach((e) => {
      const day = e.date || 'Undated'
      if (!daysMap[day]) daysMap[day] = { date: day, income: 0, expense: 0 }
      daysMap[day].expense += Number(e.amount || 0)
    })

    const days = Object.values(daysMap)
    days.sort((a, b) => a.date.localeCompare(b.date))
    return days
  }, [donations, expenses])

  // --- Master Export Handler ---
  const handleExportMasterExcel = async () => {
    setIsExporting(true)
    try {
      await exportMasterFestivalWorkbook(data, villageName)
    } catch (err) {
      console.error('Export error:', err)
      alert('Could not export master workbook. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // --- Single Segment Export Handler ---
  const handleExportSegment = async (segmentKey, list) => {
    const fileName = `${villageName}_${segmentKey}_2026.xlsx`
    await exportTableToExcel(list, segmentKey, fileName)
  }

  // --- WhatsApp Financial Statement Generator ---
  const handleShareWhatsApp = () => {
    const text = `🕉️ *${villageName.toUpperCase()} - 2026* 🕉️\n` +
      `📊 *OFFICIAL FESTIVAL FINANCIAL & OPERATIONS REPORT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total Collections (చందా):* ₹ ${totalDonations.toLocaleString()}\n` +
      `💸 *Total Expenditure (ఖర్చులు):* ₹ ${totalExpenses.toLocaleString()}\n` +
      `💎 *Net Treasury Balance:* ₹ ${netBalance.toLocaleString()} (${isSurplus ? 'Surplus' : 'Deficit'})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👥 *Devotee Donors:* ${donations.length} contributors\n` +
      `🍯 *Prasad Sponsors:* ${prasadSponsors.length} Seva offerings\n` +
      `🏷️ *Permanent Assets Worth:* ₹ ${totalAssetsWorth.toLocaleString()}\n` +
      `🎖️ *Active Committee & Volunteers:* ${committee.length + volunteers.length} members\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🪔 *Ganapathi Bappa Morya! Mangala Harathi!* 🪔`

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // --- Copy Summary to Clipboard ---
  const handleCopySummary = () => {
    const text = `🕉️ ${villageName} - 2026 Financial Audit\n` +
      `Collections: ₹ ${totalDonations.toLocaleString()} | Expenses: ₹ ${totalExpenses.toLocaleString()} | Balance: ₹ ${netBalance.toLocaleString()}\n` +
      `Donors: ${donations.length} | Prasad Sponsors: ${prasadSponsors.length} | Assets: ₹ ${totalAssetsWorth.toLocaleString()}`

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2500)
    })
  }

  // --- Filtered Data for Segment Explorer Table ---
  const filteredDonations = useMemo(() => {
    if (!searchTerm) return donations
    const q = searchTerm.toLowerCase()
    return donations.filter(
      (d) =>
        String(d.donor_name || '').toLowerCase().includes(q) ||
        String(d.phone || '').toLowerCase().includes(q) ||
        String(d.note || '').toLowerCase().includes(q) ||
        String(d.amount || '').includes(q)
    )
  }, [donations, searchTerm])

  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses
    const q = searchTerm.toLowerCase()
    return expenses.filter(
      (e) =>
        String(e.item || '').toLowerCase().includes(q) ||
        String(e.category || '').toLowerCase().includes(q) ||
        String(e.paid_by || '').toLowerCase().includes(q) ||
        String(e.paid_to || '').toLowerCase().includes(q) ||
        String(e.amount || '').includes(q)
    )
  }, [expenses, searchTerm])

  const filteredPrasad = useMemo(() => {
    if (!searchTerm) return prasadSponsors
    const q = searchTerm.toLowerCase()
    return prasadSponsors.filter(
      (p) =>
        String(p.sponsor_name || '').toLowerCase().includes(q) ||
        String(p.item || '').toLowerCase().includes(q) ||
        String(p.phone || '').toLowerCase().includes(q)
    )
  }, [prasadSponsors, searchTerm])

  const filteredCommittee = useMemo(() => {
    if (!searchTerm) return committee
    const q = searchTerm.toLowerCase()
    return committee.filter(
      (c) =>
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.role || '').toLowerCase().includes(q) ||
        String(c.phone || '').toLowerCase().includes(q)
    )
  }, [committee, searchTerm])

  const filteredVolunteers = useMemo(() => {
    if (!searchTerm) return volunteers
    const q = searchTerm.toLowerCase()
    return volunteers.filter(
      (v) =>
        String(v.name || '').toLowerCase().includes(q) ||
        String(v.duty || '').toLowerCase().includes(q) ||
        String(v.contact || '').toLowerCase().includes(q)
    )
  }, [volunteers, searchTerm])

  const filteredBids = useMemo(() => {
    if (!searchTerm) return bidItems
    const q = searchTerm.toLowerCase()
    return bidItems.filter(
      (b) =>
        String(b.item_name || '').toLowerCase().includes(q) ||
        String(b.current_bidder || '').toLowerCase().includes(q)
    )
  }, [bidItems, searchTerm])

  const filteredPurchases = useMemo(() => {
    if (!searchTerm) return purchases
    const q = searchTerm.toLowerCase()
    return purchases.filter(
      (a) =>
        String(a.item || '').toLowerCase().includes(q) ||
        String(a.category || '').toLowerCase().includes(q)
    )
  }, [purchases, searchTerm])

  const filteredActivities = useMemo(() => {
    if (!searchTerm) return activities
    const q = searchTerm.toLowerCase()
    return activities.filter(
      (a) =>
        String(a.title || '').toLowerCase().includes(q) ||
        String(a.location || '').toLowerCase().includes(q)
    )
  }, [activities, searchTerm])

  const filteredAwards = useMemo(() => {
    if (!searchTerm) return awards
    const q = searchTerm.toLowerCase()
    return awards.filter(
      (w) =>
        String(w.title || '').toLowerCase().includes(q) ||
        String(w.recipient || '').toLowerCase().includes(q)
    )
  }, [awards, searchTerm])

  return (
    <div className="reports-container">
      {/* 1. Hero Action Banner */}
      <section className="reports-hero-card">
        <div className="reports-hero-content">
          <div className="reports-hero-badge">
            <span className="badge-glow-dot"></span>
            <b>Master Audit & Excel Hub</b> · <span>2026 Edition</span>
          </div>
          <h1 className="reports-hero-title">
            Festival Analytics & Excel Reports
          </h1>
          <p className="reports-hero-sub">
            Complete transparency dashboard for {villageName}. View visual income/expense graphs, category breakdowns, and export ready-to-share master Excel workbooks.
          </p>
        </div>

        <div className="reports-master-actions">
          <button
            type="button"
            className="master-action-btn primary-excel"
            onClick={handleExportMasterExcel}
            disabled={isExporting}
          >
            <span className="action-btn-icon">📗</span>
            <div>
              <b>{isExporting ? 'Generating Excel...' : 'Download Master Excel'}</b>
              <small>All 10 sheets in 1 file (.xlsx)</small>
            </div>
          </button>

          <button
            type="button"
            className="master-action-btn secondary-print"
            onClick={() => setShowPrintModal(true)}
          >
            <span className="action-btn-icon">🖨️</span>
            <div>
              <b>Print Audit Report / PDF</b>
              <small>With official signatures & seals</small>
            </div>
          </button>

          <button
            type="button"
            className="master-action-btn tertiary-whatsapp"
            onClick={handleShareWhatsApp}
          >
            <span className="action-btn-icon">📲</span>
            <div>
              <b>Share on WhatsApp</b>
              <small>Instant financial summary text</small>
            </div>
          </button>

          <button
            type="button"
            className="master-action-btn quaternary-copy"
            onClick={handleCopySummary}
          >
            <span className="action-btn-icon">{copySuccess ? '✅' : '📋'}</span>
            <div>
              <b>{copySuccess ? 'Copied Summary!' : 'Copy Summary'}</b>
              <small>Quick clipboard statement</small>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Executive KPI Summary Cards */}
      <section className="reports-kpi-grid">
        <div className="report-kpi-card income">
          <div className="kpi-card-header">
            <span className="kpi-icon">💰</span>
            <span className="kpi-badge income">Collections</span>
          </div>
          <div className="kpi-value">₹ {totalDonations.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span><b>{donations.length}</b> Devotee Donors</span> · <span>Avg: ₹ {avgDonation.toLocaleString()}</span>
          </div>
          <div className="kpi-progress-bg">
            <div className="kpi-progress-bar income" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="report-kpi-card expense">
          <div className="kpi-card-header">
            <span className="kpi-icon">💸</span>
            <span className="kpi-badge expense">Expenditure</span>
          </div>
          <div className="kpi-value">₹ {totalExpenses.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span><b>{expenses.length}</b> Expense Items</span> · <span>{spentPercentage}% of collections</span>
          </div>
          <div className="kpi-progress-bg">
            <div
              className="kpi-progress-bar expense"
              style={{ width: `${Math.min(100, spentPercentage)}%` }}
            ></div>
          </div>
        </div>

        <div className={`report-kpi-card balance ${isSurplus ? 'surplus' : 'deficit'}`}>
          <div className="kpi-card-header">
            <span className="kpi-icon">💎</span>
            <span className={`kpi-badge ${isSurplus ? 'surplus' : 'deficit'}`}>
              {isSurplus ? 'Net Surplus' : 'Net Deficit'}
            </span>
          </div>
          <div className="kpi-value">₹ {netBalance.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span>Treasury Status: <b>{isSurplus ? 'Healthy (+)' : 'Needs Attention (-)'}</b></span>
          </div>
          <div className="kpi-progress-bg">
            <div
              className="kpi-progress-bar balance"
              style={{ width: `${Math.min(100, Math.max(5, balancePercentage))}%` }}
            ></div>
          </div>
        </div>

        <div className="report-kpi-card sponsors">
          <div className="kpi-card-header">
            <span className="kpi-icon">🍯</span>
            <span className="kpi-badge sponsors">Prasad Seva</span>
          </div>
          <div className="kpi-value">{prasadSponsors.length} Sponsors</div>
          <div className="kpi-subtext">
            <span>Annadanam & Daily Pooja offerings</span>
          </div>
        </div>

        <div className="report-kpi-card assets">
          <div className="kpi-card-header">
            <span className="kpi-icon">🏷️</span>
            <span className="kpi-badge assets">Permanent Assets</span>
          </div>
          <div className="kpi-value">₹ {totalAssetsWorth.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span><b>{reusablePurchases.length}</b> Reusable inventory items</span>
          </div>
        </div>

        <div className="report-kpi-card team">
          <div className="kpi-card-header">
            <span className="kpi-icon">🎖️</span>
            <span className="kpi-badge team">Committee & Seva</span>
          </div>
          <div className="kpi-value">{committee.length + volunteers.length} Members</div>
          <div className="kpi-subtext">
            <span>{committee.length} Officers · {volunteers.length} Active Sevaks</span>
          </div>
        </div>
      </section>

      {/* 3. Visual Charts & Analytics Section */}
      <section className="reports-analytics-grid">
        {/* Financial Ratio Gauge */}
        <div className="analytics-card full-width">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <span className="card-title-icon">📊</span>
              <div>
                <h3>Festival Financial Health & Ratio</h3>
                <small>Proportion of Collections vs Expenditure vs Net Treasury Surplus</small>
              </div>
            </div>
            <div className="ratio-legend">
              <span className="legend-item spent">
                <span className="legend-dot spent"></span> Spent: {spentPercentage}%
              </span>
              <span className="legend-item balance">
                <span className="legend-dot balance"></span> Balance: {balancePercentage}%
              </span>
            </div>
          </div>

          <div className="financial-health-meter">
            <div
              className="health-meter-segment spent"
              style={{ width: `${spentPercentage}%` }}
              title={`Spent: ₹${totalExpenses.toLocaleString()} (${spentPercentage}%)`}
            >
              {spentPercentage > 15 && `₹ ${totalExpenses.toLocaleString()}`}
            </div>
            <div
              className="health-meter-segment balance"
              style={{ width: `${balancePercentage}%` }}
              title={`Balance: ₹${netBalance.toLocaleString()} (${balancePercentage}%)`}
            >
              {balancePercentage > 15 && `₹ ${netBalance.toLocaleString()}`}
            </div>
          </div>

          <div className="health-meter-summary-row">
            <div className="meter-col">
              <small>Total Inflow (Donations)</small>
              <b>₹ {totalDonations.toLocaleString()}</b>
            </div>
            <div className="meter-col">
              <small>Total Outflow (Expenses)</small>
              <b style={{ color: '#b91c1c' }}>- ₹ {totalExpenses.toLocaleString()}</b>
            </div>
            <div className="meter-col">
              <small>Net Surplus in Treasury</small>
              <b style={{ color: '#15803d' }}>= ₹ {netBalance.toLocaleString()}</b>
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <span className="card-title-icon">🍩</span>
              <div>
                <h3>Expense Breakdown by Category</h3>
                <small>Where the festival funds were utilized</small>
              </div>
            </div>
          </div>

          <div className="category-bars-list">
            {expenseCategories.length === 0 ? (
              <p className="empty-chart-note">No expense records logged yet.</p>
            ) : (
              expenseCategories.map((cat, idx) => {
                const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0
                return (
                  <div key={cat.category} className="category-bar-row">
                    <div className="category-bar-label">
                      <span className="cat-name">
                        <span className="cat-rank">#{idx + 1}</span> {cat.category}
                      </span>
                      <span className="cat-amt">
                        <b>₹ {cat.total.toLocaleString()}</b> ({pct}%)
                      </span>
                    </div>
                    <div className="category-bar-track">
                      <div
                        className="category-bar-fill"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: `hsl(${25 + idx * 35}, 85%, 45%)`
                        }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Devotee Contribution Tiers Chart */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <span className="card-title-icon">🏆</span>
              <div>
                <h3>Devotee Contribution Tiers</h3>
                <small>Distribution across donation amounts</small>
              </div>
            </div>
          </div>

          <div className="tier-cards-container">
            <div className="tier-card vip">
              <div className="tier-header">
                <span className="tier-badge vip">VIP Donors</span>
                <span className="tier-range">₹ 5,000+</span>
              </div>
              <div className="tier-numbers">
                <div className="tier-amt">₹ {donorTiers.vip.total.toLocaleString()}</div>
                <div className="tier-meta">{donorTiers.vip.count} donors · {donorTiers.vip.pct}% of total</div>
              </div>
              <div className="tier-bar-bg">
                <div className="tier-bar-fill vip" style={{ width: `${donorTiers.vip.pct}%` }}></div>
              </div>
            </div>

            <div className="tier-card patron">
              <div className="tier-header">
                <span className="tier-badge patron">Patron Donors</span>
                <span className="tier-range">₹ 2,000 - ₹ 4,999</span>
              </div>
              <div className="tier-numbers">
                <div className="tier-amt">₹ {donorTiers.patron.total.toLocaleString()}</div>
                <div className="tier-meta">{donorTiers.patron.count} donors · {donorTiers.patron.pct}% of total</div>
              </div>
              <div className="tier-bar-bg">
                <div className="tier-bar-fill patron" style={{ width: `${donorTiers.patron.pct}%` }}></div>
              </div>
            </div>

            <div className="tier-card supporter">
              <div className="tier-header">
                <span className="tier-badge supporter">Devotee Donors</span>
                <span className="tier-range">Under ₹ 2,000</span>
              </div>
              <div className="tier-numbers">
                <div className="tier-amt">₹ {donorTiers.supporter.total.toLocaleString()}</div>
                <div className="tier-meta">{donorTiers.supporter.count} donors · {donorTiers.supporter.pct}% of total</div>
              </div>
              <div className="tier-bar-bg">
                <div className="tier-bar-fill supporter" style={{ width: `${donorTiers.supporter.pct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modes Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <span className="card-title-icon">💳</span>
              <div>
                <h3>Payment Modes Received</h3>
                <small>UPI vs Cash vs Direct Bank</small>
              </div>
            </div>
          </div>

          <div className="payment-modes-grid">
            <div className="payment-mode-pill upi">
              <span className="mode-icon">📱</span>
              <div>
                <small>UPI / PhonePe / GPay</small>
                <b>₹ {paymentModes.UPI.toLocaleString()}</b>
                <span className="mode-pct">
                  {totalDonations > 0 ? Math.round((paymentModes.UPI / totalDonations) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="payment-mode-pill cash">
              <span className="mode-icon">💵</span>
              <div>
                <small>Cash Receipts</small>
                <b>₹ {paymentModes.Cash.toLocaleString()}</b>
                <span className="mode-pct">
                  {totalDonations > 0 ? Math.round((paymentModes.Cash / totalDonations) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="payment-mode-pill bank">
              <span className="mode-icon">🏛️</span>
              <div>
                <small>Bank Transfer</small>
                <b>₹ {paymentModes.Bank.toLocaleString()}</b>
                <span className="mode-pct">
                  {totalDonations > 0 ? Math.round((paymentModes.Bank / totalDonations) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Day-by-Day Festival Timeline Table */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <span className="card-title-icon">📅</span>
              <div>
                <h3>Day-by-Day Financial Timeline</h3>
                <small>Daily Collections vs Daily Expenses</small>
              </div>
            </div>
          </div>

          <div className="timeline-table-container">
            {dailyTimeline.length === 0 ? (
              <p className="empty-chart-note">No dated records found.</p>
            ) : (
              <table className="report-mini-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Daily Inflow (₹)</th>
                    <th style={{ textAlign: 'right' }}>Daily Spent (₹)</th>
                    <th style={{ textAlign: 'right' }}>Net (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyTimeline.map((row) => {
                    const diff = row.income - row.expense
                    return (
                      <tr key={row.date}>
                        <td><b>{row.date}</b></td>
                        <td style={{ textAlign: 'right', color: '#15803d' }}>
                          + ₹ {row.income.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', color: '#b91c1c' }}>
                          - ₹ {row.expense.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: diff >= 0 ? '#15803d' : '#b91c1c' }}>
                          ₹ {diff.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* 4. Live Interactive Segment Explorer */}
      <section className="reports-segment-explorer">
        <div className="explorer-header">
          <div className="explorer-title-block">
            <h2>Live Segment Data Tables</h2>
            <p>Browse raw records across any section and download individual Excel spreadsheets.</p>
          </div>

          <div className="explorer-controls">
            <div className="explorer-search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search anything (names, notes, ₹)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="explorer-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              className="export-segment-btn"
              onClick={() => {
                if (activeTab === 'donations') handleExportSegment('donations', donations)
                else if (activeTab === 'expenses') handleExportSegment('expenses', expenses)
                else if (activeTab === 'prasad') handleExportSegment('prasad_sponsors', prasadSponsors)
                else if (activeTab === 'committee') handleExportSegment('committee_members', committee)
                else if (activeTab === 'volunteers') handleExportSegment('volunteers', volunteers)
                else if (activeTab === 'bids') handleExportSegment('bid_items', bidItems)
                else if (activeTab === 'purchases') handleExportSegment('purchases', purchases)
                else if (activeTab === 'activities') handleExportSegment('activities', activities)
                else if (activeTab === 'awards') handleExportSegment('awards', awards)
              }}
            >
              📥 Export {activeTab.toUpperCase()} (.xlsx)
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="explorer-tabs-scroll">
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            💰 Donations ({donations.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            💸 Expenses ({expenses.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'prasad' ? 'active' : ''}`}
            onClick={() => setActiveTab('prasad')}
          >
            🍯 Prasad Sponsors ({prasadSponsors.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'committee' ? 'active' : ''}`}
            onClick={() => setActiveTab('committee')}
          >
            🎖️ Committee ({committee.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => setActiveTab('volunteers')}
          >
            👥 Volunteers ({volunteers.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'bids' ? 'active' : ''}`}
            onClick={() => setActiveTab('bids')}
          >
            🔨 Laddu Auction ({bidItems.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'purchases' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchases')}
          >
            🏷️ Assets ({purchases.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            🪔 Schedule ({activities.length})
          </button>
          <button
            type="button"
            className={`explorer-tab-pill ${activeTab === 'awards' ? 'active' : ''}`}
            onClick={() => setActiveTab('awards')}
          >
            🏆 Awards ({awards.length})
          </button>
        </div>

        {/* Active Tab Data Table */}
        <div className="explorer-table-card">
          {activeTab === 'donations' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Devotee Name</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Date</th>
                  <th>Phone</th>
                  <th>Gotram / Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">No matching donation records found.</td>
                  </tr>
                ) : (
                  filteredDonations.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{d.donor_name || d.name || 'Anonymous'}</b></td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                        ₹ {Number(d.amount || 0).toLocaleString()}
                      </td>
                      <td>{d.date || '—'}</td>
                      <td>{(admin || authorized) ? (d.phone || '—') : <span className="lock-tag">🔒 Private</span>}</td>
                      <td>{(admin || authorized) ? (d.note || d.gotram || '—') : <span className="lock-tag">🔒 Private</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><b>Total ({filteredDonations.length} items):</b></td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                    ₹ {filteredDonations.reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          )}

          {activeTab === 'expenses' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Expense Category</th>
                  <th style={{ textAlign: 'right' }}>Amount Spent</th>
                  <th>Paid By (Spent By)</th>
                  <th>Paid To (Vendor)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">No matching expense records found.</td>
                  </tr>
                ) : (
                  filteredExpenses.map((e, idx) => (
                    <tr key={e.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{e.category || e.item || 'General'}</b></td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                        ₹ {Number(e.amount || 0).toLocaleString()}
                      </td>
                      <td><span className="table-cat-badge">{e.paid_by || 'Committee Fund'}</span></td>
                      <td>{e.paid_to || '—'}</td>
                      <td>{e.date || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><b>Total Spent:</b></td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                    ₹ {filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          )}

          {activeTab === 'prasad' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sponsor Name</th>
                  <th>Prasadam / Food Item</th>
                  <th>Date</th>
                  <th>Phone</th>
                  <th>Special Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrasad.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">No matching prasad records found.</td>
                  </tr>
                ) : (
                  filteredPrasad.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{p.sponsor_name || '—'}</b></td>
                      <td>{p.item || '—'}</td>
                      <td>{p.date || '—'}</td>
                      <td>{p.phone || '—'}</td>
                      <td>{p.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'committee' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Member Name</th>
                  <th>Official Designation</th>
                  <th>Phone / WhatsApp</th>
                  <th>Village / Colony</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommittee.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">No matching committee records found.</td>
                  </tr>
                ) : (
                  filteredCommittee.map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{c.name || '—'}</b></td>
                      <td><span className="role-badge">{c.role || 'Member'}</span></td>
                      <td>{c.phone || '—'}</td>
                      <td>{c.village || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'volunteers' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Volunteer Name</th>
                  <th>Assigned Seva Duty</th>
                  <th>Duty Date / Shift</th>
                  <th>Phone / Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">No matching volunteer records found.</td>
                  </tr>
                ) : (
                  filteredVolunteers.map((v, idx) => (
                    <tr key={v.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{v.name || '—'}</b></td>
                      <td><span className="duty-badge">{v.duty || 'General Seva'}</span></td>
                      <td>{v.date || '—'}</td>
                      <td>{v.contact || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'bids' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Auction Item</th>
                  <th style={{ textAlign: 'right' }}>Starting Bid</th>
                  <th style={{ textAlign: 'right' }}>Winning / Current Bid</th>
                  <th>Current Highest Bidder</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBids.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">No auction records found.</td>
                  </tr>
                ) : (
                  filteredBids.map((b, idx) => (
                    <tr key={b.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{b.item_name || '—'}</b></td>
                      <td style={{ textAlign: 'right' }}>₹ {Number(b.starting_bid || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}>
                        ₹ {Number(b.current_bid || b.starting_bid || 0).toLocaleString()}
                      </td>
                      <td><b>{b.current_bidder || 'No bids yet'}</b></td>
                      <td><span className={`status-pill ${b.status || 'open'}`}>{b.status || 'open'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'purchases' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item / Asset</th>
                  <th style={{ textAlign: 'right' }}>Cost (₹)</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Permanent Reusable</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">No asset records found.</td>
                  </tr>
                ) : (
                  filteredPurchases.map((a, idx) => (
                    <tr key={a.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{a.item || '—'}</b></td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹ {Number(a.cost || 0).toLocaleString()}</td>
                      <td>{a.category || '—'}</td>
                      <td>{a.year || '—'}</td>
                      <td>{a.reusable ? '✅ Permanent Asset' : 'One-time'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'activities' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pooja / Event Program</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue / Location</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">No pooja schedule records found.</td>
                  </tr>
                ) : (
                  filteredActivities.map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{s.title || '—'}</b></td>
                      <td>{s.date || '—'}</td>
                      <td>{s.start_time || '—'}</td>
                      <td>{s.location || '—'}</td>
                      <td>{s.description || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'awards' && (
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Award / Honor Title</th>
                  <th>Recipient / Devotee</th>
                  <th>Year</th>
                  <th>Citation / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredAwards.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">No awards records found.</td>
                  </tr>
                ) : (
                  filteredAwards.map((w, idx) => (
                    <tr key={w.id || idx}>
                      <td>{idx + 1}</td>
                      <td><b>{w.title || '—'}</b></td>
                      <td><b>{w.recipient || '—'}</b></td>
                      <td>{w.year || '—'}</td>
                      <td>{w.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 5. Printable Official Audit Statement Modal */}
      {showPrintModal && (
        <div className="printable-report-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="printable-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="printable-modal-toolbar">
              <button
                type="button"
                className="print-action-btn"
                onClick={() => window.print()}
              >
                🖨️ Print / Save as PDF
              </button>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPrintModal(false)}
              >
                ✕ Close
              </button>
            </div>

            {/* Print Sheet Content */}
            <div className="official-print-document">
              <div className="official-doc-header">
                <span className="doc-om">ॐ</span>
                <h2>{villageName.toUpperCase()}</h2>
                <h3>SRI VINAYAKA UTSAVAM 2026 - OFFICIAL AUDIT & FINANCIAL REPORT</h3>
                <p>Date of Audit Report: <b>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</b></p>
              </div>

              <div className="doc-divider"></div>

              {/* Financial Summary Table */}
              <table className="doc-summary-table">
                <thead>
                  <tr>
                    <th>Audited Statement Parameter</th>
                    <th style={{ textAlign: 'right' }}>Amount / Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>💰 Total Collections (Devotee Chanda & Donations)</b></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                      ₹ {totalDonations.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td><b>💸 Total Festival Expenditure (Pandals, Sound, Pooja, Prasadam)</b></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                      - ₹ {totalExpenses.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="highlight-row">
                    <td><b>💎 Net Treasury Balance Remaining ({isSurplus ? 'Surplus' : 'Deficit'})</b></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.15rem' }}>
                      ₹ {netBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td>Permanent Reusable Assets Stored for Future Years</td>
                    <td style={{ textAlign: 'right' }}>₹ {totalAssetsWorth.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Total Devotees Contributing Donations</td>
                    <td style={{ textAlign: 'right' }}>{donations.length} Devotees</td>
                  </tr>
                  <tr>
                    <td>Total Prasad & Annadanam Sponsors</td>
                    <td style={{ textAlign: 'right' }}>{prasadSponsors.length} Seva Offerings</td>
                  </tr>
                  <tr>
                    <td>Committee Members & Volunteers on Duty</td>
                    <td style={{ textAlign: 'right' }}>{committee.length + volunteers.length} Members</td>
                  </tr>
                </tbody>
              </table>

              {/* Category Breakdown Table */}
              <h4 style={{ marginTop: '24px', marginBottom: '8px' }}>Detailed Expenditure Breakdown by Head:</h4>
              <table className="doc-summary-table mini">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Expense Category</th>
                    <th style={{ textAlign: 'center' }}>Vouchers</th>
                    <th style={{ textAlign: 'right' }}>Total Spent (₹)</th>
                    <th style={{ textAlign: 'right' }}>% Share</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseCategories.map((c, i) => (
                    <tr key={c.category}>
                      <td>{i + 1}</td>
                      <td>{c.category}</td>
                      <td style={{ textAlign: 'center' }}>{c.count}</td>
                      <td style={{ textAlign: 'right' }}>₹ {c.total.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Official Committee Signatures Section */}
              <div className="official-signatures-grid">
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <b>Sri President (అధ్యక్షులు)</b>
                  <small>Festival Committee 2026</small>
                </div>
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <b>Sri General Secretary (కార్యదర్శి)</b>
                  <small>Festival Committee 2026</small>
                </div>
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <b>Sri Treasurer (కోశాధికారి)</b>
                  <small>Festival Committee 2026</small>
                </div>
              </div>

              <div className="doc-footer-stamp">
                <p>🕉️ Certified authentic report generated by Sri Vinayaka Vedika Portal · Ganapathi Bappa Morya! 🪔</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

