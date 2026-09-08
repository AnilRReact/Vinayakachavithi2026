import React, { useState, useMemo } from 'react'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { currency, fmtDate, today } from '../../lib/formatters'
import { syncNewExpense } from '../../lib/googleSheetsSync'
import { useToast } from '../../context/ToastContext'

const EXPENSE_CATEGORIES = [
  'Pandal & Stage Decoration',
  'Sound System & Lighting',
  'Priest Dakshina & Pooja Items',
  'Prasadam & Cooking Grocery',
  'Nimajjanam & Procession Vehicle',
  'Flowers & Garlands',
  'Fireworks & Crackers',
  'Cleaning & Sanitation',
  'Flex & Banner Printing',
  'General & Miscellaneous'
]

export function ExpensesSection({
  expenses = [],
  admin = false,
  authorized = false,
  onOpenLogin,
  add,
  update,
  remove,
  onOpenExcelImport
}) {
  const { toast } = useToast()
  const [expenseSearch, setExpenseSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Form states - All initialized to empty string (no hardcoded/forced defaults)
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [paidTo, setPaidTo] = useState('')
  const [date, setDate] = useState(today())
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isUnlocked = admin || authorized

  // Group expenses by category
  const categories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category || 'General'))
    return ['ALL', ...Array.from(set)]
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        (e.category || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.paid_by || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.paid_to || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.note || '').toLowerCase().includes(expenseSearch.toLowerCase())
      if (!matchSearch) return false
      if (selectedCategory !== 'ALL' && (e.category || 'General') !== selectedCategory) return false
      return true
    })
  }, [expenses, expenseSearch, selectedCategory])

  const totalSpent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  )

  const handleOpenAdd = () => {
    setCategory('')
    setAmount('')
    setPaidBy('')
    setPaidTo('')
    setDate(today())
    setPaymentMode('Cash')
    setNote('')
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanCat = (category || '').trim()
    const numAmount = Number(amount)
    const cleanPaidBy = (paidBy || '').trim()
    const cleanPaidTo = (paidTo || '').trim()

    if (!cleanCat || !numAmount || numAmount <= 0) {
      toast.error('Please enter expense category and valid amount.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        category: cleanCat,
        amount: numAmount,
        paid_by: cleanPaidBy,
        paid_to: cleanPaidTo,
        date: date || today(),
        payment_mode: paymentMode,
        note: (note || '').trim()
      }

      const err = await add('expenses', payload)
      if (err) throw err

      toast.success(`Recorded expense of ₹${numAmount.toLocaleString()} for ${cleanCat}`)
      syncNewExpense(payload)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not record expense.')
    } finally {
      setIsSaving(false)
    }
  }

  const expenseFields = [
    { name: 'category', label: 'Expense Category', required: true, placeholder: 'e.g. Tent & Lighting, Flowers, Prasadam, Sound' },
    { name: 'amount', label: 'Amount Spent (₹)', type: 'number', min: '1', required: true, placeholder: '5000' },
    { name: 'paid_by', label: 'Paid By / Spent By (Optional)', placeholder: 'Who paid this expense' },
    { name: 'paid_to', label: 'Paid To (Vendor / Shop / Receiver - Optional)', placeholder: 'Vendor or shop name' },
    { name: 'date', label: 'Payment Date', type: 'date', default: today(), required: true },
    { name: 'payment_mode', label: 'Payment Method', type: 'select', options: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Bank Transfer'], default: 'Cash' },
    { name: 'note', label: 'Bill / Voucher / Notes', placeholder: 'Optional bill or receipt notes' }
  ]

  // If Lock Mode (Guest Devotee View) -> Display Confidential Lock Guard
  if (!isUnlocked) {
    return (
      <Card title="Expenditure & Expenses (ఖర్చులు)">
        <div className="locked-expenses-banner">
          <div className="locked-shield-icon">🔒</div>
          <div className="locked-content">
            <h3>Expense Transactions & Vouchers are Confidential</h3>
            <p>
              To maintain financial security and vendor privacy, granular expense transactions and bills are restricted to <b>Authorized Committee Members and Auditors</b>.
            </p>
            <div className="locked-public-stat">
              <span>Audited Total Expenditure:</span>
              <b>₹ {totalSpent.toLocaleString()}</b>
              <small>({expenses.length} official vouchers recorded)</small>
            </div>
            <div className="locked-actions">
              <button
                type="button"
                className="unlock-portal-btn"
                onClick={onOpenLogin}
              >
                <span className="btn-icon">🔓</span>
                <span>Committee Member Sign In to View Vouchers</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Authorized / Admin Unlocked View
  return (
    <>
      <Card
        title="Expenditure & Expenses (ఖర్చులు)"
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button onClick={handleOpenAdd}>
              ➕ Record Expense
            </Button>
            <Button
              kind="secondary"
              onClick={() => onOpenExcelImport && onOpenExcelImport('expenses')}
              title="Upload Excel or CSV file to extract and import expenses in bulk"
            >
              📊 Bulk Excel Import
            </Button>
          </div>
        }
      >
        <div className="filter-bar">
          <input
            value={expenseSearch}
            placeholder="Search by category, payer, vendor or notes..."
            onChange={(e) => setExpenseSearch(e.target.value)}
          />
          {categories.length > 2 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="records-list">
          {filteredExpenses.map((exp) => (
            <article className="record-item expense-record-item" key={exp.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{exp.category}</b>
                  <strong className="record-amount spent">
                    ₹ {Number(exp.amount || 0).toLocaleString()}
                  </strong>
                </div>

                {(exp.paid_by || exp.paid_to) && (
                  <div className="expense-payer-vendor-row">
                    {exp.paid_by && (
                      <span className="payer-badge">
                        <span className="badge-lbl">👤 Paid By:</span> <b>{exp.paid_by}</b>
                      </span>
                    )}
                    {exp.paid_to && (
                      <span className="vendor-badge">
                        <span className="badge-lbl">🏪 Paid To:</span> <b>{exp.paid_to}</b>
                      </span>
                    )}
                  </div>
                )}

                <small className="record-meta">
                  📅 {fmtDate(exp.date)}
                  {exp.payment_mode && ` · 💳 ${exp.payment_mode}`}
                  {exp.note && ` · 📝 ${exp.note}`}
                </small>
              </div>

              {admin && (
                <RecordActions
                  record={exp}
                  fields={expenseFields}
                  onSave={(values) =>
                    update('expenses', exp.id, {
                      ...values,
                      amount: Number(values.amount)
                    })
                  }
                  onDelete={() => remove('expenses', exp.id)}
                  deleteTitle="Delete Expense Record"
                  deleteMessage={`Delete expense of ₹${Number(exp.amount || 0).toLocaleString()} for ${exp.category}?`}
                />
              )}
            </article>
          ))}
        </div>

        {!filteredExpenses.length && (
          <Empty
            text={
              expenseSearch
                ? `No expenses matching "${expenseSearch}".`
                : 'No expenses recorded yet. Click "Record Expense" above.'
            }
          />
        )}
      </Card>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <Modal
          title="Record New Pandal Expense"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>🏷️ Expense Category</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Sound System & Lighting"
                autoFocus
                required
              />
              <div className="role-preset-chips">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`role-chip ${category === cat ? 'selected' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>💸 Amount Spent (₹)</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  inputMode="numeric"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>👤 Paid By / Spent By (Optional)</span>
                </label>
                <input
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  placeholder="e.g. Srikanth / Committee Fund (leave blank if not needed)"
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>🏪 Paid To (Vendor / Shop / Receiver - Optional)</span>
                </label>
                <input
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. Sri Balaji Tent House (leave blank if not needed)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>📅 Payment Date</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>💳 Payment Mode</span>
                </label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="GPay">GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>🧾 Bill / Voucher / Notes (Optional)</span>
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Bill #104, Stage carpet advance"
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Recording…' : 'Record Expense'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
