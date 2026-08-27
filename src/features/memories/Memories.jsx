import { useState, useMemo } from 'react'
import { Card, Empty, Button, Modal, ConfirmModal } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { uploadImageToStorage } from '../../lib/storage'
import { fmtDate, today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function Memories({ data, admin, add, update, remove }) {
  const { toast } = useToast()
  const galleryItems = data.gallery_items || []

  // Gallery view state
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)

  // Edit Item State
  const [editingItem, setEditingItem] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [editDate, setEditDate] = useState(today())
  const [isUpdating, setIsUpdating] = useState(false)

  // B-2: Add Media Flow State
  const [mediaMode, setMediaMode] = useState('photo') // 'photo' | 'link'
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoDate, setPhotoDate] = useState(today())
  const [isUploading, setIsUploading] = useState(false)

  const [linkUrl, setLinkUrl] = useState('')
  const [linkCaption, setLinkCaption] = useState('')
  const [linkDate, setLinkDate] = useState(today())
  const [isSavingLink, setIsSavingLink] = useState(false)

  // Nimajjanam / Immersion Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Filtered and grouped items
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return galleryItems
    if (activeFilter === 'immersion') {
      return galleryItems.filter((item) => {
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
    return galleryItems.filter((item) => item.type === activeFilter)
  }, [galleryItems, activeFilter])

  // Dedicated Immersion & Shobha Yatra video highlights
  const immersionItems = useMemo(() => {
    const matched = galleryItems.filter((i) => {
      const cap = String(i.caption || '').toLowerCase()
      return (
        i.type === 'video' ||
        cap.includes('nimajjanam') ||
        cap.includes('immersion') ||
        cap.includes('visarjan') ||
        cap.includes('shobha')
      )
    })
    if (matched.length > 0) return matched

    // Default festival demo video slides
    return [
      {
        id: 'immersion-demo-1',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=17X21hE2G90',
        caption: '🎆 Grand Shobha Yatra Procession & Fireworks Spectacle',
        date: today()
      },
      {
        id: 'immersion-demo-2',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=17X21hE2G90',
        caption: '🥁 Dappu Dance & Holy Visarjan at Lake Ghat',
        date: today()
      }
    ]
  }, [galleryItems])

  const currentImmersionItem = immersionItems[carouselIndex] || immersionItems[0]

  const groupsByYear = useMemo(() => {
    const groups = filteredItems.reduce((acc, item) => {
      const year = (item.date || today()).slice(0, 4)
      acc[year] = acc[year] || []
      acc[year].push(item)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => String(b).localeCompare(String(a)))
  }, [filteredItems])

  const photoCount = useMemo(
    () => galleryItems.filter((i) => i.type === 'photo').length,
    [galleryItems]
  )
  const videoCount = useMemo(
    () => galleryItems.filter((i) => i.type === 'video').length,
    [galleryItems]
  )
  const immersionCount = useMemo(() => immersionItems.length, [immersionItems])

  // Estimated storage (Supabase Free Tier is 1GB = 1024MB)
  const estimatedStorageMB = useMemo(() => {
    return ((photoCount * 0.25) + 0.1).toFixed(1)
  }, [photoCount])

  const isNearLimit = Number(estimatedStorageMB) > 800

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
  }

  const handleUploadPhoto = async (e) => {
    e.preventDefault()
    if (!photoFile) {
      toast.error('Please select an image file to upload.')
      return
    }
    if (!supabase) {
      toast.error('Supabase is not configured.')
      return
    }

    setIsUploading(true)
    try {
      const publicUrl = await uploadImageToStorage(photoFile, 'gallery', 1000)

      const err = await add('gallery_items', {
        type: 'photo',
        url: publicUrl,
        caption: photoCaption.trim() || null,
        date: photoDate || today()
      })

      if (err) throw err

      toast.success('Photo uploaded and published!')
      setPhotoFile(null)
      setPhotoPreview('')
      setPhotoCaption('')
      setPhotoDate(today())
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddLink = async (e) => {
    e.preventDefault()
    if (!linkUrl.trim()) {
      toast.error('Please enter a valid video or album URL.')
      return
    }

    setIsSavingLink(true)
    try {
      const err = await add('gallery_items', {
        type: 'video',
        url: linkUrl.trim(),
        caption: linkCaption.trim() || 'Festival Video / Album',
        date: linkDate || today()
      })

      if (err) throw err

      toast.success('External link added to memories!')
      setLinkUrl('')
      setLinkCaption('')
      setLinkDate(today())
    } catch (err) {
      toast.error(err.message || 'Failed to save link.')
    } finally {
      setIsSavingLink(false)
    }
  }

  const openEditModal = (item) => {
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
        caption: editCaption.trim() || null,
        date: editDate || today()
      })

      if (err) throw err

      toast.success('Media details updated.')
      setEditingItem(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update media item.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    const err = await remove('gallery_items', itemToDelete.id)
    if (err) {
      toast.error(err.message || 'Failed to delete item.')
    } else {
      toast.success('Media item removed.')
      if (selectedItem?.id === itemToDelete.id) {
        setSelectedItem(null)
      }
    }
    setItemToDelete(null)
  }

  return (
    <>
      {/* Grand Nimajjanam & Visarjan Video Highlights Carousel */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>🎆</span>
              <span>Grand Nimajjanam & Visarjan Video Highlights</span>
            </div>
            <span style={{ fontSize: '0.76rem', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '999px', fontWeight: '800', border: '1px solid #fde68a' }}>
              🥁 Shobha Yatra Special
            </span>
          </div>
        }
      >
        <p className="muted" style={{ marginTop: '-4px' }}>
          Live video streams, fireworks spectacles, and devotional highlights of Lord Ganesha&apos;s holy Visarjan and grand street procession.
        </p>

        {currentImmersionItem && (
          <div className="immersion-carousel-wrap" style={{ background: '#190504', borderRadius: '12px', padding: '12px', overflow: 'hidden', border: '2px solid #d7952f', marginTop: '12px' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              {currentImmersionItem.type === 'video' && currentImmersionItem.url?.includes('youtu') ? (
                <iframe
                  style={{ width: '100%', height: '100%', border: 0 }}
                  title={currentImmersionItem.caption || 'Nimajjanam Video'}
                  src={`https://www.youtube-nocookie.com/embed/${
                    (currentImmersionItem.url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/) || [])[1] || ''
                  }?rel=0`}
                  allowFullScreen
                />
              ) : currentImmersionItem.type === 'photo' ? (
                <img
                  src={currentImmersionItem.url}
                  alt={currentImmersionItem.caption || 'Nimajjanam Highlight'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ffe0a0', padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.5rem' }}>🎬</span>
                  <p style={{ margin: '8px 0 14px', fontWeight: '600' }}>{currentImmersionItem.caption}</p>
                  <a href={currentImmersionItem.url} target="_blank" rel="noreferrer" className="button primary">
                    Watch Video / Album ↗
                  </a>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px', color: '#fff' }}>
              <div>
                <h4 style={{ margin: 0, color: '#ffe0a0', fontSize: '1rem' }}>
                  {currentImmersionItem.caption || 'Shobha Yatra & Immersion Highlight'}
                </h4>
                <small style={{ color: '#fed7aa' }}>📅 {fmtDate(currentImmersionItem.date || today())}</small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#fed7aa' }}>
                  {carouselIndex + 1} of {immersionItems.length}
                </span>
                <Button
                  type="button"
                  size="small"
                  kind="secondary"
                  disabled={carouselIndex === 0}
                  onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                >
                  ◀ Prev
                </Button>
                <Button
                  type="button"
                  size="small"
                  kind="secondary"
                  disabled={carouselIndex >= immersionItems.length - 1}
                  onClick={() => setCarouselIndex((prev) => Math.min(immersionItems.length - 1, prev + 1))}
                >
                  Next ▶
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Memories & Gallery">
        <p className="muted">
          Moments, celebrations, aarti videos, and procession photos from over the years.
        </p>

        {/* Filter Tabs */}
        <div className="media-tabs" role="tablist">
          <button
            type="button"
            className={activeFilter === 'all' ? 'active' : ''}
            onClick={() => setActiveFilter('all')}
          >
            All <small>({galleryItems.length})</small>
          </button>
          <button
            type="button"
            className={activeFilter === 'immersion' ? 'active' : ''}
            onClick={() => setActiveFilter('immersion')}
          >
            🎆 Nimajjanam Special <small>({immersionCount})</small>
          </button>
          <button
            type="button"
            className={activeFilter === 'photo' ? 'active' : ''}
            onClick={() => setActiveFilter('photo')}
          >
            📷 Photos <small>({photoCount})</small>
          </button>
          <button
            type="button"
            className={activeFilter === 'video' ? 'active' : ''}
            onClick={() => setActiveFilter('video')}
          >
            🎬 Videos & Links <small>({videoCount})</small>
          </button>
        </div>

        {/* Storage Health Indicator (Admin) */}
        {admin && (
          <div className={`storage-indicator-banner ${isNearLimit ? 'warning' : ''}`}>
            <span>📊 <b>Storage:</b> ~{estimatedStorageMB} MB used of 1 GB free quota ({isNearLimit ? '⚠️ Nearing 1GB limit' : 'Healthy'})</span>
          </div>
        )}

        {/* Year Grouped Gallery Items */}
        <div className="gallery-years">
          {groupsByYear.map(([year, items]) => (
            <div className="year-group" key={year}>
              <h3 className="year-title">
                {year} <small>({items.length} {items.length === 1 ? 'item' : 'items'})</small>
              </h3>

              <div className="gallery">
                {items.map((item) => (
                  <div className="gallery-card" key={item.id}>
                    <button
                      type="button"
                      className="gallery-item-btn"
                      onClick={() => setSelectedItem(item)}
                      aria-label={`View ${item.caption || 'memory'}`}
                    >
                      {item.type === 'photo' ? (
                        <img
                          src={item.url}
                          alt={item.caption || 'Festival memory'}
                          loading="lazy"
                        />
                      ) : (
                        <div className="video-thumb">
                          <span className="play-icon">▶</span>
                          <small>{item.caption || 'External Link / Video'}</small>
                        </div>
                      )}
                      <span className="gallery-caption">
                        {item.caption || (item.type === 'photo' ? 'Photo' : 'Video')}
                      </span>
                    </button>

                    {admin && (
                      <div className="gallery-admin-overlay">
                        <button
                          type="button"
                          className="gallery-action-icon edit"
                          onClick={() => openEditModal(item)}
                          title="Edit caption and date"
                          aria-label="Edit caption and date"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="gallery-action-icon delete"
                          onClick={() => setItemToDelete(item)}
                          title="Delete this media"
                          aria-label="Delete this media"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!galleryItems.length && (
          <Empty>Photos and videos from the celebration will live here.</Empty>
        )}
      </Card>

      {/* B-2 Overhaul: Explicit 2-Path Add Media Card */}
      {admin && (
        <Card title="Add Photo or Video Link">
          <p className="muted">
            Choose whether you are uploading a photo from your device or linking an external video/album.
          </p>

          {/* Mode Switcher */}
          <div className="media-mode-switcher">
            <button
              type="button"
              className={`mode-btn ${mediaMode === 'photo' ? 'active' : ''}`}
              onClick={() => setMediaMode('photo')}
            >
              📷 Upload Device Photo
            </button>
            <button
              type="button"
              className={`mode-btn ${mediaMode === 'link' ? 'active' : ''}`}
              onClick={() => setMediaMode('link')}
            >
              🎬 Add Video / Album Link
            </button>
          </div>

          {/* Upload Photo Form */}
          {mediaMode === 'photo' ? (
            <form className="form" onSubmit={handleUploadPhoto}>
              <div className="photo-dropzone" style={{ gridColumn: 'span 2' }}>
                {photoPreview ? (
                  <div className="preview-container">
                    <img src={photoPreview} alt="Preview" className="upload-preview-img" />
                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview('')
                      }}
                    >
                      ✕ Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="file-input-label">
                    <span className="upload-icon">📷</span>
                    <b>Click to choose a photo from your device</b>
                    <small>Auto-compressed in browser before upload</small>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              <label style={{ gridColumn: 'span 2' }}>
                <span>Photo Caption (optional)</span>
                <input
                  type="text"
                  placeholder="e.g. Day 1 Maha Aarti, Youth Mandali Stage"
                  value={photoCaption}
                  disabled={isUploading}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                />
              </label>

              <label style={{ gridColumn: 'span 2' }}>
                <span>Date</span>
                <input
                  type="date"
                  value={photoDate}
                  disabled={isUploading}
                  onChange={(e) => setPhotoDate(e.target.value)}
                />
              </label>

              <div className="form-actions" style={{ gridColumn: 'span 2' }}>
                <Button type="submit" disabled={isUploading || !photoFile}>
                  {isUploading ? 'Compressing & Uploading…' : 'Publish Photo to Gallery'}
                </Button>
              </div>
            </form>
          ) : (
            /* Add Link Form */
            <form className="form" onSubmit={handleAddLink}>
              <label style={{ gridColumn: 'span 2' }}>
                <span>Video or External Album Link <span className="req-star">*</span></span>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or Google Photos album"
                  value={linkUrl}
                  disabled={isSavingLink}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <small className="field-hint">
                  YouTube links will automatically render as playable embeds in the gallery lightbox.
                </small>
              </label>

              <label style={{ gridColumn: 'span 2' }}>
                <span>Title / Caption</span>
                <input
                  type="text"
                  placeholder="e.g. Immersion Procession Live Stream"
                  value={linkCaption}
                  disabled={isSavingLink}
                  onChange={(e) => setLinkCaption(e.target.value)}
                />
              </label>

              <label style={{ gridColumn: 'span 2' }}>
                <span>Date</span>
                <input
                  type="date"
                  value={linkDate}
                  disabled={isSavingLink}
                  onChange={(e) => setLinkDate(e.target.value)}
                />
              </label>

              <div className="form-actions" style={{ gridColumn: 'span 2' }}>
                <Button type="submit" disabled={isSavingLink || !linkUrl.trim()}>
                  {isSavingLink ? 'Saving Link…' : 'Add Video / Album Link'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Lightbox Preview */}
      {selectedItem && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedItem(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setSelectedItem(null)}
            aria-label="Close preview"
          >
            ✕
          </button>
          <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
            {selectedItem.type === 'photo' ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.caption || 'Festival memory'}
              />
            ) : (
              <div className="lightbox-embed-wrap">
                {selectedItem.url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/) ? (
                  <iframe
                    title="Video player"
                    src={`https://www.youtube-nocookie.com/embed/${
                      selectedItem.url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)[1]
                    }`}
                    allowFullScreen
                  />
                ) : (
                  <div className="external-link-view">
                    <p>This media is hosted on an external album or site.</p>
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="button primary"
                    >
                      Open Link ↗
                    </a>
                  </div>
                )}
              </div>
            )}
            {selectedItem.caption && (
              <p className="lightbox-caption">{selectedItem.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <Modal
          isOpen={Boolean(editingItem)}
          onClose={() => !isUpdating && setEditingItem(null)}
          title="Edit Gallery Item"
          maxWidth="460px"
        >
          <form className="form" onSubmit={handleSaveEdit}>
            <label style={{ gridColumn: 'span 2' }}>
              <span>Caption / Title</span>
              <input
                type="text"
                value={editCaption}
                disabled={isUpdating}
                onChange={(e) => setEditCaption(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Date</span>
              <input
                type="date"
                value={editDate}
                disabled={isUpdating}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <Button
                type="button"
                kind="secondary"
                disabled={isUpdating}
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation modal for delete */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Delete Media Item"
        message="Are you sure you want to delete this media item? It will be removed from the public gallery."
        confirmText="Delete"
      />
    </>
  )
}
