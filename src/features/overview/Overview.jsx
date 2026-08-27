import { useMemo, useState } from 'react'
import { Card, Empty, Button, Stat, Modal, ConfirmModal } from '../../components/ui'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { currency, fmtDate, tier, today } from '../../lib/formatters'
import { openWhatsAppMessage } from '../../lib/notifications'
import { askGeminiDirectly } from '../../lib/gemini'
import { useCountdown } from '../../hooks/useCountdown'
import { useToast } from '../../context/ToastContext'
import ganeshIdol2026 from '../../assets/ganesh-idol-2026.jpg'
import ganeshaBg from '../../assets/ganesha-template-bg.jpg'

export function Overview({ data, admin, add, update, remove, onNavigate }) {
  const { toast } = useToast()
  const [noticeToDelete, setNoticeToDelete] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [selectedReceiptDonation, setSelectedReceiptDonation] = useState(null)
  const [selectedNoticeForCard, setSelectedNoticeForCard] = useState(null)
  const [isDarshanModalOpen, setIsDarshanModalOpen] = useState(false)

  // Overview embedded AI Guide state
  const [aiInput, setAiInput] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const settings = data.settings?.[0] || {}
  const donations = data.donations || []
  const expenses = data.expenses || []
  const committeeMembers = data.committee_members || []
  const activities = data.activities || []
  const galleryItems = data.gallery_items || []
  const noticesList = data.notices || []

  // Live countdown hook
  const countdown = useCountdown(settings.festival_date)

  // Date editing state
  const [festivalDateVal, setFestivalDateVal] = useState(settings.festival_date || today())
  const [villageNameVal, setVillageNameVal] = useState(settings.village_name || 'Vinayaka Vedika')
  const [taglineVal, setTaglineVal] = useState(settings.tagline || 'Our village celebration, in one place.')
  const [isSavingDate, setIsSavingDate] = useState(false)

  // Memoized stats
  const raised = useMemo(
    () => donations.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [donations]
  )
  const spent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  )
  const balance = useMemo(() => raised - spent, [raised, spent])

  const isFirstTimeSetup = !settings.festival_date && !settings.village_name && donations.length === 0

  const pinnedDonations = useMemo(
    () => donations.filter((d) => Boolean(d.pinned)),
    [donations]
  )

  const topDonations = useMemo(() => {
    return [...donations]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 3)
  }, [donations])

  const upcoming = useMemo(() => {
    const todayStr = today()
    return activities
      .filter((item) => item.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
  }, [activities])

  const sortedNotices = useMemo(() => {
    return [...noticesList].sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        String(b.date).localeCompare(String(a.date))
    )
  }, [noticesList])

  const getShareableText = () => {
    const villageName = settings.village_name || 'Vinayaka Vedika'
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `🪔 *VINAYAKA CHAVITHI 2026 — ${villageName}* 🪔\n${settings.tagline ? `_${settings.tagline}_\n` : ''}\n💰 *Total Collected:* ${currency.format(raised)}\n💸 *Total Expenses:* ${currency.format(spent)}\n💵 *Balance in Hand:* ${currency.format(balance)}\n\n⏰ *Daily Aarti:* Morning ${settings.morning_aarti_time || '6:30 AM'} · Evening ${settings.evening_aarti_time || '7:30 PM'}${
      upcoming
        ? `\n\n📅 *Next Event:* ${upcoming.title} (${fmtDate(upcoming.date)}${
            upcoming.start_time ? ` at ${upcoming.start_time}` : ''
          })`
        : ''
    }\n\n🌐 *Portal:* ${portalUrl}`
  }

  const shareViaWhatsApp = () => {
    const text = getShareableText()
    openWhatsAppMessage('', text)
    toast.success('WhatsApp opened with shareable festival update!')
  }

  const copyUpdate = async () => {
    const text = getShareableText()
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Shareable festival update copied to clipboard!')
    } catch {
      toast.error('Could not copy to clipboard. Please copy manually.')
    }
  }

  const handleAskOverviewAi = async (e, customQuery) => {
    if (e) e.preventDefault()
    const query = (customQuery || aiInput).trim()
    if (!query) return

    setAiLoading(true)
    setAiAnswer('')
    if (!customQuery) setAiInput('')

    try {
      let answerText = ''
      try {
        const response = await fetch(import.meta.env.VITE_AI_ENDPOINT || '/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: query,
            context: { settings, activities, raised, spent }
          })
        })
        if (response.ok) {
          const body = await response.json()
          answerText = body.answer
        }
      } catch {
        // Fallback to client Gemini
      }

      if (!answerText) {
        const res = await askGeminiDirectly({
          question: query,
          context: { settings, activities, raised, spent }
        })
        answerText = res.answer
      }

      setAiAnswer(answerText)
    } catch {
      setAiAnswer('🙏 You can check the Schedule tab for event timings, or the Money tab for donations & receipts!')
    } finally {
      setAiLoading(false)
    }
  }

  const handleOpenDateModal = () => {
    setFestivalDateVal(settings.festival_date || today())
    setVillageNameVal(settings.village_name || 'Vinayaka Vedika')
    setTaglineVal(settings.tagline || 'Our village celebration, in one place.')
    setDateModalOpen(true)
  }

  const handleSaveFestivalDate = async (e) => {
    e.preventDefault()
    if (!festivalDateVal) {
      toast.error('Please choose a festival date.')
      return
    }

    setIsSavingDate(true)
    try {
      const payload = {
        ...settings,
        festival_date: festivalDateVal,
        village_name: villageNameVal.trim() || 'Vinayaka Vedika',
        tagline: taglineVal.trim() || 'Our village celebration, in one place.'
      }

      const err = settings.id
        ? await update('settings', settings.id, payload)
        : await add('settings', payload)

      if (err) {
        toast.error(err.message || 'Failed to save festival date.')
      } else {
        toast.success(`Festival date set to ${fmtDate(festivalDateVal)}! Countdown is running.`)
        setDateModalOpen(false)
      }
    } catch (err) {
      toast.error(err.message || 'Could not save festival date.')
    } finally {
      setIsSavingDate(false)
    }
  }

  const handleTogglePin = async (d) => {
    const nextPinned = !d.pinned
    const err = await update('donations', d.id, {
      ...d,
      amount: Number(d.amount),
      pinned: nextPinned
    })
    if (err) {
      toast.error(err.message || 'Could not update pin status.')
    } else {
      toast.success(
        nextPinned
          ? `📌 ${d.donor_name} is now pinned to the Overview showcase!`
          : `Unpinned ${d.donor_name} from Overview.`
      )
      if (selectedReceiptDonation?.id === d.id) {
        setSelectedReceiptDonation({ ...d, pinned: nextPinned })
      }
    }
  }

  const handleTogglePinNotice = async (notice) => {
    const nextPinned = !notice.pinned
    const err = await update('notices', notice.id, {
      ...notice,
      pinned: nextPinned
    })
    if (err) {
      toast.error(err.message || 'Could not update notice pin status.')
    } else {
      toast.success(
        nextPinned
          ? '📌 Notice pinned to the top of Overview!'
          : 'Notice unpinned from top.'
      )
    }
  }

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return
    const err = await remove('notices', noticeToDelete.id)
    if (err) {
      toast.error(err.message || 'Failed to remove notice.')
    } else {
      toast.success('Notice removed.')
    }
    setNoticeToDelete(null)
  }

  return (
    <>
      {/* First time setup banner */}
      {isFirstTimeSetup && (
        <div className="first-time-setup-banner">
          <div className="setup-banner-content">
            <span className="setup-icon" aria-hidden="true">🪔</span>
            <div>
              <h3>Welcome to your Vinayaka Vedika Portal!</h3>
              <p>Set your festival date, village name, and committee passcode in Settings to get started.</p>
            </div>
          </div>
          <Button onClick={() => onNavigate ? onNavigate('Settings') : handleOpenDateModal()}>
            ⚙️ Setup Festival
          </Button>
        </div>
      )}

      <section className="hero-2026-showcase">
        <div className="hero-2026-container">
          {/* 2026 Lord Ganesha Idol Portrait */}
          <div className="hero-idol-col">
            <button
              type="button"
              className="hero-idol-card-btn"
              onClick={() => setIsDarshanModalOpen(true)}
              title="Click for full sacred Darshan of 2026 Sri Vinayaka Idol"
            >
              <div className="hero-idol-frame">
                <img
                  src={ganeshIdol2026}
                  alt={`${settings.village_name || 'Vinayaka Vedika'} 2026 Ganesh Idol`}
                  className="hero-idol-img"
                />
                <span className="hero-idol-badge">🪔 2026 OFFICIAL IDOL · CLICK FOR DARSHAN 🔍</span>
              </div>
            </button>
          </div>

          {/* Hero Content & Live Countdown */}
          <div className="hero-content-col">
            <p className="eyebrow">🌿 ॐ శ్రీ గణేశాయ నమః 🌿</p>
            <h1 className="hero-title">{settings.village_name || 'Vinayaka Vedika'}</h1>
            <p className="hero-subtitle">{settings.tagline || 'Our village celebration, in one place.'}</p>

            {/* Live Countdown Display */}
            <div className="hero-countdown-wrapper">
              {countdown.isSet && !countdown.isPast && !countdown.isToday ? (
                <div className="live-countdown-card">
                  <div className="countdown-timer">
                    <div className="timer-unit">
                      <b>{String(countdown.days).padStart(2, '0')}</b>
                      <span>Days</span>
                    </div>
                    <span className="timer-separator">:</span>
                    <div className="timer-unit">
                      <b>{String(countdown.hours).padStart(2, '0')}</b>
                      <span>Hours</span>
                    </div>
                    <span className="timer-separator">:</span>
                    <div className="timer-unit">
                      <b>{String(countdown.minutes).padStart(2, '0')}</b>
                      <span>Mins</span>
                    </div>
                    <span className="timer-separator">:</span>
                    <div className="timer-unit seconds">
                      <b>{String(countdown.seconds).padStart(2, '0')}</b>
                      <span>Secs</span>
                    </div>
                  </div>
                  <div className="countdown-date-info">
                    <small>📅 Festival Date: <b>{fmtDate(settings.festival_date)}</b></small>
                    {(admin || !settings.festival_date) && (
                      <button
                        type="button"
                        className="hero-edit-date-btn"
                        onClick={handleOpenDateModal}
                        title="Change festival date"
                      >
                        ✏️ Change Date
                      </button>
                    )}
                  </div>
                </div>
              ) : countdown.isToday ? (
                <div className="live-countdown-card today">
                  <strong>🎉 Today is the Festival Day! 🙏 Ganapathi Bappa Morya!</strong>
                  {(admin || !settings.festival_date) && (
                    <button
                      type="button"
                      className="hero-edit-date-btn"
                      onClick={handleOpenDateModal}
                    >
                      ✏️ Edit Date
                    </button>
                  )}
                </div>
              ) : countdown.isPast ? (
                <div className="live-countdown-card past">
                  <strong>The celebration has concluded for {fmtDate(settings.festival_date)}</strong>
                  {(admin || !settings.festival_date) && (
                    <button
                      type="button"
                      className="hero-edit-date-btn"
                      onClick={handleOpenDateModal}
                    >
                      ✏️ Set New Date
                    </button>
                  )}
                </div>
              ) : (
                <div className="live-countdown-card unset">
                  <button
                    type="button"
                    className="hero-set-date-btn"
                    onClick={handleOpenDateModal}
                  >
                    📅 Set Festival Date & Start Countdown
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="stats">
        <Stat label="Raised" value={currency.format(raised)} />
        <Stat label="Contributors" value={donations.length} />
        <Stat label="Committee" value={committeeMembers.length} />
        <Stat
          label="Upcoming"
          value={activities.filter((item) => item.date >= today()).length}
        />
        <Stat label="Memories" value={galleryItems.length} />
      </div>

      {/* Featured / Pinned Contributors Showcase */}
      <Card title="🌟 Featured Contributors & Pandal Patrons">
        <p className="muted">
          Special acknowledgment for our generous patrons and dedicated contributors.
        </p>

        {pinnedDonations.length > 0 ? (
          <div className="pinned-donors-grid">
            {pinnedDonations.map((d) => (
              <article className="pinned-donor-card" key={d.id}>
                <div className="pinned-donor-head">
                  <div className="pinned-donor-info">
                    <span className="pinned-star-icon">★</span>
                    <div>
                      <b>{d.donor_name}</b>
                      <span className={`badge ${tier(d.amount).toLowerCase()}`}>
                        {tier(d.amount)}
                      </span>
                    </div>
                  </div>
                  <strong className="pinned-donor-amount">
                    {currency.format(d.amount)}
                  </strong>
                </div>

                {d.note && (
                  <p className="pinned-donor-note">📝 “{d.note}”</p>
                )}

                <div className="pinned-donor-footer">
                  <small>📅 {fmtDate(d.date)}</small>
                  <div className="pinned-donor-actions">
                    <Button
                      type="button"
                      kind="receipt-action"
                      size="small"
                      onClick={() => setSelectedReceiptDonation(d)}
                      title="View, download image, or print festive card"
                    >
                      <span className="action-icon">📜</span>
                      <span>Card / Receipt</span>
                    </Button>

                    <Button
                      type="button"
                      kind="pinned-action"
                      size="small"
                      onClick={() => handleTogglePin(d)}
                      title="Unpin from Overview showcase"
                    >
                      <span>📌 Unpin</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="pinned-empty-box">
            <p style={{ margin: '0 0 12px', color: '#65584a' }}>
              Pin contributors from the <b>Money</b> tab to feature their appreciation card here.
            </p>
            {topDonations.length > 0 && (
              <div className="pinned-donors-grid">
                {topDonations.map((d) => (
                  <article className="pinned-donor-card" key={d.id}>
                    <div className="pinned-donor-head">
                      <div className="pinned-donor-info">
                        <span className="pinned-star-icon">★</span>
                        <div>
                          <b>{d.donor_name}</b>
                          <span className={`badge ${tier(d.amount).toLowerCase()}`}>
                            {tier(d.amount)}
                          </span>
                        </div>
                      </div>
                      <strong className="pinned-donor-amount">
                        {currency.format(d.amount)}
                      </strong>
                    </div>
                    <div className="pinned-donor-footer">
                      <small>📅 {fmtDate(d.date)}</small>
                      <div className="pinned-donor-actions">
                        <Button
                          type="button"
                          kind="receipt-action"
                          size="small"
                          onClick={() => setSelectedReceiptDonation(d)}
                          title="View, download image, or share on WhatsApp"
                        >
                          <span className="action-icon">📜</span>
                          <span>Receipt</span>
                        </Button>
                        <Button
                          type="button"
                          kind="pinned-toggle-btn"
                          size="small"
                          onClick={() => handleTogglePin(d)}
                          title="Pin this contributor to Overview"
                        >
                          <span>📍 Pin</span>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Notices with Pin / Unpin on Overview */}
      {sortedNotices.length > 0 && (
        <Card title="📍 Notices & Announcements">
          <div className="notices-list">
            {sortedNotices.map((notice) => (
              <div className={`notice ${notice.pinned ? 'pinned' : ''}`} key={notice.id}>
                <div className="notice-content">
                  {notice.pinned && <span className="pin-badge">📌 Pinned to Top</span>}
                  <p>{notice.message}</p>
                  <small>{fmtDate(notice.date)}</small>
                </div>
                <div className="notice-admin-actions">
                  <Button
                    type="button"
                    kind="receipt-action"
                    size="small"
                    onClick={() => setSelectedNoticeForCard(notice)}
                    title="View, download image, or share announcement on Ganesha template"
                  >
                    <span className="action-icon">📜</span>
                    <span className="action-label">Notice Card</span>
                  </Button>

                  <Button
                    type="button"
                    kind={notice.pinned ? 'pinned-action' : 'pinned-toggle-btn'}
                    size="small"
                    onClick={() => handleTogglePinNotice(notice)}
                    title={notice.pinned ? 'Unpin this notice from top' : 'Pin this notice to top of Overview'}
                  >
                    <span>{notice.pinned ? '📌 Unpin' : '📍 Pin'}</span>
                  </Button>

                  {admin && (
                    <Button
                      type="button"
                      kind="delete-action"
                      size="small"
                      onClick={() => setNoticeToDelete(notice)}
                      aria-label="Remove notice"
                    >
                      <span className="action-icon" aria-hidden="true">🗑</span>
                      <span className="action-label">Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(settings.morning_aarti_time ||
        settings.evening_aarti_time ||
        settings.daily_schedule_note) && (
        <Card title="Today at the pandal">
          <p className="pandal-timings">
            {settings.morning_aarti_time && (
              <>
                Morning aarti: <b>{settings.morning_aarti_time}</b> ·{' '}
              </>
            )}
            {settings.evening_aarti_time && (
              <>
                Evening aarti: <b>{settings.evening_aarti_time}</b>
              </>
            )}
            {settings.daily_schedule_note && (
              <>
                <br />
                {settings.daily_schedule_note}
              </>
            )}
          </p>
        </Card>
      )}

      <div className="two">
        <Card title="This season">
          <div className="balance">
            <span>
              Collected <b>{currency.format(raised)}</b>
            </span>
            <span>
              Balance <b>{currency.format(balance)}</b>
            </span>
          </div>
          {upcoming ? (
            <div className="next-event">
              <p>
                Next up: <b>{upcoming.title}</b>
                <br />
                <small>
                  {fmtDate(upcoming.date)}{' '}
                  {upcoming.start_time ? `at ${upcoming.start_time}` : ''}
                </small>
              </p>
            </div>
          ) : (
            <Empty>Add an activity to show the next event here.</Empty>
          )}
        </Card>

        <Card title="📢 Share with the village">
          <p className="muted">
            Share or copy the live festival update (collections, aarti timings & next events) directly to WhatsApp or SMS.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <Button
              type="button"
              kind="whatsapp-action"
              onClick={shareViaWhatsApp}
              title="Share formatted festival update directly on WhatsApp"
            >
              <span>💬 WhatsApp Update</span>
            </Button>
            <Button
              type="button"
              kind="secondary"
              onClick={copyUpdate}
              title="Copy formatted update to clipboard"
            >
              <span>📋 Copy Text</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Have a Question / AI Guidance Box */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <span>🤖 Have a Question? (AI Guide)</span>
            <span style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid #bae6fd' }}>
              ✨ Google AI (Gemini)
            </span>
          </div>
        }
      >
        <p className="muted">
          Ask about {settings.village_name || 'Vinayaka Vedika'} aarti timings, prasad schedule, donation totals, or pooja programs:
        </p>

        <form className="ask-form" onSubmit={handleAskOverviewAi} style={{ marginTop: '10px' }}>
          <div className="ask-input-row" style={{ display: 'flex', gap: '8px' }}>
            <input
              value={aiInput}
              disabled={aiLoading}
              placeholder="e.g. What time is evening aarti?"
              onChange={(e) => setAiInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" disabled={aiLoading || !aiInput.trim()}>
              {aiLoading ? 'Thinking…' : 'Ask'}
            </Button>
          </div>
        </form>

        {/* Quick chips */}
        <div className="sample-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
          <button
            type="button"
            className="sample-pill-btn"
            disabled={aiLoading}
            onClick={() => handleAskOverviewAi(null, 'What time is morning and evening aarti?')}
          >
            ⏰ Aarti Timings
          </button>
          <button
            type="button"
            className="sample-pill-btn"
            disabled={aiLoading}
            onClick={() => handleAskOverviewAi(null, 'What activities and poojas are scheduled today?')}
          >
            📅 Today's Poojas
          </button>
          <button
            type="button"
            className="sample-pill-btn"
            disabled={aiLoading}
            onClick={() => handleAskOverviewAi(null, 'How much money has been collected and what is the balance?')}
          >
            💰 Total Raised
          </button>
          <button
            type="button"
            className="sample-pill-btn"
            disabled={aiLoading}
            onClick={() => handleAskOverviewAi(null, 'Who are the emergency doctor and police contacts?')}
          >
            🚨 Emergency Contacts
          </button>
        </div>

        {aiLoading && (
          <div style={{ marginTop: '10px', color: '#854d0e', fontSize: '0.86rem' }}>
            <span className="loading-spinner">🪔</span> Consulting Google Gemini & festival records…
          </div>
        )}

        {aiAnswer && (
          <div className="overview-ai-bubble" style={{ marginTop: '12px', background: '#fdf8f0', border: '1.5px solid #d7952f', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7c2414', marginBottom: '4px' }}>
              🪔 Vedika Assistant (Google AI):
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#25211d', lineHeight: '1.45' }}>{aiAnswer}</p>
          </div>
        )}

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button
            type="button"
            className="link-btn"
            onClick={() => onNavigate ? onNavigate('Help') : null}
            style={{ fontSize: '0.82rem', fontWeight: '600', color: '#7c2414', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
          >
            Open Full AI Guide Chat →
          </button>
        </div>
      </Card>

      {/* Emergency Contacts - Only rendered when real phone numbers exist */}
      {(settings.em_doctor_phone ||
        settings.em_police_phone ||
        settings.em_coord_phone) && (
        <Card title="Emergency contacts">
          <div className="contacts">
            {settings.em_doctor_phone && (
              <a href={`tel:${settings.em_doctor_phone}`} className="contact-card">
                👨‍⚕️ {settings.em_doctor_name || 'Doctor'}
                <b>{settings.em_doctor_phone}</b>
              </a>
            )}
            {settings.em_police_phone && (
              <a href={`tel:${settings.em_police_phone}`} className="contact-card">
                🚓 Police
                <b>{settings.em_police_phone}</b>
              </a>
            )}
            {settings.em_coord_phone && (
              <a href={`tel:${settings.em_coord_phone}`} className="contact-card">
                🙏 {settings.em_coord_name || 'Coordinator'}
                <b>{settings.em_coord_phone}</b>
              </a>
            )}
          </div>
        </Card>
      )}

      <Card title="Recent memories">
        {galleryItems.length > 0 ? (
          <div className="gallery compact">
            {galleryItems.slice(0, 4).map((item) => (
              <button
                type="button"
                className="gallery-item"
                key={item.id}
                onClick={() => setSelectedMedia(item)}
              >
                {item.type === 'photo' ? (
                  <img
                    src={item.url}
                    alt={item.caption || 'Festival memory'}
                    loading="lazy"
                  />
                ) : (
                  <div className="video-thumb">
                    ▶<small>{item.caption || 'Video / album'}</small>
                  </div>
                )}
                <span>{item.caption || 'Memory'}</span>
              </button>
            ))}
          </div>
        ) : (
          <Empty>Photos and memories from the celebration will appear here.</Empty>
        )}
      </Card>

      {/* Lightbox for recent memories preview */}
      {selectedMedia && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setSelectedMedia(null)}
            aria-label="Close media preview"
          >
            ✕
          </button>
          <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'photo' ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption || 'Festival memory'}
              />
            ) : (
              <iframe
                title="Video preview"
                src={`https://www.youtube-nocookie.com/embed/${
                  selectedMedia.url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1] || ''
                }`}
                allowFullScreen
              />
            )}
            {selectedMedia.caption && (
              <p className="lightbox-caption">{selectedMedia.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Set/Edit Festival Date Modal */}
      <Modal
        isOpen={dateModalOpen}
        onClose={() => !isSavingDate && setDateModalOpen(false)}
        title="Set Festival Date & Details"
        maxWidth="480px"
      >
        <p className="modal-description">
          Set the date of Vinayaka Chavithi to start the live countdown on the Overview page.
        </p>

        <form className="form" onSubmit={handleSaveFestivalDate}>
          <label style={{ gridColumn: 'span 2' }}>
            <span>Festival Date (Vinayaka Chavithi) <span className="req-star">*</span></span>
            <input
              type="date"
              required
              value={festivalDateVal}
              disabled={isSavingDate}
              onChange={(e) => setFestivalDateVal(e.target.value)}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span>Village / Colony Name</span>
            <input
              type="text"
              required
              placeholder="e.g. Vinayaka Vedika, Rampur"
              value={villageNameVal}
              disabled={isSavingDate}
              onChange={(e) => setVillageNameVal(e.target.value)}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span>Tagline</span>
            <input
              type="text"
              placeholder="e.g. Our village celebration, in one place."
              value={taglineVal}
              disabled={isSavingDate}
              onChange={(e) => setTaglineVal(e.target.value)}
            />
          </label>

          <div className="modal-actions">
            <Button
              type="button"
              kind="secondary"
              disabled={isSavingDate}
              onClick={() => setDateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingDate || !festivalDateVal}>
              {isSavingDate ? 'Saving…' : 'Save & Start Countdown'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Festive Receipt & Appreciation Template Modal */}
      {selectedReceiptDonation && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedReceiptDonation)}
          onClose={() => setSelectedReceiptDonation(null)}
          donation={selectedReceiptDonation}
          settings={settings}
          admin={admin}
          onTogglePin={() => handleTogglePin(selectedReceiptDonation)}
        />
      )}

      {/* Festive Notice Announcement Template Modal */}
      {selectedNoticeForCard && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedNoticeForCard)}
          onClose={() => setSelectedNoticeForCard(null)}
          notice={selectedNoticeForCard}
          type="notice"
          settings={settings}
          admin={admin}
        />
      )}

      {/* Sacred 2026 Ganesh Idol Full-Screen Darshan Modal */}
      {isDarshanModalOpen && (
        <Modal
          isOpen={isDarshanModalOpen}
          onClose={() => setIsDarshanModalOpen(false)}
          title={`🪔 ${settings.village_name || 'Vinayaka Vedika'} — 2026 Sri Vinayaka Idol`}
          maxWidth="560px"
        >
          <div style={{ textAlign: 'center', background: '#190504', padding: '16px', borderRadius: '12px', border: '2px solid #d7952f' }}>
            <img
              src={ganeshIdol2026}
              alt="2026 Ganesh Idol"
              style={{ width: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
            />
            <div style={{ marginTop: '14px', color: '#ffe0a0' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#fff' }}>
                🌿 ॐ గం గణపతయే నమః 🌿
              </h3>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#fed7aa' }}>
                Official Lord Ganesha Idol for Vinayaka Chavithi 2026 · Ganapathi Bappa Morya! 🙏
              </p>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={Boolean(noticeToDelete)}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={handleDeleteNotice}
        title="Remove Notice"
        message="Are you sure you want to remove this notice? It will no longer be visible to villagers."
        confirmText="Remove"
      />
    </>
  )
}
