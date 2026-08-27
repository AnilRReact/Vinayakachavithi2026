import { useState, useMemo, useEffect } from 'react'
import { Card, Empty, Button, Modal, ConfirmModal } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { fetchMusicMetadata, detectPlatform } from '../../lib/musicMetadata'
import { useToast } from '../../context/ToastContext'
import ganeshIdol2026 from '../../assets/ganesh-idol-2026.jpg'

export function Music({ data, admin, add, update, remove }) {
  const { toast } = useToast()
  const tracksList = data.music_playlist || []

  // Active playing track state
  const [activeTrack, setActiveTrack] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activePlatformFilter, setActivePlatformFilter] = useState('all')

  // Add Song Form State
  const [inputUrl, setInputUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [addedBy, setAddedBy] = useState('')
  const [language, setLanguage] = useState('Telugu')
  const [isFetchingMeta, setIsFetchingMeta] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [detectedPlatform, setDetectedPlatform] = useState('')

  // Edit Track State
  const [editingTrack, setEditingTrack] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [editAddedBy, setEditAddedBy] = useState('')
  const [editThumbnail, setEditThumbnail] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete Confirm State
  const [trackToDelete, setTrackToDelete] = useState(null)

  // Auto-fetch metadata whenever inputUrl changes (with debounce)
  useEffect(() => {
    if (!inputUrl.trim() || inputUrl.length < 8) {
      setDetectedPlatform('')
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      setIsFetchingMeta(true)
      try {
        const meta = await fetchMusicMetadata(inputUrl)
        if (isMounted && meta) {
          setDetectedPlatform(meta.platform)
          if (!title) setTitle(meta.title || '')
          if (!artist) setArtist(meta.artist || '')
          if (meta.thumbnail && !thumbnailUrl) setThumbnailUrl(meta.thumbnail)
        }
      } finally {
        if (isMounted) setIsFetchingMeta(false)
      }
    }, 450)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [inputUrl])

  // Sort tracks
  const sortedTracks = useMemo(() => {
    return [...tracksList].sort(
      (a, b) =>
        Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
        String(a.title || '').localeCompare(String(b.title || ''))
    )
  }, [tracksList])

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return sortedTracks.filter((track) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        track.title?.toLowerCase().includes(q) ||
        track.artist?.toLowerCase().includes(q) ||
        track.added_by?.toLowerCase().includes(q) ||
        track.language?.toLowerCase().includes(q)

      const platform = detectPlatform(track.audio_url || '')
      const matchesPlatform =
        activePlatformFilter === 'all' ||
        (activePlatformFilter === 'spotify' && platform === 'spotify') ||
        (activePlatformFilter === 'youtube' && platform === 'youtube') ||
        (activePlatformFilter === 'audio' && platform === 'audio')

      return matchesSearch && matchesPlatform
    })
  }, [sortedTracks, searchQuery, activePlatformFilter])

  const handleAddTrack = async (e) => {
    e.preventDefault()
    if (!inputUrl.trim()) {
      toast.error('Please paste a song link (Spotify, YouTube, or Audio URL).')
      return
    }
    if (!title.trim()) {
      toast.error('Please enter a track title.')
      return
    }

    setIsSaving(true)
    try {
      const platform = detectPlatform(inputUrl.trim())
      const finalAddedBy = addedBy.trim() || (admin ? 'Utsava Committee' : 'Devotee')

      const err = await add('music_playlist', {
        title: title.trim(),
        artist: artist.trim() || 'Devotional Singer',
        audio_url: inputUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        added_by: finalAddedBy,
        language: language.trim() || 'Telugu',
        platform,
        sort_order: sortedTracks.length + 1
      })

      if (err) throw err

      toast.success(`🎶 "${title}" added to festival playlist by ${finalAddedBy}!`)
      setInputUrl('')
      setTitle('')
      setArtist('')
      setThumbnailUrl('')
      setAddedBy('')
      setDetectedPlatform('')
    } catch (err) {
      toast.error(err.message || 'Failed to add song.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenEdit = (track) => {
    setEditingTrack(track)
    setEditTitle(track.title || '')
    setEditArtist(track.artist || '')
    setEditAddedBy(track.added_by || '')
    setEditThumbnail(track.thumbnail_url || '')
    setEditUrl(track.audio_url || '')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingTrack) return
    setIsUpdating(true)
    try {
      const err = await update('music_playlist', editingTrack.id, {
        ...editingTrack,
        title: editTitle.trim() || editingTrack.title,
        artist: editArtist.trim() || editingTrack.artist,
        added_by: editAddedBy.trim() || editingTrack.added_by,
        thumbnail_url: editThumbnail.trim() || null,
        audio_url: editUrl.trim() || editingTrack.audio_url
      })
      if (err) throw err

      toast.success('Track details updated!')
      if (activeTrack?.id === editingTrack.id) {
        setActiveTrack({
          ...activeTrack,
          title: editTitle.trim(),
          artist: editArtist.trim(),
          added_by: editAddedBy.trim(),
          thumbnail_url: editThumbnail.trim()
        })
      }
      setEditingTrack(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update song.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!trackToDelete) return
    const err = await remove('music_playlist', trackToDelete.id)
    if (err) {
      toast.error(err.message || 'Failed to remove song.')
    } else {
      toast.success(`Removed "${trackToDelete.title}" from playlist.`)
      if (activeTrack?.id === trackToDelete.id) {
        setActiveTrack(null)
      }
    }
    setTrackToDelete(null)
  }

  return (
    <>
      {/* 1. Spotify & Apple Music style Now Playing Player */}
      {activeTrack && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-pulsing-badge" style={{ background: '#16a34a', color: '#fff', fontSize: '0.74rem', padding: '3px 8px', borderRadius: '999px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                  NOW PLAYING
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#7c2414' }}>
                  {activeTrack.title}
                </span>
              </div>

              <Button
                type="button"
                size="small"
                kind="secondary"
                onClick={() => setActiveTrack(null)}
                title="Close player"
              >
                ✕ Close Player
              </Button>
            </div>
          }
        >
          <div className="now-playing-box" style={{ background: 'linear-gradient(135deg, #1c0504 0%, #380a08 100%)', padding: '16px', borderRadius: '12px', color: '#fff', border: '2px solid #d7952f', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '16px', alignItems: 'center' }}>
              {/* Artwork */}
              <div style={{ width: '110px', height: '110px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #d7952f', background: '#000', flexShrink: 0 }}>
                <img
                  src={activeTrack.thumbnail_url || ganeshIdol2026}
                  alt={activeTrack.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Track Info & Player Controls */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: '0 0 2px', fontSize: '1.25rem', color: '#fff' }}>
                    {activeTrack.title}
                  </h3>
                  {activeTrack.platform === 'spotify' && (
                    <span style={{ background: '#1db954', color: '#000', fontSize: '0.7rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                      SPOTIFY
                    </span>
                  )}
                  {activeTrack.platform === 'youtube' && (
                    <span style={{ background: '#ff0000', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                      YOUTUBE
                    </span>
                  )}
                </div>

                <p style={{ margin: '2px 0 6px', color: '#fed7aa', fontSize: '0.92rem' }}>
                  🎤 <b>{activeTrack.artist || 'Devotional Singer'}</b>
                  {activeTrack.language ? ` · 🌐 ${activeTrack.language}` : ''}
                </p>

                {/* Attribution Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 248, 230, 0.12)', border: '1px solid #d7952f', borderRadius: '999px', padding: '3px 10px', fontSize: '0.8rem', color: '#ffe0a0' }}>
                  <span>🙏 Added by:</span>
                  <strong style={{ color: '#fff' }}>{activeTrack.added_by || 'Utsava Committee'}</strong>
                </div>

                {/* Interactive Player Embeds */}
                <div style={{ marginTop: '12px' }}>
                  {activeTrack.audio_url?.includes('spotify.com') ? (
                    <iframe
                      src={
                        activeTrack.audio_url.replace(
                          /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
                          'open.spotify.com/embed/$1/$2'
                        )
                      }
                      width="100%"
                      height="80"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{ borderRadius: '8px' }}
                    />
                  ) : activeTrack.audio_url?.includes('youtu') ? (
                    <div style={{ maxWidth: '400px', aspectRatio: '16 / 9', borderRadius: '8px', overflow: 'hidden' }}>
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${
                          (activeTrack.audio_url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/) || [])[1] || ''
                        }?autoplay=1`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <audio
                      src={activeTrack.audio_url}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '36px' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Main Playlist Card */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🎵</span>
              <span>Devotional Music & Bhajans</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#7c2414', fontWeight: '700' }}>
              {tracksList.length} {tracksList.length === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>
        }
      >
        <p className="muted" style={{ marginTop: '-4px' }}>
          Lord Ganesha stotrams, dhandiya beats, and bhajan playlists curated for the pandal.
        </p>

        {/* Search & Platform Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 16px' }}>
          <input
            type="text"
            placeholder="🔍 Search by song, singer, or devotee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1 1 240px', padding: '8px 12px', fontSize: '0.9rem' }}
          />

          <div className="media-tabs" style={{ margin: 0 }}>
            <button
              type="button"
              className={activePlatformFilter === 'all' ? 'active' : ''}
              onClick={() => setActivePlatformFilter('all')}
            >
              All ({tracksList.length})
            </button>
            <button
              type="button"
              className={activePlatformFilter === 'spotify' ? 'active' : ''}
              onClick={() => setActivePlatformFilter('spotify')}
            >
              🟢 Spotify
            </button>
            <button
              type="button"
              className={activePlatformFilter === 'youtube' ? 'active' : ''}
              onClick={() => setActivePlatformFilter('youtube')}
            >
              🔴 YouTube
            </button>
            <button
              type="button"
              className={activePlatformFilter === 'audio' ? 'active' : ''}
              onClick={() => setActivePlatformFilter('audio')}
            >
              🎵 Audio Files
            </button>
          </div>
        </div>

        {/* Spotify-style Track List */}
        <div className="music-track-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTracks.map((track, index) => {
            const isPlaying = activeTrack?.id === track.id
            const platform = detectPlatform(track.audio_url || '')

            return (
              <div
                key={track.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isPlaying ? '#fef3c7' : '#ffffff',
                  border: isPlaying ? '2px solid #d97706' : '1px solid #e7e5e4',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Track Number & Play Button */}
                <button
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 0,
                    background: isPlaying ? '#d97706' : '#7c2414',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(124, 36, 20, 0.25)'
                  }}
                  title="Play Track"
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Album / Song Thumbnail */}
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#292524', flexShrink: 0 }}>
                  <img
                    src={track.thumbnail_url || ganeshIdol2026}
                    alt={track.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>

                {/* Track Details & Added By Badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.98rem', color: isPlaying ? '#92400e' : '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </strong>
                    {platform === 'spotify' && (
                      <span style={{ background: '#e8f5e9', color: '#1b5e20', fontSize: '0.68rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                        SPOTIFY
                      </span>
                    )}
                    {platform === 'youtube' && (
                      <span style={{ background: '#ffebee', color: '#c62828', fontSize: '0.68rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', border: '1px solid #ffcdd2' }}>
                        YOUTUBE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#57534e' }}>
                    <span>🎤 {track.artist || 'Devotional Singer'}</span>
                    {track.language && <span>· 🌐 {track.language}</span>}

                    {/* Attribution Tag */}
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: '999px', fontWeight: '700', fontSize: '0.76rem', border: '1px solid #fde68a' }}>
                      👤 Added by: <b>{track.added_by || 'Utsava Committee'}</b>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a
                    href={track.audio_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      borderRadius: '6px',
                      background: '#f5f5f4',
                      color: '#44403c',
                      textDecoration: 'none',
                      border: '1px solid #d6d3d1'
                    }}
                    title="Open on Spotify / YouTube"
                  >
                    Open ↗
                  </a>

                  {admin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(track)}
                        style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                        title="Edit Song Details"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackToDelete(track)}
                        style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #f87171', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                        title="Delete Song"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {!filteredTracks.length && (
            <Empty>
              {searchQuery ? 'No songs match your search query.' : 'No tracks added yet. Use the form below to add devotional songs!'}
            </Empty>
          )}
        </div>
      </Card>

      {/* 3. Add Song with Live Link Detector & Metadata Extraction */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>➕</span>
            <span>Add / Dedicate a Devotional Song</span>
          </div>
        }
      >
        <p className="muted" style={{ marginTop: '-4px' }}>
          Paste a <b>Spotify</b>, <b>YouTube</b>, or audio link — song details and album artwork will be extracted automatically!
        </p>

        <form onSubmit={handleAddTrack} className="form" style={{ marginTop: '12px' }}>
          {/* Link Input */}
          <label style={{ gridColumn: 'span 2' }}>
            <span>
              Song Link (Spotify Track/Album, YouTube URL, or Audio Link) <span className="req-star">*</span>
            </span>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                required
                placeholder="Paste link e.g. https://open.spotify.com/track/... or https://youtube.com/watch?v=..."
                value={inputUrl}
                disabled={isSaving}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              {isFetchingMeta && (
                <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '0.82rem', color: '#d97706', fontWeight: '700' }}>
                  ✨ Fetching song details…
                </span>
              )}
            </div>
          </label>

          {/* Auto-extracted Preview Card if available */}
          {thumbnailUrl && (
            <div
              style={{
                gridColumn: 'span 2',
                background: '#fdf8f0',
                border: '1.5px solid #d7952f',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center'
              }}
            >
              <img
                src={thumbnailUrl}
                alt="Detected Album Art"
                style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#7c2414', textTransform: 'uppercase' }}>
                  ✓ AUTO-DETECTED FROM {detectedPlatform?.toUpperCase() || 'LINK'}
                </span>
                <h4 style={{ margin: '2px 0', fontSize: '1rem', color: '#1c1917' }}>{title || 'Devotional Song'}</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#57534e' }}>🎤 {artist || 'Devotional Singer'}</p>
              </div>
            </div>
          )}

          {/* Song Title & Artist */}
          <label>
            <span>Song Title <span className="req-star">*</span></span>
            <input
              type="text"
              required
              placeholder="e.g. Ganapathi Bappa Morya"
              value={title}
              disabled={isSaving}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            <span>Artist / Singer / Album</span>
            <input
              type="text"
              placeholder="e.g. S.P. Balasubrahmanyam"
              value={artist}
              disabled={isSaving}
              onChange={(e) => setArtist(e.target.value)}
            />
          </label>

          {/* Added by Devotee Name (Required attribution) */}
          <label>
            <span>
              Added / Dedicated By (Your Name) <span className="req-star">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh (Ward 3), Anil, Devotee Family"
              value={addedBy}
              disabled={isSaving}
              onChange={(e) => setAddedBy(e.target.value)}
            />
          </label>

          {/* Language / Category */}
          <label>
            <span>Language / Category</span>
            <input
              type="text"
              placeholder="e.g. Telugu, Hindi, Sanskrit, Dappu Beat"
              value={language}
              disabled={isSaving}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </label>

          {/* Thumbnail image URL (Optional manual override) */}
          <label style={{ gridColumn: 'span 2' }}>
            <span>Album Artwork / Thumbnail Image URL (Optional)</span>
            <input
              type="url"
              placeholder="https://... (auto-filled from Spotify / YouTube)"
              value={thumbnailUrl}
              disabled={isSaving}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </label>

          <div style={{ gridColumn: 'span 2', textAlign: 'right', marginTop: '6px' }}>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Adding Song…' : '🎶 Add Song to Playlist'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Edit Track Modal */}
      {editingTrack && (
        <Modal
          isOpen={Boolean(editingTrack)}
          onClose={() => !isUpdating && setEditingTrack(null)}
          title="✏️ Edit Song Details"
          maxWidth="500px"
        >
          <form onSubmit={handleSaveEdit} className="form">
            <label style={{ gridColumn: 'span 2' }}>
              <span>Song Title</span>
              <input
                type="text"
                required
                value={editTitle}
                disabled={isUpdating}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>

            <label>
              <span>Artist / Singer</span>
              <input
                type="text"
                value={editArtist}
                disabled={isUpdating}
                onChange={(e) => setEditArtist(e.target.value)}
              />
            </label>

            <label>
              <span>Added By</span>
              <input
                type="text"
                value={editAddedBy}
                disabled={isUpdating}
                onChange={(e) => setEditAddedBy(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Audio / Spotify / YouTube URL</span>
              <input
                type="url"
                required
                value={editUrl}
                disabled={isUpdating}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </label>

            <label style={{ gridColumn: 'span 2' }}>
              <span>Thumbnail / Artwork URL</span>
              <input
                type="url"
                value={editThumbnail}
                disabled={isUpdating}
                onChange={(e) => setEditThumbnail(e.target.value)}
              />
            </label>

            <div className="modal-actions" style={{ gridColumn: 'span 2', marginTop: '12px' }}>
              <Button
                type="button"
                kind="secondary"
                disabled={isUpdating}
                onClick={() => setEditingTrack(null)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(trackToDelete)}
        onClose={() => setTrackToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Song from Playlist"
        message={`Are you sure you want to remove "${trackToDelete?.title}"?`}
        confirmText="Remove Song"
      />
    </>
  )
}
