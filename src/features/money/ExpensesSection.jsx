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
  add,
  update,
  remove,
  onOpenExcelImport
}) {
  const { toast } = useToast()
  const [expenseSearch, setExpenseSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Form states
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [paidTo, setPaidTo] = useState('')
  const [date, setDate] = useState(today())
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Group expenses by category
  const categories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category || 'General'))
    return ['ALL', ...Array.from(set)]
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        (e.category || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.paid_to || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.note || '').toLowerCase().includes(expenseSearch.toLowerCase())
      if (!matchSearch) return false
      if (selectedCategory !== 'ALL' && (e.category || 'General') !== selectedCategory) return false
      return true
    })
  }, [expenses, expenseSearch, selectedCategory])

  const handleOpenAdd = () => {
    setCategory('')
    setAmount('')
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
    const cleanPaidTo = (paidTo || '').trim()

    if (!cleanCat || !numAmount || numAmount <= 0 || !cleanPaidTo) {
      toast.error('Please enter expense category, vendor name, and valid amount.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        category: cleanCat,
        amount: numAmount,
        paid_to: cleanPaidTo,
        date: date || today(),
        payment_mode: paymentMode,
        note: (note || '').trim()
      }

      const err = await add('expenses', payload)
      if (err) throw err

      toast.success(`Recorded expense of ₹${numAmount} for ${cleanCat}`)
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
    { name: 'date', label: 'Payment Date', type: 'date', default: today(), required: true },
    { name: 'paid_to', label: 'Paid To (Vendor / Person)', required: true, placeholder: 'e.g. Sri Balaji Sound System' },
    { name: 'payment_mode', label: 'Payment Method', type: 'select', options: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Bank Transfer'], default: 'Cash' },
    { name: 'note', label: 'Bill / Voucher / Notes', placeholder: 'Optional bill or receipt notes' }
  ]

  return (
    <>
      <Card
        title="Expenditure & Expenses"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
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
            placeholder="Search expense by vendor or category..."
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
            <article className="record-item" key={exp.id}>
              <div className="record-main">
                <div className="record-title-row">
                  <b>{exp.category}</b>
                  <strong className="record-amount spent">
                    {currency.format(exp.amount)}
                  </strong>
                </div>
                <small className="record-meta">
                  📅 {fmtDate(exp.date)} · Paid to: <b>{exp.paid_to}</b>
                  {exp.payment_mode && ` · 💳 ${exp.payment_mode}`}
                  {exp.note && ` · 📝 ${exp.note}`}
                </small>
              </div>

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
                deleteMessage={`Delete expense of ${currency.format(
                  exp.amount
                )} for ${exp.category}?`}
              />
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
              <label>Expense Category *</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Sound System & Lighting"
                autoFocus
                required
              />
              <div className="role-preset-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="role-chip"
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #fed7aa',
                      background: category === cat ? '#ffedd5' : '#fff7ed',
                      cursor: 'pointer',
                      fontWeight: category === cat ? '700' : '500'
                    }}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Amount Spent (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Paid To (Vendor / Person) *</label>
                <input
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. Sri Balaji Tent House"
                  required
                />
              </div>
            </div>

            <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="GPay">GPay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Bill / Voucher Notes (Optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bill #104, Stage carpet advance"
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Recording…' : 'Record Expense'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
