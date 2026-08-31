import { supabase } from './supabase'

/**
 * Converts a Google Drive share link into a direct high-speed embed/CDN image URL.
 * Works for standard share links (https://drive.google.com/file/d/FILE_ID/view...)
 */
export function convertGoogleDriveLink(url = '') {
  if (!url || typeof url !== 'string') return url
  const clean = url.trim()

  // Match /file/d/ID or ?id=ID or /open?id=ID
  const match = clean.match(/(?:\/file\/d\/|id=|\/open\?id=|\/d\/)([a-zA-Z0-9_-]{25,})/)
  if (match && match[1]) {
    const fileId = match[1]
    // High-speed Google UserContent CDN URL (no CORS restrictions)
    return `https://lh3.googleusercontent.com/d/${fileId}`
  }

  return clean
}

/**
 * Checks if a URL is from Google Drive
 */
export function isGoogleDriveUrl(url = '') {
  if (!url) return false
  return url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('googleusercontent.com/d/')
}

/**
 * Compresses an image file in-browser using HTML Canvas
 */
export async function compressImage(file, maxDim = 1200, quality = 0.84) {
  const source = await createImageBitmap(file)
  const ratio = Math.min(1, maxDim / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * ratio)
  canvas.height = Math.round(source.height * ratio)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Image compression failed.'))
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Uploads an image to Google Drive via Google Apps Script Web App (if configured)
 */
export async function uploadToGoogleDrive(file, scriptUrl) {
  if (!scriptUrl) throw new Error('Google Apps Script URL is not configured.')

  const compressedBlob = await compressImage(file, 1400)
  const reader = new FileReader()

  const base64Data = await new Promise((resolve, reject) => {
    reader.onload = () => {
      const res = reader.result
      const base64 = res.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(compressedBlob)
  })

  const payload = {
    base64: base64Data,
    filename: file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase(),
    mimeType: 'image/jpeg'
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Google Drive upload failed with status ${response.status}`)
  }

  const result = await response.json()
  if (result.error) throw new Error(result.error)

  return result.url || convertGoogleDriveLink(result.fileUrl)
}

/**
 * Universal Image Upload Handler:
 * 1. Tries Google Drive if Web App URL is configured
 * 2. Tries Supabase Storage if configured
 * 3. Falls back to compressed local Data URL
 */
export async function uploadImageToStorage(file, folder = 'general', maxDim = 1200) {
  if (!file) return null

  // 1. Check if Google Drive Webhook URL is in environment or localStorage
  const gdriveScriptUrl =
    import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
    localStorage.getItem('vv_gdrive_upload_url')

  if (gdriveScriptUrl) {
    try {
      return await uploadToGoogleDrive(file, gdriveScriptUrl)
    } catch (err) {
      console.warn('Google Drive direct upload error, attempting fallback:', err)
    }
  }

  // 2. Try Supabase Storage if client is initialized
  if (supabase) {
    try {
      const compressedBlob = await compressImage(file, maxDim)
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()
      const path = `${folder}/${Date.now()}-${sanitizedName}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(path, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('gallery').getPublicUrl(path)
        if (publicUrlData?.publicUrl) return publicUrlData.publicUrl
      }
    } catch (err) {
      console.warn('Supabase storage upload error, using local fallback:', err)
    }
  }

  // 3. Fallback: return compressed base64 data URL
  const compressedBlob = await compressImage(file, 800, 0.8)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(compressedBlob)
  })
}
