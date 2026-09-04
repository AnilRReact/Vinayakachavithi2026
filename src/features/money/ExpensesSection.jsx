import React, { useState, useMemo } from 'react'
import { Card, Empty, Form, Button } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { currency, fmtDate, today } from '../../lib/formatters'
import { syncNewExpense } from '../../lib/googleSheetsSync'
import { useToast } from '../../context/ToastContext'

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

  const expenseFields = [
    { name: 'category', label: 'Expense Category', required: true, placeholder: 'e.g. Tent & Lighting, Flowers, Prasadam, Sound' },
    { name: 'amount', label: 'Amount Spent (₹)', type: 'number', min: '1', required: true, placeholder: '5000' },
    { name: 'date', label: 'Payment Date', type: 'date', default: today(), required: true },
    { name: 'paid_to', label: 'Paid To (Vendor / Person)', required: true, placeholder: 'e.g. Sri Balaji Sound System' },
    { name: 'payment_mode', label: 'Payment Method', type: 'select', options: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Bank Transfer'], default: 'Cash' },
    { name: 'note', label: 'Bill / Voucher / Notes', placeholder: 'Optional bill or receipt notes' }
  ]

  const handleAddExpense = async (values) => {
    const payload = {
      ...values,
      amount: Number(values.amount)
    }
    const err = await add('expenses', payload)
    if (err) {
      toast.error(err.message || 'Could not record expense.')
    } else {
      toast.success(`Recorded expense of ₹${payload.amount} for ${payload.category}`)
      // Live Google Sheets Auto-Sync
      syncNewExpense(payload)
    }
  }

  return (
    <>
      <Card
        title="Expenditure & Expenses"
        action={
          admin && (
            <Button
              kind="secondary"
              onClick={() => onOpenExcelImport('expenses')}
              title="Upload Excel or CSV file to extract and import expenses in bulk"
            >
              📊 Bulk Excel Import
            </Button>
          )
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
                  deleteMessage={`Delete expense of ${currency.format(
                    exp.amount
                  )} for ${exp.category}?`}
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
                : 'No expenses recorded yet.'
            }
          />
        )}
      </Card>

      {admin && (
        <Card title="Record New Expense">
          <Form
            fields={expenseFields}
            onSubmit={handleAddExpense}
            submitLabel="Record Expense (ఖర్చు నమోదు)"
          />
        </Card>
      )}
    </>
  )
}

