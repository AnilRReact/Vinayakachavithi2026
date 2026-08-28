/**
 * Helper to extract platform, metadata, title, artist, and album artwork
 * from YouTube, YouTube Music, Spotify, SoundCloud, or direct audio links.
 */

export function extractYouTubeId(url = '') {
  if (!url) return null
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|music\.youtube\.com\/watch\?v=)([\w-]{11})/i
  const match = url.match(regex)
  return match ? match[1] : null
}

export function extractSpotifyDetails(url = '') {
  if (!url) return null
  const regex = /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/i
  const match = url.match(regex)
  if (match) {
    return {
      type: match[1],
      id: match[2],
      embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`
    }
  }
  return null
}

export function detectPlatform(url = '') {
  if (!url) return 'audio'
  const lower = url.toLowerCase()
  if (lower.includes('spotify.com')) return 'spotify'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('soundcloud.com')) return 'soundcloud'
  if (lower.includes('jiosaavn.com') || lower.includes('saavn.com')) return 'jiosaavn'
  if (lower.match(/\.(mp3|wav|m4a|aac|ogg)(\?.*)?$/i)) return 'audio'
  return 'web'
}

/**
 * Fetches oEmbed or auto-derives metadata for the pasted URL
 */
export async function fetchMusicMetadata(url = '') {
  if (!url || typeof url !== 'string') {
    return null
  }

  const cleanUrl = url.trim()
  const platform = detectPlatform(cleanUrl)

  // 1. YouTube / YouTube Music
  const ytId = extractYouTubeId(cleanUrl)
  if (ytId) {
    const thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    let title = 'Devotional Bhajan Track'
    let artist = 'Lord Ganesha Devotional'

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
      const res = await fetch(oembedUrl)
      if (res.ok) {
        const data = await res.json()
        if (data.title) title = data.title
        if (data.author_name) artist = data.author_name
      }
    } catch {
      // Fallback
    }

    return {
      platform: 'youtube',
      platformLabel: 'YouTube',
      title,
      artist,
      thumbnail,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
      audioUrl: cleanUrl
    }
  }

  // 2. Spotify
  const spotify = extractSpotifyDetails(cleanUrl)
  if (spotify) {
    let title = 'Spotify Devotional Track'
    let artist = 'Spotify Devotional'
    let thumbnail = ''

    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`
      const res = await fetch(oembedUrl)
      if (res.ok) {
        const data = await res.json()
        if (data.title) title = data.title
        if (data.thumbnail_url) thumbnail = data.thumbnail_url
        if (data.author_name) artist = data.author_name
      }
    } catch {
      // Fallback
    }

    return {
      platform: 'spotify',
      platformLabel: 'Spotify',
      title,
      artist,
      thumbnail: thumbnail || 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
      embedUrl: spotify.embedUrl,
      audioUrl: cleanUrl
    }
  }

  // 3. Direct Audio File (MP3, AAC, M4A)
  if (platform === 'audio') {
    let filename = cleanUrl.split('/').pop()?.split('?')[0] || 'Devotional Audio Track'
    try {
      filename = decodeURIComponent(filename).replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    } catch {
      // ignore
    }

    return {
      platform: 'audio',
      platformLabel: 'Direct Audio (MP3)',
      title: filename.charAt(0).toUpperCase() + filename.slice(1),
      artist: 'Devotional Recording',
      thumbnail: '',
      embedUrl: null,
      audioUrl: cleanUrl
    }
  }

  // 4. Generic Web Link
  return {
    platform: 'web',
    platformLabel: 'Web Link',
    title: 'Festival Track',
    artist: 'Devotional Playlist',
    thumbnail: '',
    embedUrl: null,
    audioUrl: cleanUrl
  }
}

