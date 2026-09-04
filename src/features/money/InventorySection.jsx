import React, { useMemo } from 'react'
import { Card, Empty, Form } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { currency } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function InventorySection({
  purchases = [],
  admin = false,
  add,
  update,
  remove
}) {
  const { toast } = useToast()

  const reusablePurchases = useMemo(
    () => purchases.filter((p) => p.reusable),
    [purchases]
  )
  const reusableWorth = useMemo(
    () => reusablePurchases.reduce((sum, p) => sum + Number(p.cost || 0), 0),
    [reusablePurchases]
  )

  const purchasesByYear = useMemo(() => {
    const groups = purchases.reduce((acc, item) => {
      const year = item.year || new Date().getFullYear()
      acc[year] = acc[year] || []
      acc[year].push(item)
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

  const handleAddPurchase = async (values) => {
    const payload = {
      ...values,
      cost: Number(values.cost),
      year: Number(values.year)
    }
    const err = await add('purchases', payload)
    if (err) {
      toast.error(err.message || 'Could not record inventory purchase.')
    } else {
      toast.success(`Added ${payload.item} to temple inventory.`)
    }
  }

  return (
    <>
      <Card
        title="Reusable Inventory & Assets"
        action={
          reusablePurchases.length > 0 && (
            <span className="inventory-badge">
              🏷️ Reusable Asset Worth: <b>{currency.format(reusableWorth)}</b>
            </span>
          )
        }
      >
        <div className="purchases-by-year">
          {purchasesByYear.map(([year, items]) => (
            <div key={year} className="year-group">
              <h4 className="year-heading">📅 Year {year} Purchases ({items.length} items)</h4>
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

                    {admin && (
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
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!purchases.length && (
          <Empty text="No permanent assets or reusable inventory recorded yet." />
        )}
      </Card>

      {admin && (
        <Card title="Add Asset / Reusable Inventory">
          <Form
            fields={purchaseFields}
            onSubmit={handleAddPurchase}
            submitLabel="Add to Inventory"
          />
        </Card>
      )}
    </>
  )
}

