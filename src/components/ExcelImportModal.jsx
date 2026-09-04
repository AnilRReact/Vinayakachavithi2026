import { useState, useRef, useMemo } from 'react'
import { Modal, Button } from './ui'
import {
  SEGMENT_CONFIGS,
  parseUploadedFile,
  autoMapColumns,
  extractAndValidateRows,
  downloadSampleTemplate,
  exportTableToExcel
} from '../lib/excelParser'
import { currency, fmtDate } from '../lib/formatters'
import { useToast } from '../context/ToastContext'

export function ExcelImportModal({
  isOpen,
  onClose,
  initialSegment = 'donations',
  portalData = {},
  onAddRecord,
  onBatchComplete
}) {
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [segment, setSegment] = useState(initialSegment)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedHeaders, setParsedHeaders] = useState([])
  const [rawRows, setRawRows] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [currentStep, setCurrentStep] = useState(1) // 1: Upload, 2: Map, 3: Preview, 4: Importing
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)

  const activeConfig = SEGMENT_CONFIGS[segment] || SEGMENT_CONFIGS.donations

  // Compute extraction & validation from current rawRows + mapping
  const extractionResult = useMemo(() => {
    if (!rawRows || rawRows.length === 0) {
      return { validRecords: [], invalidRecords: [], totalAmountSum: 0, totalCount: 0, validCount: 0, invalidCount: 0 }
    }
    return extractAndValidateRows(rawRows, columnMapping, segment)
  }, [rawRows, columnMapping, segment])

  const handleSegmentChange = (newSeg) => {
    setSegment(newSeg)
    if (parsedHeaders.length > 0) {
      const autoMap = autoMapColumns(parsedHeaders, newSeg)
      setColumnMapping(autoMap)
    }
  }

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileName(selectedFile.name)
    setIsParsing(true)

    try {
      const result = await parseUploadedFile(selectedFile)
      if (!result.headers || result.headers.length === 0 || !result.rows || result.rows.length === 0) {
        throw new Error('No readable data rows found in the selected file. Please check file formatting.')
      }

      setParsedHeaders(result.headers)
      setRawRows(result.rows)

      const autoMap = autoMapColumns(result.headers, segment)
      setColumnMapping(autoMap)
      setCurrentStep(2) // Move to column mapping step
      if (toast?.info) toast.info(`Extracted ${result.rows.length} rows from "${selectedFile.name}"`)
    } catch (err) {
      if (toast?.error) toast.error(err.message || 'Failed to parse Excel file.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleMappingChange = (targetField, sourceCol) => {
    setColumnMapping((prev) => ({
      ...prev,
      [targetField]: sourceCol
    }))
  }

  const handleDownloadSample = async (format = 'xlsx') => {
    try {
      await downloadSampleTemplate(segment, format)
      if (toast?.success) toast.success(`Sample ${format.toUpperCase()} template downloaded!`)
    } catch {
      if (toast?.error) toast.error('Failed to generate template.')
    }
  }

  const handleExportExistingData = async () => {
    const targetTable = activeConfig.table
    const existingList = portalData[targetTable] || []
    if (existingList.length === 0) {
      if (toast?.info) toast.info(`No existing ${activeConfig.label} records found to export.`)
      return
    }

    try {
      await exportTableToExcel(existingList, segment, `${targetTable}_2026_Export.xlsx`)
      if (toast?.success) toast.success(`Exported ${existingList.length} records to Excel!`)
    } catch {
      if (toast?.error) toast.error('Export failed.')
    }
  }

  const handleExecuteBatchImport = async () => {
    const { validRecords } = extractionResult
    if (!validRecords || validRecords.length === 0) {
      if (toast?.error) toast.error('No valid records to import. Please map required fields.')
      return
    }

    setIsImporting(true)
    setCurrentStep(4)
    setImportProgress(0)
    let successCount = 0
    let failCount = 0

    const targetTable = activeConfig.table

    for (let i = 0; i < validRecords.length; i++) {
      const rec = validRecords[i]
      // Strip internal validation keys
      const { _rowIndex, _isValid, _errors, _raw, ...payload } = rec

      try {
        setImportStatus(`Importing ${i + 1} of ${validRecords.length}: ${payload.donor_name || payload.item || payload.sponsor_name || payload.title || payload.name || 'Record'}...`)
        if (onAddRecord) {
          await onAddRecord(targetTable, payload)
          successCount++
        }
      } catch (err) {
        console.warn('Row import failed:', rec, err)
        failCount++
      }

      setImportProgress(Math.round(((i + 1) / validRecords.length) * 100))
    }

    setIsImporting(false)
    if (toast?.success) {
      toast.success(`🎉 Successfully imported ${successCount} ${activeConfig.label} records!`)
    }

    if (onBatchComplete) {
      onBatchComplete({ table: targetTable, successCount, failCount, totalAmount: extractionResult.totalAmountSum })
    }

    // Reset and close
    setTimeout(() => {
      onClose()
      resetState()
    }, 1200)
  }

  const resetState = () => {
    setFile(null)
    setFileName('')
    setParsedHeaders([])
    setRawRows([])
    setColumnMapping({})
    setCurrentStep(1)
    setImportProgress(0)
    setImportStatus('')
    setIsImporting(false)
  }

  const handleClose = () => {
    if (isImporting) return
    onClose()
    resetState()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📊 Bulk Excel & CSV Data Import / Export"
      maxWidth="860px"
    >
      <div className="excel-import-modal-wrap">
        {/* Step Indicator Bar */}
        <div className="excel-wizard-steps">
          <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span className="step-num">{currentStep > 1 ? '✓' : '1'}</span>
            <span className="step-text">1. Choose Segment & Upload</span>
          </div>
          <div className="step-line"></div>
          <div className={`wizard-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span className="step-num">{currentStep > 2 ? '✓' : '2'}</span>
            <span className="step-text">2. Map Columns</span>
          </div>
          <div className="step-line"></div>
          <div className={`wizard-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <span className="step-num">{currentStep > 3 ? '✓' : '3'}</span>
            <span className="step-text">3. Preview & Validate</span>
          </div>
        </div>

        {/* STEP 1: SEGMENT PICKER & FILE UPLOAD */}
        {currentStep === 1 && (
          <div className="excel-step-content step-1">
            <div className="segment-picker-section">
              <label className="section-label">Select Target Category to Import / Extract:</label>
              <div className="segment-pills-grid">
                {Object.values(SEGMENT_CONFIGS).map((cfg) => (
                  <button
                    key={cfg.id}
                    type="button"
                    className={`segment-pill-btn ${segment === cfg.id ? 'active' : ''}`}
                    onClick={() => handleSegmentChange(cfg.id)}
                  >
                    <span className="pill-icon">{cfg.icon}</span>
                    <span className="pill-name">{cfg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Download & Export existing toolstrip */}
            <div className="excel-template-toolstrip">
              <div className="toolstrip-item">
                <span className="toolstrip-label">📥 Need a blank template?</span>
                <div className="toolstrip-buttons">
                  <button
                    type="button"
                    className="template-download-btn xlsx"
                    onClick={() => handleDownloadSample('xlsx')}
                    title="Download ready-to-fill Excel template with sample rows"
                  >
                    <span>📗 Sample Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    className="template-download-btn csv"
                    onClick={() => handleDownloadSample('csv')}
                    title="Download ready-to-fill CSV template"
                  >
                    <span>📄 Sample CSV</span>
                  </button>
                </div>
              </div>

              <div className="toolstrip-item">
                <span className="toolstrip-label">📤 Export existing {activeConfig.label}:</span>
                <button
                  type="button"
                  className="template-download-btn export"
                  onClick={handleExportExistingData}
                >
                  <span>📊 Export Table (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div
              className="excel-upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const droppedFile = e.dataTransfer.files?.[0]
                if (droppedFile) {
                  const fakeEvent = { target: { files: [droppedFile] } }
                  handleFileSelect(fakeEvent)
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <div className="dropzone-icon">📁</div>
              <h3 className="dropzone-title">Click to Browse or Drag & Drop Excel / CSV</h3>
              <p className="dropzone-subtitle">
                Supports Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) and Comma-Separated Values (<code>.csv</code>)
              </p>
              <div className="dropzone-badge">
                <span>⚡ Auto-detects columns, amounts, dates & phone numbers</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {currentStep === 2 && (
          <div className="excel-step-content step-2">
            <div className="mapping-header">
              <div className="file-info-badge">
                <span>📄 File: <b>{fileName}</b></span>
                <span>({rawRows.length} rows detected)</span>
              </div>
              <p className="mapping-instructions">
                Match each database field with the corresponding column header from your uploaded Excel sheet:
              </p>
            </div>

            <div className="mapping-fields-grid">
              {activeConfig.fields.map((field) => {
                const currentMappedCol = columnMapping[field.name] || ''
                const isMapped = Boolean(currentMappedCol)
                const isReq = field.required

                return (
                  <div key={field.name} className={`mapping-field-card ${isMapped ? 'mapped' : isReq ? 'unmapped-req' : ''}`}>
                    <div className="field-card-header">
                      <span className="field-name">
                        {field.label}
                        {isReq && <span className="req-star"> *</span>}
                      </span>
                      <span className={`status-badge ${isMapped ? 'ok' : isReq ? 'warning' : 'optional'}`}>
                        {isMapped ? '✓ Matched' : isReq ? '⚠ Required' : 'Optional'}
                      </span>
                    </div>

                    <div className="field-card-select-wrap">
                      <label className="select-sublabel">Excel Column:</label>
                      <select
                        value={currentMappedCol}
                        onChange={(e) => handleMappingChange(field.name, e.target.value)}
                        className="mapping-select"
                      >
                        <option value="">-- Do Not Import / Not in Excel --</option>
                        {parsedHeaders.map((hdr) => (
                          <option key={hdr} value={hdr}>
                            Column: &ldquo;{hdr}&rdquo;
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="step-actions-bar">
              <Button kind="secondary" onClick={() => setCurrentStep(1)}>
                ← Back to Upload
              </Button>
              <Button
                kind="primary"
                onClick={() => {
                  const { validCount } = extractionResult
                  if (validCount === 0) {
                    if (toast?.error) toast.error('Please map the required fields to continue.')
                    return
                  }
                  setCurrentStep(3)
                }}
              >
                Continue to Preview & Validate ({extractionResult.validCount} valid) →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: DATA PREVIEW & VALIDATION */}
        {currentStep === 3 && (
          <div className="excel-step-content step-3">
            {/* Validation Metrics Banner */}
            <div className="extraction-metrics-bar">
              <div className="metric-box total">
                <span className="metric-val">{extractionResult.totalCount}</span>
                <span className="metric-lbl">Total Rows</span>
              </div>
              <div className="metric-box valid">
                <span className="metric-val">{extractionResult.validCount}</span>
                <span className="metric-lbl">Ready to Import</span>
              </div>
              {segment === 'donations' || segment === 'expenses' || segment === 'prasad_sponsors' ? (
                <div className="metric-box amount">
                  <span className="metric-val">{currency.format(extractionResult.totalAmountSum)}</span>
                  <span className="metric-lbl">Calculated Sum</span>
                </div>
              ) : null}
              {extractionResult.invalidCount > 0 && (
                <div className="metric-box warning">
                  <span className="metric-val">{extractionResult.invalidCount}</span>
                  <span className="metric-lbl">Incomplete / Skipped</span>
                </div>
              )}
            </div>

            {/* Extracted Records Table Preview */}
            <div className="preview-table-container">
              <table className="preview-data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    {activeConfig.fields.map((f) => (
                      <th key={f.name}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extractionResult.validRecords
                    .slice((previewPage - 1) * 8, previewPage * 8)
                    .map((row, idx) => (
                      <tr key={idx} className="valid-row">
                        <td className="row-idx">{(previewPage - 1) * 8 + idx + 1}</td>
                        <td>
                          <span className="row-status-badge ok">✓ Ready</span>
                        </td>
                        {activeConfig.fields.map((f) => (
                          <td key={f.name}>
                            {f.type === 'number'
                              ? currency.format(row[f.name] || 0)
                              : f.type === 'date'
                              ? fmtDate(row[f.name])
                              : String(row[f.name] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {extractionResult.validRecords.length > 8 && (
              <div className="preview-pagination">
                <button
                  type="button"
                  className="page-btn"
                  disabled={previewPage <= 1}
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                >
                  ◀ Previous
                </button>
                <span className="page-info">
                  Page {previewPage} of {Math.ceil(extractionResult.validRecords.length / 8)}
                </span>
                <button
                  type="button"
                  className="page-btn"
                  disabled={previewPage >= Math.ceil(extractionResult.validRecords.length / 8)}
                  onClick={() => setPreviewPage((p) => p + 1)}
                >
                  Next ▶
                </button>
              </div>
            )}

            <div className="step-actions-bar">
              <Button kind="secondary" onClick={() => setCurrentStep(2)}>
                ← Back to Mapping
              </Button>
              <Button
                kind="primary"
                onClick={handleExecuteBatchImport}
                disabled={extractionResult.validCount === 0 || isImporting}
              >
                🚀 Import {extractionResult.validCount} Records to Database
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORTING PROGRESS OVERLAY */}
        {currentStep === 4 && (
          <div className="excel-step-content step-4">
            <div className="importing-progress-box">
              <div className="import-spinner">⚡</div>
              <h3 className="progress-title">Importing Records to Database…</h3>
              <p className="progress-status-text">{importStatus}</p>

              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <span className="progress-percent">{importProgress}% Completed</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
