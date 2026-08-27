import { useState } from 'react'
import { Card, Empty, Form, Button, ConfirmModal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { currency } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Bidding({ data, admin, add, update, remove, recordBid, closeBid }) {
  const { toast } = useToast()
  const bidItems = data.bid_items || []
  const bidHistory = data.bid_history || []
  const [bids, setBids] = useState({})
  const [busyBidId, setBusyBidId] = useState(null)
  const [itemToClose, setItemToClose] = useState(null)

  const bidItemFields = [
    { name: 'item_name', label: 'Item Name / Description', required: true, placeholder: 'e.g. Laddu Prasadam, Silver Coin' },
    { name: 'description', label: 'Item Details', type: 'textarea', placeholder: 'Special characteristics, weight, sponsor details...' },
    { name: 'starting_bid', label: 'Starting Bid (₹)', type: 'number', min: '1', required: true, placeholder: '500' }
  ]

  const submitBid = async (item) => {
    const bid = bids[item.id] || {}
    const bidderName = (bid.bidder || '').trim()
    const amount = Number(bid.amount)
    const currentHigh = Number(item.current_bid || item.starting_bid || 0)

    if (!bidderName) {
      toast.error('Please enter the bidder’s name.')
      return
    }
    if (!amount || amount <= currentHigh) {
      toast.error(`Bid amount must be greater than current bid of ${currency.format(currentHigh)}.`)
      return
    }

    setBusyBidId(item.id)
    try {
      const err = await recordBid(item.id, bidderName, amount)
      if (err) {
        toast.error(err.message || 'Failed to record bid.')
      } else {
        toast.success(`Bid of ${currency.format(amount)} by ${bidderName} recorded!`)
        setBids((prev) => ({ ...prev, [item.id]: { bidder: '', amount: '' } }))
      }
    } finally {
      setBusyBidId(null)
    }
  }

  const handleCloseAuction = async () => {
    if (!itemToClose) return
    const err = await closeBid(itemToClose.id)
    if (err) {
      toast.error(err.message || 'Could not close bidding.')
    } else {
      toast.success(`Auction for ${itemToClose.item_name} closed! Winning bid: ${currency.format(itemToClose.current_bid)} by ${itemToClose.current_bidder}.`)
    }
    setItemToClose(null)
  }

  const handleAddBidItem = async (values) => {
    const startingBid = Number(values.starting_bid)
    const err = await add('bid_items', {
      ...values,
      starting_bid: startingBid,
      current_bid: startingBid,
      status: 'open'
    })
    if (err) {
      toast.error(err.message || 'Failed to add auction item.')
    } else {
      toast.success('Auction item added.')
    }
  }

  const handleUpdateBidItem = async (id, values) => {
    const err = await update('bid_items', id, {
      ...values,
      starting_bid: Number(values.starting_bid)
    })
    if (err) {
      toast.error(err.message || 'Failed to update auction item.')
    } else {
      toast.success('Auction item updated.')
    }
  }

  const handleDeleteBidItem = async (id) => {
    const err = await remove('bid_items', id)
    if (err) {
      toast.error(err.message || 'Failed to remove auction item.')
    } else {
      toast.success('Auction item removed.')
    }
  }

  return (
    <Card title="Day 3 Bidding & Auction">
      <p className="muted">
        Special items, Laddu prasadam, and traditional festival auction records.
      </p>

      <div className="auctions-list">
        {bidItems.map((item) => {
          const history = bidHistory
            .filter((h) => h.bid_item_id === item.id)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

          const minNextBid = Number(item.current_bid || item.starting_bid || 0) + 1
          const isOpen = item.status === 'open'

          return (
            <article className={`auction-card ${isOpen ? 'open' : 'closed'}`} key={item.id}>
              <div className="auction-header">
                <div>
                  <h3>{item.item_name}</h3>
                  <span className={`badge ${isOpen ? 'green' : 'contributor'}`}>
                    {isOpen ? '● Bidding Open' : '✓ Closed'}
                  </span>
                </div>
                {admin && (
                  <RecordActions
                    record={item}
                    fields={bidItemFields}
                    onSave={(values) => handleUpdateBidItem(item.id, values)}
                    onDelete={() => handleDeleteBidItem(item.id)}
                    deleteTitle="Remove Auction Item"
                    deleteMessage={`Are you sure you want to remove "${item.item_name}" from the auction list?`}
                  />
                )}
              </div>

              {item.description && <p className="auction-desc">{item.description}</p>}

              <div className="auction-current-bid">
                <span>{item.current_bidder ? 'Highest Bid:' : 'Starting Bid:'}</span>
                <strong>
                  {currency.format(item.current_bid || item.starting_bid)}
                </strong>
                {item.current_bidder && (
                  <span className="bidder-name">by <b>{item.current_bidder}</b></span>
                )}
              </div>

              {history.length > 0 && (
                <div className="bid-history-container">
                  <small className="history-label">Bid progression ({history.length}):</small>
                  <div className="bid-history">
                    {history.map((h) => (
                      <span key={h.id} className="history-pill">
                        ↑ {currency.format(h.amount)} · {h.bidder}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {admin && isOpen && (
                <div className="bid-form-wrapper">
                  <h4>Record Incoming Bid</h4>
                  <div className="bid-form">
                    <input
                      placeholder="Bidder name"
                      value={bids[item.id]?.bidder || ''}
                      disabled={busyBidId === item.id}
                      onChange={(e) =>
                        setBids({
                          ...bids,
                          [item.id]: { ...bids[item.id], bidder: e.target.value }
                        })
                      }
                    />
                    <input
                      type="number"
                      min={minNextBid}
                      placeholder={`Min ₹${minNextBid}`}
                      value={bids[item.id]?.amount || ''}
                      disabled={busyBidId === item.id}
                      onChange={(e) =>
                        setBids({
                          ...bids,
                          [item.id]: { ...bids[item.id], amount: e.target.value }
                        })
                      }
                    />
                    <Button
                      type="button"
                      disabled={busyBidId === item.id}
                      onClick={() => submitBid(item)}
                    >
                      {busyBidId === item.id ? 'Recording…' : 'Record Bid'}
                    </Button>
                    <Button
                      type="button"
                      kind="secondary"
                      disabled={busyBidId === item.id}
                      onClick={() => {
                        if (!item.current_bidder) {
                          toast.error('Record at least one bid before closing the auction.')
                          return
                        }
                        setItemToClose(item)
                      }}
                    >
                      Close Bidding
                    </Button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {!bidItems.length && (
        <Empty>Bid items will be listed here during the festival auction.</Empty>
      )}

      {admin && (
        <div style={{ marginTop: '24px' }}>
          <h4>Add New Auction Item</h4>
          <Form
            submit="Add Bid Item"
            onSubmit={handleAddBidItem}
            fields={bidItemFields}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(itemToClose)}
        onClose={() => setItemToClose(null)}
        onConfirm={handleCloseAuction}
        title="Close Bidding"
        message={
          itemToClose
            ? `Close bidding for "${itemToClose.item_name}"? The winning bid of ${currency.format(
                itemToClose.current_bid
              )} by ${itemToClose.current_bidder} will be finalized.`
            : ''
        }
        confirmText="Finalize & Close"
        isDestructive={false}
      />
    </Card>
  )
}

