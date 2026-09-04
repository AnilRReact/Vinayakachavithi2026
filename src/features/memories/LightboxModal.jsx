import React from 'react'
import { isGoogleDriveUrl } from '../../lib/storage'
import { fmtDate } from '../../lib/formatters'

export function LightboxModal({ item, onClose }) {
  if (!item) return null

  const getYoutubeEmbed = (url) => {
    if (!url) return null
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${id}?autoplay=1`
      }
      if (url.includes('youtube.com/watch')) {
        const search = new URL(url).searchParams
        return `https://www.youtube.com/embed/${search.get('v')}?autoplay=1`
      }
      if (url.includes('youtube.com/embed/')) {
        return url
      }
      return null
    } catch {
      return null
    }
  }

  const embedUrl = item.url ? getYoutubeEmbed(item.url) : null
  const isGdrive = isGoogleDriveUrl(item.url)
  const isDirectVideo =
    item.type === 'video' &&
    (item.url?.startsWith('data:video') ||
      item.url?.startsWith('blob:') ||
      item.url?.match(/\.(mp4|webm|ogg|mov)$/i) ||
      isGdrive)

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close lightbox">
          ✕
        </button>

        <div className="lightbox-media-wrapper">
          {item.type === 'video' ? (
            embedUrl ? (
              <iframe
                src={embedUrl}
                title={item.caption || 'Video'}
                className="lightbox-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isDirectVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="lightbox-video"
                playsInline
              />
            ) : (
              <video src={item.url} controls autoPlay className="lightbox-video" />
            )
          ) : (
            <img src={item.url} alt={item.caption || 'Memory'} className="lightbox-image" />
          )}
        </div>

        <div className="lightbox-meta">
          <h3 className="lightbox-caption">{item.caption || 'Festival Memory'}</h3>
          <small className="lightbox-date">📅 {fmtDate(item.date)}</small>
        </div>
      </div>
    </div>
  )
}
