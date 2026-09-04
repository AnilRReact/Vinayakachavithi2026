import React, { useState } from 'react'
import { Card } from '../../components/ui'
import { isGoogleDriveUrl, convertGoogleDriveLink } from '../../lib/storage'
import { fmtDate } from '../../lib/formatters'

export function NimajjanamCarousel({ items = [] }) {
  const [carouselIndex, setCarouselIndex] = useState(0)

  if (!items || items.length === 0) return null

  const currentItem = items[carouselIndex] || items[0]

  const getYoutubeEmbed = (url) => {
    if (!url) return null
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${id}`
      }
      if (url.includes('youtube.com/watch')) {
        const search = new URL(url).searchParams
        return `https://www.youtube.com/embed/${search.get('v')}`
      }
      if (url.includes('youtube.com/embed/')) {
        return url
      }
      return null
    } catch {
      return null
    }
  }

  const embedUrl = currentItem.url ? getYoutubeEmbed(currentItem.url) : null
  const isGdrive = isGoogleDriveUrl(currentItem.url)
  const isDirectVideo =
    currentItem.type === 'video' &&
    (currentItem.url?.startsWith('data:video') ||
      currentItem.url?.startsWith('blob:') ||
      currentItem.url?.match(/\.(mp4|webm|ogg|mov)$/i) ||
      isGdrive)

  return (
    <Card
      title="🎆 Grand Nimajjanam & Shobha Yatra Showcase"
      action={
        <div className="carousel-nav-controls">
          <button
            type="button"
            className="carousel-btn"
            onClick={() =>
              setCarouselIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
            }
            title="Previous video"
          >
            ◀ Prev
          </button>
          <span className="carousel-counter">
            {carouselIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            className="carousel-btn"
            onClick={() =>
              setCarouselIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
            }
            title="Next video"
          >
            Next ▶
          </button>
        </div>
      }
    >
      <div className="grand-carousel-container">
        <div className="carousel-media-frame">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={currentItem.caption || 'Nimajjanam Video'}
              className="carousel-video-player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isDirectVideo ? (
            <video
              src={currentItem.url}
              controls
              className="carousel-video-player"
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.caption || 'Nimajjanam Photo'}
              className="carousel-image-view"
            />
          )}
        </div>

        <div className="carousel-caption-bar">
          <div className="carousel-caption-text">
            <h4>{currentItem.caption || 'Grand Immersion Ceremony'}</h4>
            <small>📅 {fmtDate(currentItem.date)}</small>
          </div>
          <div className="carousel-dots">
            {items.map((it, idx) => (
              <button
                key={it.id || idx}
                type="button"
                className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                onClick={() => setCarouselIndex(idx)}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

