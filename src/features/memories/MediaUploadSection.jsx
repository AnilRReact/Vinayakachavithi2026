import React, { useState } from 'react'
import { Card, Button } from '../../components/ui'
import { uploadImageToStorage, uploadVideoToStorage } from '../../lib/storage'
import { today } from '../../lib/formatters'
import { useToast } from '../../context/ToastContext'

export function MediaUploadSection({ add }) {
  const { toast } = useToast()

  // 'photo' | 'video' | 'link'
  const [mediaMode, setMediaMode] = useState('photo')

  // Photo state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoDate, setPhotoDate] = useState(today())
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Video file state
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [videoCaption, setVideoCaption] = useState('')
  const [videoDate, setVideoDate] = useState(today())
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  // Web link state
  const [linkUrl, setLinkUrl] = useState('')
  const [linkCaption, setLinkCaption] = useState('')
  const [linkDate, setLinkDate] = useState(today())
  const [isSavingLink, setIsSavingLink] = useState(false)

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleUploadPhoto = async (e) => {
    e.preventDefault()
    if (!photoFile) {
      toast.error('Please select a photo file.')
      return
    }

    setIsUploadingPhoto(true)
    try {
      const url = await uploadImageToStorage(photoFile, 'gallery', 1400)
      if (!url) throw new Error('Photo upload failed.')

      const err = await add('gallery_items', {
        type: 'photo',
        url,
        caption: photoCaption.trim() || 'Festival Memory',
        date: photoDate || today()
      })

      if (err) throw err

      toast.success('📸 Photo saved to gallery & Google Drive!')
      setPhotoFile(null)
      setPhotoPreview('')
      setPhotoCaption('')
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleUploadVideo = async (e) => {
    e.preventDefault()
    if (!videoFile) {
      toast.error('Please choose a video file.')
      return
    }

    setIsUploadingVideo(true)
    try {
      const url = await uploadVideoToStorage(videoFile, 'videos')
      if (!url) throw new Error('Video upload failed.')

      const err = await add('gallery_items', {
        type: 'video',
        url,
        caption: videoCaption.trim() || 'Festival Video Highlight',
        date: videoDate || today()
      })

      if (err) throw err

      toast.success('🎥 Video saved to gallery & Google Drive!')
      setVideoFile(null)
      setVideoPreview('')
      setVideoCaption('')
    } catch (err) {
      toast.error(err.message || 'Failed to upload video.')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const handleSaveLink = async (e) => {
    e.preventDefault()
    if (!linkUrl.trim()) {
      toast.error('Please paste a YouTube or video URL.')
      return
    }

    setIsSavingLink(true)
    try {
      const err = await add('gallery_items', {
        type: 'video',
        url: linkUrl.trim(),
        caption: linkCaption.trim() || 'Festival Video',
        date: linkDate || today()
      })

      if (err) throw err

      toast.success('🔗 Video link added to gallery!')
      setLinkUrl('')
      setLinkCaption('')
    } catch (err) {
      toast.error(err.message || 'Failed to add video link.')
    } finally {
      setIsSavingLink(false)
    }
  }

  return (
    <Card title="Upload Photo & Video Memories (ఫోటోలు & వీడియోల నమోదు)">
      <div className="media-mode-tabs">
        <button
          type="button"
          className={`mode-tab-btn ${mediaMode === 'photo' ? 'active' : ''}`}
          onClick={() => setMediaMode('photo')}
        >
          📷 Upload Photo
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${mediaMode === 'video' ? 'active' : ''}`}
          onClick={() => setMediaMode('video')}
        >
          🎥 Upload Video File (Choose File)
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${mediaMode === 'link' ? 'active' : ''}`}
          onClick={() => setMediaMode('link')}
        >
          🔗 YouTube / Web Link
        </button>
      </div>

      {/* Mode 1: Photo Upload */}
      {mediaMode === 'photo' && (
        <form onSubmit={handleUploadPhoto} className="media-upload-form">
          <div className="dropzone-area">
            <input
              type="file"
              accept="image/*"
              id="gallery-photo-input"
              onChange={handlePhotoSelect}
              className="file-input-hidden"
            />
            <label htmlFor="gallery-photo-input" className="dropzone-label">
              {photoPreview ? (
                <div className="preview-container">
                  <img src={photoPreview} alt="Preview" className="media-preview-box" />
                  <span className="change-btn">Change Photo</span>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <span className="dropzone-icon">📷</span>
                  <b>Click or Tap to Choose Photo</b>
                  <small>Auto-synced to Google Drive cloud storage</small>
                </div>
              )}
            </label>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label>Caption / Memory Title (వివరణ)</label>
              <input
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="e.g. Day 1 Ganapathi Homam & Abhishekham"
              />
            </div>
            <div className="form-group">
              <label>Date (తేదీ)</label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isUploadingPhoto || !photoFile}>
            {isUploadingPhoto ? 'Uploading to Google Drive…' : '☁️ Upload Photo to Google Drive'}
          </Button>
        </form>
      )}

      {/* Mode 2: Direct Video File Upload */}
      {mediaMode === 'video' && (
        <form onSubmit={handleUploadVideo} className="media-upload-form">
          <div className="dropzone-area">
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
              id="gallery-video-input"
              onChange={handleVideoSelect}
              className="file-input-hidden"
            />
            <label htmlFor="gallery-video-input" className="dropzone-label">
              {videoPreview ? (
                <div className="preview-container">
                  <video
                    src={videoPreview}
                    controls
                    className="media-preview-box"
                    style={{ maxHeight: '220px', width: '100%', borderRadius: '8px' }}
                  />
                  <span className="change-btn">Choose Different Video</span>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <span className="dropzone-icon">🎥</span>
                  <b>Click or Tap to Choose Video File (MP4, MOV, WEBM)</b>
                  <small>Transmits directly to your 15GB Google Drive</small>
                </div>
              )}
            </label>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label>Video Caption / Description (వివరణ)</label>
              <input
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="e.g. Grand Shobha Yatra & Fireworks Highlights"
              />
            </div>
            <div className="form-group">
              <label>Date (తేదీ)</label>
              <input
                type="date"
                value={videoDate}
                onChange={(e) => setVideoDate(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isUploadingVideo || !videoFile}>
            {isUploadingVideo ? 'Uploading Video to Google Drive…' : '☁️ Upload Video to Google Drive'}
          </Button>
        </form>
      )}

      {/* Mode 3: YouTube / Web Link */}
      {mediaMode === 'link' && (
        <form onSubmit={handleSaveLink} className="media-upload-form">
          <div className="form-group">
            <label>YouTube / Web Video URL *</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label>Video Caption</label>
              <input
                value={linkCaption}
                onChange={(e) => setLinkCaption(e.target.value)}
                placeholder="e.g. Maha Harathi & Live Bhajan Video"
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={linkDate}
                onChange={(e) => setLinkDate(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSavingLink || !linkUrl.trim()}>
            {isSavingLink ? 'Saving…' : 'Add Video Link'}
          </Button>
        </form>
      )}
    </Card>
  )
}
