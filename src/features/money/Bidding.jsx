import { useState } from 'react'
import { Card, Empty, Form, Button, Modal, ConfirmModal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { ReceiptTemplateModal } from '../../components/ReceiptTemplateModal'
import { currency } from '../../lib/formatters'
import { openLadduBidWinnerWhatsApp } from '../../lib/whatsapp'
import { useToast } from '../../context/ToastContext'

export function Bidding({ data, admin, add, update, remove, recordBid, closeBid }) {
  const { toast } = useToast()
  const bidItems = data.bid_items || []
  const bidHistory = data.bid_history || []
  const [bids, setBids] = useState({})
  const [busyBidId, setBusyBidId] = useState(null)
  const [itemToClose, setItemToClose] = useState(null)
  const [selectedAuctionForCard, setSelectedAuctionForCard] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Add auction item form state
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [startingBid, setStartingBid] = useState('')
  const [isSavingItem, setIsSavingItem] = useState(false)

  const bidItemFields = [
    { name: 'item_name', label: 'Item Name / Description', required: true, placeholder: 'e.g. Maha Laddu Prasadam, Silver Coin' },
    { name: 'description', label: 'Item Details', type: 'textarea', placeholder: 'Special characteristics, weight, sponsor details...' },
    { name: 'starting_bid', label: 'Starting Bid (₹)', type: 'number', min: '1', required: true, placeholder: '5000' }
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

  const handleOpenAdd = () => {
    setItemName('')
    setDescription('')
    setStartingBid('5000')
    setIsAddModalOpen(true)
  }

  const handleSaveAddItem = async (e) => {
    if (e) e.preventDefault()
    const cleanName = itemName.trim()
    const numStarting = Number(startingBid)

    if (!cleanName || isNaN(numStarting) || numStarting <= 0) {
      toast.error('Please enter valid item name and starting bid.')
      return
    }

    setIsSavingItem(true)
    try {
      const err = await add('bid_items', {
        item_name: cleanName,
        description: description.trim() || 'Traditional Festival Auction Item',
        starting_bid: numStarting,
        current_bid: numStarting,
        current_bidder: '',
        status: 'open'
      })

      if (err) throw err

      toast.success(`Added "${cleanName}" to auction list!`)
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to add auction item.')
    } finally {
      setIsSavingItem(false)
    }
  }

  return (
    <Card
      title="Day 3 Bidding & Laddu Auction"
      action={
        <Button onClick={handleOpenAdd}>
          ➕ Add Auction Item
        </Button>
      }
    >
      <p className="muted">
        Special items, Maha Laddu prasadam, and traditional festival auction records.
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
                <RecordActions
                  record={item}
                  fields={bidItemFields}
                  onSave={(values) =>
                    update('bid_items', item.id, {
                      ...values,
                      starting_bid: Number(values.starting_bid)
                    })
                  }
                  onDelete={() => remove('bid_items', item.id)}
                  deleteTitle="Remove Auction Item"
                  deleteMessage={`Are you sure you want to remove "${item.item_name}" from the auction list?`}
                />
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

              {item.current_bidder && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-wa-receipt"
                    onClick={() => {
                      openLadduBidWinnerWhatsApp({
                        bidderName: item.current_bidder,
                        phone: '',
                        amount: item.current_bid,
                        item: item.item_name,
                        villageName: (data.settings?.[0] || {}).village_name || 'Sri Vinayaka Utsava Committee 2026'
                      })
                    }}
                    title="Send WhatsApp congratulations to winner"
                  >
                    📲 <span>WhatsApp Alert</span>
                  </button>

                  <Button
                    type="button"
                    kind="receipt-action"
                    size="small"
                    onClick={() => setSelectedAuctionForCard(item)}
                    title="View, download image, or share official Day 3 Auction Winner Certificate on Ganesha template"
                  >
                    <span className="action-icon">📜</span>
                    <span className="action-label">{isOpen ? 'Auction Card' : 'Winner Certificate'}</span>
                  </Button>
                </div>
              )}

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

              {isOpen && (
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
        <Empty>Bid items will be listed here during the festival auction. Click 'Add Auction Item' above.</Empty>
      )}

      {/* Add Auction Item Modal */}
      {isAddModalOpen && (
        <Modal
          title="Add New Auction Item"
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleSaveAddItem} className="member-form">
            <div className="form-group">
              <label>Item Name / Description *</label>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Special Maha Laddu Prasadam (21 Kg)"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Starting Bid (₹) *</label>
              <input
                type="number"
                min="1"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>

            <div className="form-group">
              <label>Details & Sponsor Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Prepared with pure ghee and dry fruits, sponsored by Reddy family..."
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" disabled={isSavingItem}>
                {isSavingItem ? 'Adding…' : 'Add Auction Item'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
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

      {/* Universal Auction Winner Certificate Modal */}
      {selectedAuctionForCard && (
        <ReceiptTemplateModal
          isOpen={Boolean(selectedAuctionForCard)}
          onClose={() => setSelectedAuctionForCard(null)}
          record={selectedAuctionForCard}
          type="auction"
          settings={data.settings?.[0] || {}}
          admin={admin}
        />
      )}
    </Card>
  )
}
