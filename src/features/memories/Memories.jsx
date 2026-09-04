import React, { useState, useMemo } from 'react'
import { NimajjanamCarousel } from './NimajjanamCarousel'
import { MediaUploadSection } from './MediaUploadSection'
import { MediaGalleryGrid } from './MediaGalleryGrid'
import { LightboxModal } from './LightboxModal'
import { today } from '../../lib/formatters'

export function Memories({ data, admin, add, update, remove }) {
  const galleryItems = data.gallery_items || []
  const [selectedLightboxItem, setSelectedLightboxItem] = useState(null)

  // Dedicated Immersion & Shobha Yatra highlights
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

  return (
    <div className="memories-feature-container">
      {/* 1. Grand Nimajjanam Video Showcase Carousel */}
      <NimajjanamCarousel items={immersionItems} />

      {/* 2. Media Upload Form (Google Drive Cloud Routing) */}
      {admin && <MediaUploadSection add={add} />}

      {/* 3. Photo & Video Gallery Grid */}
      <MediaGalleryGrid
        items={galleryItems}
        admin={admin}
        update={update}
        remove={remove}
        onSelectLightbox={(item) => setSelectedLightboxItem(item)}
      />

      {/* 4. Full-screen Lightbox Playback Modal */}
      {selectedLightboxItem && (
        <LightboxModal
          item={selectedLightboxItem}
          onClose={() => setSelectedLightboxItem(null)}
        />
      )}
    </div>
  )
}
