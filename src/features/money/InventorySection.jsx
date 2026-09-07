import React, { useState, useMemo } from 'react'
import { Card, Empty, Form, Button, Modal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { currency } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

const ASSET_CATEGORIES = [
  'Pooja Utensils & Brassware',
  'Audio & Sound Equipment',
  'Focus & LED Lighting',
  'Stage & Frame Structures',
  'Cooking Cauldrons & Big Vessels',
  'Banners & Display Boards',
  'Decorative Props & Fabric'
]

export function InventorySection({
  purchases = [],
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Add form states
  const [item, setItem] = useState('')
  const [category, setCategory] = useState('')
  const [cost, setCost] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [reusable, setReusable] = useState(true)
  const [conditionNote, setConditionNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const reusablePurchases = useMemo(
    () => purchases.filter((p) => p.reusable),
    [purchases]
  )
  const reusableWorth = useMemo(
    () => reusablePurchases.reduce((sum, p) => sum + Number(p.cost || 0), 0),
    [reusablePurchases]
  )

  const purchasesByYear = useMemo(() => {
    const groups = purchases.reduce((acc, p) => {
      const yr = p.year || new Date().getFullYear()
      acc[yr] = acc[yr] || []
      acc[yr].push(p)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => String(b).localeCompare(String(a)))
  }, [purchases])

  const purchaseFields = [
    { name: 'item', label: 'Asset / Item Name', required: true, placeholder: 'e.g. Brass Pooja Aarti Plate' },
    { name: 'category', label: 'Category', required: true, placeholder: 'e.g. Utensils, Audio, Lighting, Decoration' },
    { name: 'cost', label: 'Cost (₹)', type: 'number', min: '0', required: true, placeholder: '1500' },
    { name: 'year', label: 'Purchase Year', type: 'number', default: new Date().getFullYear(), required: true },
    { name: 'reusable', label: 'Reusable inventory (kept for next year)', type: 'checkbox', default: true },
    { name: 'condition_note', label: 'Condition / Storage Location', placeholder: 'e.g. Good condition, stored in temple locker' }
  ]

  const handleOpenAdd = () => {
    setItem('')
    setCategory('')
    setCost('')
    setYear(new Date().getFullYear())
    setReusable(true)
    setConditionNote('')
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    if (e) e.preventDefault()
    const cleanItem = (item || '').trim()
    const cleanCat = (category || '').trim()
    const numCost = Number(cost)

    if (!cleanItem || !cleanCat || isNaN(numCost)) {
      toast.error('Please enter item name, category, and cost.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        item: cleanItem,
        category: cleanCat,
        cost: numCost,
        year: Number(year) || new Date().getFullYear(),
        reusable,
        condition_note: (conditionNote || '').trim()
      }

      const err = await add('purchases', payload)
      if (err) throw err

      toast.success(`Added ${cleanItem} to temple inventory.`)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Could not record inventory item.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card
        title="Reusable Inventory & Assets"
        action={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button onClick={handleOpenAdd}>
              ➕ Add Asset
            </Button>
            {reusablePurchases.length > 0 && (
              <span className="inventory-badge">
                🏷️ Reusable Worth: <b>{currency.format(reusableWorth)}</b>
              </span>
            )}
          </div>
        }
      >
        <div className="purchases-by-year">
          {purchasesByYear.map(([yr, items]) => (
            <div key={yr} className="year-group">
              <h4 className="year-heading">📅 Year {yr} Purchases ({items.length} items)</h4>
              <div className="records-list">
                {items.map((p) => (
                  <article className="record-item" key={p.id}>
                    <div className="record-main">
                      <div className="record-title-row">
                        <b>{p.item}</b>
                        {p.reusable && (
                          <span className="badge badge-success">✓ Reusable Asset</span>
                        )}
                        <span className="badge">{p.category}</span>
                        <strong className="record-amount spent">
                          {currency.format(p.cost)}
                        </strong>
                      </div>
                      <small className="record-meta">
                        Condition/Location: <b>{p.condition_note || 'In Temple Locker'}</b>
                      </small>
                    </div>

                    <RecordActions
                      record={p}
                      fields={purchaseFields}
                      onSave={(values) =>
                        update('purchases', p.id, {
                          ...values,
                          cost: Number(values.cost),
                          year: Number(values.year)
                        })
                      }
                      onDelete={() => remove('purchases', p.id)}
                      deleteTitle="Delete Inventory Item"
                      deleteMessage={`Delete ${p.item}?`}
                    />
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!purchases.length && (
          <Empty text="No permanent assets or reusable inventory recorded yet. Click 'Add Asset' above." />
        )}
      </Card>

      {/* Add Inventory Modal */}
      {isAddModalOpen && (
        <Modal
          title="Add Reusable Asset / Permanent Inventory"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAdd} className="member-form">
            <div className="form-group">
              <label className="form-label">
                <span>🏷️ Asset / Item Name</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Brass Pooja Aarti Plate, LED Floodlights"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📦 Category</span>
                <span className="req-star">*</span>
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Pooja Utensils"
                required
              />
              <div className="role-preset-chips">
                {ASSET_CATEGORIES.map((cat) => (
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
                  <span>💸 Cost / Value (₹)</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. 2500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>📅 Purchase Year</span>
                  <span className="req-star">*</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📍 Condition / Storage Location</span>
              </label>
              <input
                value={conditionNote}
                onChange={(e) => setConditionNote(e.target.value)}
                placeholder="e.g. Temple Store Locker, Room 2"
              />
            </div>

            <div
              className="form-group"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                background: '#f0fdf4',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}
            >
              <input
                type="checkbox"
                id="reusable-check"
                checked={reusable}
                onChange={(e) => setReusable(e.target.checked)}
                style={{ width: '18px', height: '18px', margin: 0 }}
              />
              <label htmlFor="reusable-check" style={{ margin: 0, cursor: 'pointer', fontWeight: '600', color: '#166534', fontSize: '0.88rem' }}>
                ✓ Permanent reusable asset (carried over to future years)
              </label>
            </div>

            <div className="modal-actions">
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Adding…' : 'Add to Inventory'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
