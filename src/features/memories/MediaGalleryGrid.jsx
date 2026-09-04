import React, { useState, useMemo } from 'react'
import { Card, Empty, Modal, Button } from '../../components/ui'
import { isGoogleDriveUrl } from '../../lib/storage'
import { fmtDate, today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function MediaGalleryGrid({
  items = [],
  admin = false,
  update,
  remove,
  onSelectLightbox
}) {
  const { toast } = useToast()
  const [activeFilter, setActiveFilter] = useState('all')

  // Edit State
  const [editingItem, setEditingItem] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [editDate, setEditDate] = useState(today())
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items
    if (activeFilter === 'immersion') {
      return items.filter((item) => {
        const cap = String(item.caption || '').toLowerCase()
        return (
          item.type === 'video' ||
          cap.includes('nimajjanam') ||
          cap.includes('immersion') ||
          cap.includes('visarjan') ||
          cap.includes('shobha')
        )
      })
    }
    return items.filter((item) => item.type === activeFilter)
  }, [items, activeFilter])

  const groupsByYear = useMemo(() => {
    const groups = filteredItems.reduce((acc, item) => {
      const year = item.date ? new Date(item.date).getFullYear() : new Date().getFullYear()
      acc[year] = acc[year] || []
      acc[year].push(item)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => String(b).localeCompare(String(a)))
  }, [filteredItems])

  const getYoutubeThumbnail = (url) => {
    if (!url) return null
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      }
      if (url.includes('youtube.com/watch')) {
        const search = new URL(url).searchParams
        return `https://img.youtube.com/vi/${search.get('v')}/hqdefault.jpg`
      }
      return null
    } catch {
      return null
    }
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setEditCaption(item.caption || '')
    setEditDate(item.date || today())
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingItem) return

    setIsUpdating(true)
    try {
      const err = await update('gallery_items', editingItem.id, {
        ...editingItem,
        caption: editCaption.trim(),
        date: editDate
      })
      if (err) throw err
      toast.success('Updated memory details.')
      setEditingItem(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (item) => {
    if (window.confirm('Delete this memory from the gallery?')) {
      const err = await remove('gallery_items', item.id)
      if (err) toast.error(err.message || 'Failed to delete.')
      else toast.success('Deleted memory item.')
    }
  }

  return (
    <>
      <Card title="Photo & Video Gallery (చిత్రశాల)">
        {/* Filter Chips */}
        <div className="gallery-filter-chips">
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Memories ({items.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'photo' ? 'active' : ''}`}
            onClick={() => setActiveFilter('photo')}
          >
            📷 Photos ({items.filter((i) => i.type === 'photo').length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'video' ? 'active' : ''}`}
            onClick={() => setActiveFilter('video')}
          >
            🎥 Videos ({items.filter((i) => i.type === 'video').length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'immersion' ? 'active' : ''}`}
            onClick={() => setActiveFilter('immersion')}
          >
            🎆 Immersion Highlights
          </button>
        </div>

        {/* Grouped by Year Grid */}
        <div className="gallery-year-groups">
          {groupsByYear.map(([year, yearItems]) => (
            <div key={year} className="year-section">
              <h4 className="year-header">📅 {year} Utsavam Highlights ({yearItems.length})</h4>
              <div className="gallery-grid">
                {yearItems.map((item) => {
                  const ytThumb = item.type === 'video' ? getYoutubeThumbnail(item.url) : null
                  const isDirectVideo =
                    item.type === 'video' &&
                    (item.url?.startsWith('data:video') ||
                      item.url?.startsWith('blob:') ||
                      item.url?.match(/\.(mp4|webm|ogg|mov)$/i) ||
                      isGoogleDriveUrl(item.url))

                  return (
                    <article className="gallery-card" key={item.id}>
                      <div
                        className="gallery-media-frame"
                        onClick={() => onSelectLightbox(item)}
                      >
                        {item.type === 'video' ? (
                          ytThumb ? (
                            <div className="video-thumb-wrap">
                              <img src={ytThumb} alt={item.caption} className="gallery-img" />
                              <span className="video-play-badge">▶</span>
                            </div>
                          ) : isDirectVideo ? (
                            <div className="video-thumb-wrap">
                              <video
                                src={item.url}
                                className="gallery-img"
                                preload="metadata"
                                muted
                              />
                              <span className="video-play-badge">▶</span>
                            </div>
                          ) : (
                            <div className="video-thumb-wrap">
                              <div className="video-placeholder-bg">🎥 Video</div>
                              <span className="video-play-badge">▶</span>
                            </div>
                          )
                        ) : (
                          <img
                            src={item.url}
                            alt={item.caption || 'Photo'}
                            className="gallery-img"
                            loading="lazy"
                          />
                        )}
                        <span className={`media-type-pill ${item.type}`}>
                          {item.type === 'video' ? '🎥 Video' : '📷 Photo'}
                        </span>
                      </div>

                      <div className="gallery-caption-row">
                        <div>
                          <b className="gallery-caption">{item.caption || 'Memory'}</b>
                          <small className="gallery-date">📅 {fmtDate(item.date)}</small>
                        </div>

                        {admin && (
                          <div className="gallery-card-actions">
                            <button
                              type="button"
                              className="btn-icon-small"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Caption / Date"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn-icon-small"
                              onClick={() => handleDelete(item)}
                              title="Delete Item"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {!filteredItems.length && (
          <Empty text="No memories found for this filter." />
        )}
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <Modal title="Edit Memory Details" onClose={() => setEditingItem(null)}>
          <form onSubmit={handleSaveEdit} className="member-form">
            <div className="form-group">
              <label>Caption / Title *</label>
              <input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button type="button" kind="secondary" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
