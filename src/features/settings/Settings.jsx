import { useState } from 'react'
import { Card, Form, Button, Modal } from '../../components/ui'
import { ExcelImportModal } from '../../components/ExcelImportModal'
import { SEGMENT_CONFIGS, downloadSampleTemplate, exportTableToExcel } from '../../lib/excelParser'
import { usePasscode } from '../../hooks/usePasscode'
import { today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Settings({ data, add, update, syncAllToCloud, refresh }) {
  const { toast } = useToast()
  const settings = data.settings?.[0] || {}
  const [activeCategory, setActiveCategory] = useState('pandal')
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [excelSegment, setExcelSegment] = useState('donations')

  const openExcelModal = (seg = 'donations') => {
    setExcelSegment(seg)
    setExcelModalOpen(true)
  }

  const saveSettingsSegment = async (values) => {
    try {
      const merged = { ...settings, ...values }
      const err = settings.id
        ? await update('settings', settings.id, merged)
        : await add('settings', merged)
      if (err) {
        toast.error(err.message || 'Failed to save settings.')
      } else {
        toast.success('Customization saved to cloud!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.')
    }
  }

  const pandalFields = [
    { name: 'village_name', label: 'Village / Colony / Pandal Name', default: settings.village_name || 'Vinayaka Vedika 2026', required: true },
    { name: 'tagline', label: 'Festival Tagline / Devotional Slogan', default: settings.tagline || 'Our village celebration, in one place.' },
    { name: 'festival_date', label: 'Festival Start Date (Vinayaka Chavithi)', type: 'date', default: settings.festival_date || today(), required: true },
    { name: 'pandal_address', label: 'Pandal Stage Location / Landmark Address', default: settings.pandal_address || 'Main Village Stage, Near Temple', placeholder: 'e.g. Main Junction Stage' },
    { name: 'maps_url', label: 'Google Maps Directions Link (URL)', default: settings.maps_url || '', placeholder: 'https://maps.google.com/?q=...' },
    { name: 'idol_details', label: 'Idol Specifications / Eco-Details', default: settings.idol_details || '12-Foot Sacred Clay Idol', placeholder: 'e.g. 15 Feet Eco-Friendly Clay Ganesha' }
  ]

  const moneyFields = [
    { name: 'upi_id', label: 'UPI Payment ID (for QR donations)', default: settings.upi_id || '', placeholder: 'e.g. temple@okaxis, 9876543210@upi' },
    { name: 'receipt_org_name', label: 'Official Receipt Header Organization Name', default: settings.receipt_org_name || settings.village_name || 'Sri Vinayaka Utsava Samithi 2026', placeholder: 'e.g. Sri Varasiddhi Vinayaka Utsava Samithi' },
    { name: 'receipt_note', label: 'Receipt Footer Blessing Message', default: settings.receipt_note || 'May Lord Ganesha shower prosperity and happiness on your family.', placeholder: 'Blessing message' }
  ]

  const timingFields = [
    { name: 'morning_aarti_time', label: 'Morning Aarti & Pooja Time', type: 'time', default: settings.morning_aarti_time || '06:30' },
    { name: 'evening_aarti_time', label: 'Evening Bhajan & Maha Harathi Time', type: 'time', default: settings.evening_aarti_time || '19:30' },
    { name: 'daily_schedule_note', label: 'Daily Schedule & Pandal Instructions Notice', type: 'textarea', default: settings.daily_schedule_note || 'Daily Pooja & Maha Harathi every morning & evening. All devotees are cordially invited.', placeholder: 'Rules, timings, annadanam timings...' },
    { name: 'procession_start_location', label: 'Shobha Yatra Starting Point', default: settings.procession_start_location || 'Main Village Pandal Stage', placeholder: 'e.g. Main Pandal Stage' },
    { name: 'immersion_destination', label: 'Nimajjanam (Immersion) Destination Ghat', default: settings.immersion_destination || 'Village Lake Ghat', placeholder: 'e.g. Local River Ghat / Lake' },
    { name: 'procession_route_note', label: 'Live Procession Route Landmarks', default: settings.procession_route_note || 'Main Road → Bus Stand → Bazaar Street → Lake Ghat', placeholder: 'Route stops' }
  ]

  const emergencyFields = [
    { name: 'em_doctor_name', label: 'Emergency Medical Officer / Doctor Name', default: settings.em_doctor_name || '', placeholder: 'Dr. Ramesh' },
    { name: 'em_doctor_phone', label: 'Emergency Doctor Contact Number', type: 'tel', default: settings.em_doctor_phone || '', placeholder: '9876543210' },
    { name: 'em_police_phone', label: 'Local Police Station / Patrol Help Number', type: 'tel', default: settings.em_police_phone || '', placeholder: '100 / 9876543210' },
    { name: 'em_coord_name', label: 'Key Festival Coordinator Name', default: settings.em_coord_name || '', placeholder: 'Suresh Reddy' },
    { name: 'em_coord_phone', label: 'Key Coordinator Mobile Number', type: 'tel', default: settings.em_coord_phone || '', placeholder: '9876543210' }
  ]

  return (
    <>
      <div className="settings-customization-hub">
        <h2 style={{ margin: '0 0 6px', color: '#7c2414', fontSize: '1.45rem', fontWeight: '800' }}>
          ⚙️ Festival Customization Center
        </h2>
        <p className="muted" style={{ margin: '0 0 16px', fontSize: '0.88rem' }}>
          Customize every segment, title, payment mode, pooja schedule, and cloud storage setting across the entire portal.
        </p>

        {/* Customization Category Nav Tabs */}
        <div className="settings-category-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '18px', scrollbarWidth: 'none' }}>
          {[
            { id: 'pandal', label: '🏛️ Pandal & Hero', icon: '🏛️' },
            { id: 'money', label: '💰 Money & UPI', icon: '💰' },
            { id: 'timings', label: '📅 Timings & Route', icon: '📅' },
            { id: 'emergency', label: '🚨 Safety & Contacts', icon: '🚨' },
            { id: 'cloud', label: '📁 Google Drive Cloud', icon: '📁' },
            { id: 'excel', label: '📊 Excel Batch Manager', icon: '📊' },
            { id: 'security', label: '🔒 Passcode & Backup', icon: '🔒' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: activeCategory === cat.id ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                background: activeCategory === cat.id ? 'linear-gradient(135deg, #a82e18 0%, #701c0d 100%)' : '#ffffff',
                color: activeCategory === cat.id ? '#ffffff' : '#334155',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: activeCategory === cat.id ? '0 2px 8px rgba(168, 46, 24, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Category 1: Pandal & Hero Showcase Customizer */}
        {activeCategory === 'pandal' && (
          <Card title="🏛️ Pandal Theme & Hero Showcase Customization">
            <p className="muted">
              Configure village name, festival slogan, countdown start date, idol specs, and GPS map directions.
            </p>
            <Form
              submit="Save Pandal Settings"
              onSubmit={saveSettingsSegment}
              fields={pandalFields}
            />
          </Card>
        )}

        {/* Category 2: Money & UPI Collections Customizer */}
        {activeCategory === 'money' && (
          <Card title="💰 Money, UPI Payments & Receipt Customization">
            <p className="muted">
              Configure your UPI payment QR ID, official receipt header, and donor blessing notes.
            </p>
            <Form
              submit="Save Payment & Receipt Settings"
              onSubmit={saveSettingsSegment}
              fields={moneyFields}
            />
          </Card>
        )}

        {/* Category 3: Pooja Timings & Shobha Yatra Customizer */}
        {activeCategory === 'timings' && (
          <Card title="📅 Pooja Timings, Aarti & Procession Route Customization">
            <p className="muted">
              Update morning/evening aarti hours, daily pandal notices, and immersion procession route stops.
            </p>
            <Form
              submit="Save Timings & Route Settings"
              onSubmit={saveSettingsSegment}
              fields={timingFields}
            />
          </Card>
        )}

        {/* Category 4: Emergency Contacts */}
        {activeCategory === 'emergency' && (
          <Card title="🚨 Emergency Contacts & Public Safety">
            <p className="muted">
              Emergency contacts displayed in the Help tab and shared with committee members.
            </p>
            <Form
              submit="Save Emergency Contacts"
              onSubmit={saveSettingsSegment}
              fields={emergencyFields}
            />
          </Card>
        )}

        {/* Category 5: Google Drive Cloud Database Hub */}
        {activeCategory === 'cloud' && (
          <GoogleDriveSettingsCard
            settings={settings}
            data={data}
            syncAllToCloud={syncAllToCloud}
            refresh={refresh}
          />
        )}

        {/* Category 6: Excel Batch Manager */}
        {activeCategory === 'excel' && (
          <ExcelManagerCard data={data} onOpenImport={openExcelModal} />
        )}

        {/* Category 7: Security & Authorizations */}
        {activeCategory === 'security' && (
          <>
            <AuthorizationManagerCard settings={settings} />
            <PasscodeSettings />
            <BackupButton data={data} />
          </>
        )}
      </div>

      {excelModalOpen && (
        <ExcelImportModal
          isOpen={excelModalOpen}
          onClose={() => setExcelModalOpen(false)}
          initialSegment={excelSegment}
          portalData={data}
          onAddRecord={add}
          onBatchComplete={() => {
            if (toast?.success) toast.success('🎉 Bulk Excel data operation completed!')
          }}
        />
      )}
    </>
  )
}

function GoogleDriveSettingsCard({ settings, data, syncAllToCloud, refresh }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const webhookUrl =
    settings.google_drive_upload_url ||
    'https://script.google.com/macros/s/AKfycbx1uG_Vy7dQDjUbzUHEtvRC8v8bQa7WVQ090PO8RaJo2LeirNa4B4Y9VpZojEyci51G/exec'

  const gasCode = `/**
 * Sri Vinayaka Vedika 2026 - Master Google Drive & Cloud Database Script
 */
var MASTER_DB_FILENAME = 'vinayaka_vedika_cloud_db.json';

function loadDatabase() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('VV_CLOUD_DATABASE');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  try {
    var files = DriveApp.getFilesByName(MASTER_DB_FILENAME);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      if (content) {
        var parsed = JSON.parse(content);
        props.setProperty('VV_CLOUD_DATABASE', JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {}
  return {};
}

function persistDatabase(db) {
  var jsonString = JSON.stringify(db, null, 2);
  try { PropertiesService.getScriptProperties().setProperty('VV_CLOUD_DATABASE', jsonString); } catch (e) {}
  try {
    var files = DriveApp.getFilesByName(MASTER_DB_FILENAME);
    if (files.hasNext()) {
      files.next().setContent(jsonString);
    } else {
      var newFile = DriveApp.createFile(MASTER_DB_FILENAME, jsonString, MimeType.PLAIN_TEXT);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } catch (e) {}
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    return jsonResponse({ success: true, data: loadDatabase() });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return jsonResponse({ error: 'No data' });
    var payload = JSON.parse(e.postData.contents);

    // 1. File / Photo / Video Upload to Google Drive
    if (payload.base64 && payload.filename) {
      var folder = DriveApp.getRootFolder();
      var decoded = Utilities.base64Decode(payload.base64);
      var blob = Utilities.newBlob(decoded, payload.mimeType || 'image/jpeg', payload.filename);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return jsonResponse({
        success: true,
        fileId: file.getId(),
        url: "https://lh3.googleusercontent.com/d/" + file.getId()
      });
    }

    // 2. Database Real-time Sync
    var action = payload.action || 'get_all';
    var table = payload.table;
    var record = payload.record;
    var id = payload.id;
    var db = loadDatabase();

    if (action === 'get_all' || action === 'read') return jsonResponse({ success: true, data: db });

    if (action === 'bulk_sync' && payload.allData) {
      Object.keys(payload.allData).forEach(function(tbl) {
        if (Array.isArray(payload.allData[tbl])) db[tbl] = payload.allData[tbl];
      });
      persistDatabase(db);
      return jsonResponse({ success: true, data: db });
    }

    if (!table) return jsonResponse({ error: 'Table required' });
    if (!db[table]) db[table] = [];

    if (action === 'add' && record) {
      var newRecord = Object.assign({
        id: record.id || ('cloud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
        created_at: record.created_at || new Date().toISOString()
      }, record);
      db[table] = [newRecord].concat(db[table].filter(function(i) { return i.id !== newRecord.id; }));
      persistDatabase(db);
      return jsonResponse({ success: true, record: newRecord, data: db[table] });
    }

    if (action === 'update' && id && record) {
      db[table] = db[table].map(function(i) { return i.id === id ? Object.assign({}, i, record) : i; });
      persistDatabase(db);
      return jsonResponse({ success: true, data: db[table] });
    }

    if (action === 'delete' && id) {
      db[table] = db[table].filter(function(i) { return i.id !== id; });
      persistDatabase(db);
      return jsonResponse({ success: true, data: db[table] });
    }

    return jsonResponse({ error: 'Invalid action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/portal-sync', { method: 'GET' })
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
      const json = await res.json()
      if (json && json.success) {
        setTestResult({
          status: 'success',
          msg: '✅ Real-time Cloud Sync API is live and responding!'
        })
        toast.success('Cloud Database connection verified!')
      } else {
        setTestResult({
          status: 'warn',
          msg: '⚠️ Webhook responded but returned unexpected payload. Ensure the latest Google Apps Script code is deployed.'
        })
      }
    } catch (err) {
      setTestResult({
        status: 'error',
        msg: `❌ Webhook connection error: ${err.message || 'Network error'}`
      })
      toast.error('Failed to reach cloud database.')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncAllToGoogleDrive = async () => {
    setIsSyncing(true)
    try {
      if (syncAllToCloud) {
        const err = await syncAllToCloud(data)
        if (err) throw err
      } else {
        const res = await fetch('/api/portal-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_sync', allData: data })
        })
        if (!res.ok) throw new Error('Cloud push failed.')
      }
      toast.success('🚀 All database records pushed to Google Drive cloud!')
    } catch (err) {
      toast.error(err.message || 'Could not push all records.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📁</span>
          <span>Google Drive Cloud Storage & Real-Time Sync</span>
        </div>
      }
    >
      <p className="muted" style={{ marginBottom: '12px' }}>
        All data entered on any mobile phone, tablet, or laptop is automatically synchronized in real-time and stored directly on your personal <b>Google Drive</b>.
      </p>

      {/* Sync Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <Button
          type="button"
          onClick={handleSyncAllToGoogleDrive}
          disabled={isSyncing}
          style={{ background: '#15803d', borderColor: '#166534' }}
        >
          {isSyncing ? 'Pushing Data…' : '☁️ Push All Local Data to Google Drive'}
        </Button>

        <Button
          type="button"
          kind="secondary"
          onClick={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting ? 'Testing…' : '🔌 Test Cloud Connection'}
        </Button>
      </div>

      {testResult && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '0.88rem',
            fontWeight: '600',
            background: testResult.status === 'success' ? '#dcfce7' : testResult.status === 'warn' ? '#fef3c7' : '#fee2e2',
            color: testResult.status === 'success' ? '#166534' : testResult.status === 'warn' ? '#92400e' : '#991b1b',
            border: `1px solid ${testResult.status === 'success' ? '#86efac' : testResult.status === 'warn' ? '#fde68a' : '#fca5a5'}`
          }}
        >
          {testResult.msg}
        </div>
      )}

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '0.95rem' }}>✨ 3 Easy Steps to Connect Google Drive:</h4>
        <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '0.86rem', lineHeight: '1.6', color: '#475569' }}>
          <li>
            Open <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '700' }}>script.google.com</a> and create a new project.
          </li>
          <li>
            Copy the <b>Master Script Code</b> below and paste it into the code editor.
          </li>
          <li>
            Click <b>Deploy &gt; New deployment &gt; Select type: Web App</b>, set <i>Execute as: Me</i> and <i>Who has access: Anyone</i>, and click <b>Deploy</b>.
          </li>
        </ol>
      </div>

      <details style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
        <summary style={{ fontWeight: '700', color: '#7c2414', cursor: 'pointer', fontSize: '0.88rem' }}>
          📋 Click to view & copy Master Google Apps Script Code
        </summary>
        <div style={{ marginTop: '10px' }}>
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '280px' }}>
            {gasCode}
          </pre>
          <Button type="button" size="small" onClick={handleCopyCode}>
            {copied ? '✓ Code Copied!' : '📋 Copy Master Google Apps Script Code'}
          </Button>
        </div>
      </details>
    </Card>
  )
}

function AuthorizationManagerCard({ settings = {} }) {
  const { toast } = useToast()
  const auth = usePasscode()
  const { authorizedMembers, addAuthorizedMember, removeAuthorizedMember, regenerateMemberPin } = auth

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('Treasurer (కోశాధికారి)')
  const [phone, setPhone] = useState('')
  const [customPin, setCustomPin] = useState('')
  const [visiblePins, setVisiblePins] = useState({})

  const villageName = settings.village_name || 'Sri Vinayaka Vedika 2026'

  const togglePinVisibility = (id) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleOpenAdd = () => {
    setName('')
    setDesignation('Treasurer (కోశాధికారి)')
    setPhone('')
    setCustomPin(Math.floor(100000 + Math.random() * 900000).toString())
    setIsAddModalOpen(true)
  }

  const handleSaveMember = (e) => {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanPhone = phone.replace(/[^0-9]/g, '')

    if (!cleanName) {
      toast.error('Please enter member name.')
      return
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.')
      return
    }

    const created = addAuthorizedMember({
      name: cleanName,
      designation: designation.trim(),
      phone: cleanPhone,
      pin: customPin || undefined
    })

    toast.success(`🎉 Authorized access granted for ${cleanName}!`)
    setIsAddModalOpen(false)
  }

  const handleShareWhatsApp = (member) => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const text = `🕉️ *${villageName.toUpperCase()} — COMMITTEE ACCESS* 🕉️\n` +
      `Namaste *${member.name} Garu*,\n` +
      `You have been granted *Authorized Access* for the festival management portal.\n\n` +
      `📌 *Designation:* ${member.designation}\n` +
      `📱 *Registered Mobile:* ${member.phone}\n` +
      `🔢 *6-Digit Access PIN:* ${member.pin}\n\n` +
      `🌐 *Portal Link:* ${portalUrl}\n\n` +
      `Use your mobile number & PIN to view confidential expense vouchers and full financial statements. 🙏`

    const url = `https://api.whatsapp.com/send?phone=91${member.phone}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleRegenerate = (id, memberName) => {
    const newPin = regenerateMemberPin(id)
    toast.success(`Generated new 6-digit PIN (${newPin}) for ${memberName}.`)
  }

  const handleRevoke = (id, memberName) => {
    if (window.confirm(`Revoke authorized committee access for ${memberName}?`)) {
      removeAuthorizedMember(id)
      toast.info(`Revoked access for ${memberName}.`)
    }
  }

  return (
    <>
      <Card
        title="🔒 Authorized Committee Members & PIN / OTP Manager"
        action={
          <Button onClick={handleOpenAdd}>
            ➕ Add Authorized Member
          </Button>
        }
      >
        <p className="muted">
          As Master Admin, you can assign 6-digit Access PINs / OTPs to specific committee members (e.g. President, Treasurer, General Secretary, Auditor) allowing them to view confidential expense transactions and full donor details.
        </p>

        <div className="authorized-members-list">
          {authorizedMembers.map((member) => {
            const isPinVisible = Boolean(visiblePins[member.id])
            return (
              <div className="auth-member-card" key={member.id}>
                <div className="member-card-main">
                  <div className="member-avatar">🛡️</div>
                  <div className="member-info">
                    <b className="member-name">{member.name}</b>
                    <span className="member-role-badge">{member.designation}</span>
                    <small className="member-phone">📞 {member.phone}</small>
                  </div>
                </div>

                <div className="member-pin-block">
                  <span className="pin-label">6-Digit PIN:</span>
                  <div className="pin-display">
                    <code>{isPinVisible ? member.pin : '••••••'}</code>
                    <button
                      type="button"
                      className="pin-eye-btn"
                      onClick={() => togglePinVisibility(member.id)}
                      title={isPinVisible ? 'Hide PIN' : 'Show PIN'}
                    >
                      {isPinVisible ? '👁️‍🗨️' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="member-actions-row">
                  <button
                    type="button"
                    className="share-pin-wa-btn"
                    onClick={() => handleShareWhatsApp(member)}
                    title="Send Access PIN to member on WhatsApp"
                  >
                    <span className="wa-icon">📲</span>
                    <span>Send on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="regen-pin-btn"
                    onClick={() => handleRegenerate(member.id, member.name)}
                    title="Generate new 6-digit PIN"
                  >
                    🔄 New PIN
                  </button>

                  <button
                    type="button"
                    className="revoke-auth-btn"
                    onClick={() => handleRevoke(member.id, member.name)}
                    title="Revoke access"
                  >
                    🗑️ Revoke
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Add Authorized Member Modal */}
      {isAddModalOpen && (
        <Modal
          title="Add Authorized Committee Member"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveMember} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>👤 Member Full Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                required
                placeholder="e.g. Sri K. Venkateswarlu Garu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>🎖️ Committee Role / Designation</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. Treasurer / Auditor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>📱 10-Digit Mobile Number</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9848012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>🔢 6-Digit Access PIN / OTP</span>
                <span className="req-star">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  style={{ fontWeight: 'bold', letterSpacing: '0.2em' }}
                  inputMode="numeric"
                />
                <Button
                  type="button"
                  kind="secondary"
                  onClick={() => setCustomPin(Math.floor(100000 + Math.random() * 900000).toString())}
                  title="Generate new random 6-digit PIN"
                >
                  🎲 Auto Generate
                </Button>
              </div>
              <small className="muted">This PIN will be used by the member to unlock full financial transactions.</small>
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Grant Authorization
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function PasscodeSettings() {
  const { toast } = useToast()
  const auth = usePasscode()
  const [passcode, setPasscode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSavePasscode = async (e) => {
    e.preventDefault()
    if (!passcode || passcode.trim().length < 6) {
      toast.error('Passcode must be at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      const err = await auth.setPasscode(passcode.trim())
      if (err) throw err
      toast.success('Admin passcode updated successfully!')
      setPasscode('')
    } catch (err) {
      toast.error(err.message || 'Could not update admin passcode.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Change Admin Passcode">
      <p className="muted">
        Change the shared passcode used to unlock committee editing. Must be at least 6 characters.
      </p>
      <form className="form" onSubmit={handleSavePasscode}>
        <label>
          <span>New Admin Passcode</span>
          <div className="password-input-wrap">
            <input
              required
              minLength={6}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new 6+ char passcode"
              value={passcode}
              disabled={busy}
              onChange={(e) => setPasscode(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        </label>

        <div className="form-actions">
          <Button type="submit" disabled={busy || !passcode.trim()}>
            {busy ? 'Updating…' : 'Update Passcode'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ExcelManagerCard({ data = {}, onOpenImport }) {
  const { toast } = useToast()

  const handleQuickDownloadTemplate = async (segId) => {
    try {
      await downloadSampleTemplate(segId, 'xlsx')
      toast.success('Sample Excel template downloaded!')
    } catch {
      toast.error('Failed to download template.')
    }
  }

  const handleQuickExport = async (segId) => {
    const config = SEGMENT_CONFIGS[segId]
    const list = data[config.table] || []
    if (list.length === 0) {
      toast.info(`No records in ${config.label} to export.`)
      return
    }
    try {
      await exportTableToExcel(list, segId, `${config.table}_2026.xlsx`)
      toast.success(`Exported ${list.length} records to ${config.table}_2026.xlsx!`)
    } catch {
      toast.error('Export failed.')
    }
  }

  return (
    <Card title="📊 Excel & CSV Batch Data Manager">
      <p className="muted">
        Upload spreadsheets from MS Excel or Google Sheets to automatically extract and populate donations, expenses, sponsors, volunteers, schedules, and committee members into the database.
      </p>

      <div className="excel-settings-grid">
        {Object.values(SEGMENT_CONFIGS).map((cfg) => {
          const count = (data[cfg.table] || []).length
          return (
            <div className="excel-segment-card" key={cfg.id}>
              <div className="segment-card-title-row">
                <span className="card-icon">{cfg.icon}</span>
                <div>
                  <b className="card-label">{cfg.label}</b>
                  <small className="card-count">{count} records in database</small>
                </div>
              </div>

              <div className="segment-card-actions">
                <Button
                  kind="primary"
                  size="small"
                  onClick={() => onOpenImport(cfg.id)}
                  title={`Upload Excel or CSV file to extract ${cfg.label}`}
                >
                  ⚡ Upload & Extract Excel
                </Button>
                <div className="card-sub-actions">
                  <button
                    type="button"
                    className="sub-action-btn"
                    onClick={() => handleQuickDownloadTemplate(cfg.id)}
                    title="Download ready-to-fill Excel template"
                  >
                    📥 Blank Template
                  </button>
                  <button
                    type="button"
                    className="sub-action-btn"
                    onClick={() => handleQuickExport(cfg.id)}
                    title="Export existing database records to Excel"
                  >
                    📊 Export (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function BackupButton({ data }) {
  const { toast } = useToast()

  const handleDownload = () => {
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exported_at: new Date().toISOString(),
              festival_data: data
            },
            null,
            2
          )
        ],
        { type: 'application/json' }
      )
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `vinayaka-vedika-backup-${today()}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('JSON backup downloaded.')
    } catch {
      toast.error('Failed to create backup.')
    }
  }

  return (
    <Card title="Data Backup & Archival">
      <p className="muted">
        Download a complete, offline JSON copy of all committee records, donations, expenses, auction bids, and schedules for the village archive.
      </p>
      <Button kind="secondary" onClick={handleDownload}>
        📥 Download JSON Backup
      </Button>
    </Card>
  )
}


