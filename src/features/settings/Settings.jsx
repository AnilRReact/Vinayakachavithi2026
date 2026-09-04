import { useState } from 'react'
import { Card, Form, Button } from '../../components/ui'
import { ExcelImportModal } from '../../components/ExcelImportModal'
import { SEGMENT_CONFIGS, downloadSampleTemplate, exportTableToExcel } from '../../lib/excelParser'
import { requireSupabase } from '../../lib/supabase'
import { today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Settings({ data, add, update }) {
  const { toast } = useToast()
  const settings = data.settings?.[0] || {}
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [excelSegment, setExcelSegment] = useState('donations')

  const openExcelModal = (seg = 'donations') => {
    setExcelSegment(seg)
    setExcelModalOpen(true)
  }

  const saveFestivalSettings = async (values) => {
    try {
      const err = settings.id
        ? await update('settings', settings.id, values)
        : await add('settings', values)
      if (err) {
        toast.error(err.message || 'Failed to save settings.')
      } else {
        toast.success('Festival settings updated.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.')
    }
  }

  const settingsFields = [
    { name: 'village_name', label: 'Village / Colony Name', default: settings.village_name || 'Vinayaka Vedika', required: true },
    { name: 'tagline', label: 'Festival Tagline', default: settings.tagline || 'Our village celebration, in one place.' },
    { name: 'festival_date', label: 'Festival Date (Vinayaka Chavithi)', type: 'date', default: settings.festival_date || today() },
    { name: 'upi_id', label: 'UPI Payment ID (for QR donations)', default: settings.upi_id || '' },
    { name: 'morning_aarti_time', label: 'Morning Aarti Time', type: 'time', default: settings.morning_aarti_time || '' },
    { name: 'evening_aarti_time', label: 'Evening Aarti Time', type: 'time', default: settings.evening_aarti_time || '' },
    { name: 'daily_schedule_note', label: 'Daily Schedule Note / Special Rules', default: settings.daily_schedule_note || '' },
    { name: 'google_drive_folder_url', label: 'Google Drive Shared Photos Folder Link', default: settings.google_drive_folder_url || '' },
    { name: 'google_drive_upload_url', label: 'Google Apps Script Upload Webhook URL (Optional for direct Drive uploads)', default: settings.google_drive_upload_url || '' },
    { name: 'em_doctor_name', label: 'Emergency Doctor Name', default: settings.em_doctor_name || '' },
    { name: 'em_doctor_phone', label: 'Emergency Doctor Phone', type: 'tel', default: settings.em_doctor_phone || '' },
    { name: 'em_police_phone', label: 'Police Station / Patrol Phone', type: 'tel', default: settings.em_police_phone || '' },
    { name: 'em_coord_name', label: 'Key Coordinator Name', default: settings.em_coord_name || '' },
    { name: 'em_coord_phone', label: 'Key Coordinator Phone', type: 'tel', default: settings.em_coord_phone || '' }
  ]

  return (
    <>
      <Card title="Committee & Festival Settings">
        <p className="muted">
          Update village name, aarti timings, UPI payment details, Google Drive storage, and emergency contacts.
        </p>
        <Form
          submit="Save Festival Settings"
          onSubmit={saveFestivalSettings}
          fields={settingsFields}
        />
      </Card>

      <ExcelManagerCard data={data} onOpenImport={openExcelModal} />
      <GoogleDriveSettingsCard settings={settings} />
      <PasscodeSettings />
      <BackupButton data={data} />

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

function GoogleDriveSettingsCard({ settings }) {
  const [copied, setCopied] = useState(false)

  const gasCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folder = DriveApp.getRootFolder(); // Or DriveApp.getFolderById("YOUR_FOLDER_ID");
    var decoded = Utilities.base64Decode(data.base64);
    var blob = Utilities.newBlob(decoded, data.mimeType || 'image/jpeg', data.filename || 'ganesh-photo.jpg');
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      url: "https://lh3.googleusercontent.com/d/" + file.getId()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📁</span>
          <span>Google Drive Cloud Storage (15 GB Free)</span>
        </div>
      }
    >
      <p className="muted" style={{ marginBottom: '12px' }}>
        Store infinite festival photos, videos, and albums directly on your personal or committee Google Drive account.
      </p>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '0.95rem' }}>✨ 2 Easy Ways to Use Google Drive:</h4>
        <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '0.86rem', lineHeight: '1.6', color: '#475569' }}>
          <li>
            <b>Direct Link Paste (No setup needed)</b>: Create a Google Drive folder or upload photos to Drive. Copy the share link (e.g. <code>https://drive.google.com/file/d/...</code>) and paste it into the <b>Memories</b> tab. It will instantly render and stream via Google CDN!
          </li>
          <li>
            <b>Automated In-App Upload Webhook (1-minute setup)</b>: Deploy a free Google Apps Script web app so when anyone uploads a photo in the portal, it saves directly into your Google Drive folder!
          </li>
        </ol>
      </div>

      <details style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
        <summary style={{ fontWeight: '700', color: '#7c2414', cursor: 'pointer', fontSize: '0.88rem' }}>
          📋 Click to view 1-Minute Google Apps Script Code
        </summary>
        <div style={{ marginTop: '10px' }}>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 8px' }}>
            1. Open <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>script.google.com</a> and click <b>New project</b>.<br />
            2. Paste the code below, then click <b>Deploy &gt; New deployment &gt; Select type: Web App</b>.<br />
            3. Set <i>Execute as: Me</i> and <i>Who has access: Anyone</i>, then copy the Web App URL into the setting above.
          </p>
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', overflowX: 'auto' }}>
            {gasCode}
          </pre>
          <Button type="button" size="small" onClick={handleCopyCode}>
            {copied ? '✓ Code Copied!' : '📋 Copy Google Apps Script Code'}
          </Button>
        </div>
      </details>
    </Card>
  )
}

function PasscodeSettings() {
  const { toast } = useToast()
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
      const client = requireSupabase()
      const { error } = await client.rpc('set_admin_passcode', {
        new_passcode: passcode.trim()
      })
      if (error) throw error
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


