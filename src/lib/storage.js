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

const DEFAULT_GDRIVE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbw3O382NowkBlPVFSfGbMEOM5SOw453GXbYLJQl5pmpFSTBfEHIvV2ok5UvoHH-wgIkEA/exec'

/**
 * Uploads an image or video to Google Drive via Google Apps Script Web App (if configured)
 */
export async function uploadToGoogleDrive(file, scriptUrl = DEFAULT_GDRIVE_WEBHOOK) {
  const targetUrl = scriptUrl || DEFAULT_GDRIVE_WEBHOOK

  let base64Data = ''
  let mimeType = file.type || 'image/jpeg'

  if (file.type?.startsWith('image/')) {
    const compressedBlob = await compressImage(file, 1400)
    const reader = new FileReader()
    base64Data = await new Promise((resolve, reject) => {
      reader.onload = () => {
        const res = reader.result
        const base64 = res.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(compressedBlob)
    })
    mimeType = 'image/jpeg'
  } else {
    // Video or other media file
    const reader = new FileReader()
    base64Data = await new Promise((resolve, reject) => {
      reader.onload = () => {
        const res = reader.result
        const base64 = res.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const payload = {
    base64: base64Data,
    filename: file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase(),
    mimeType
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
    redirect: 'follow'
  })

  let result = null
  const rawText = await response.text()
  try {
    result = JSON.parse(rawText)
  } catch {
    result = { url: rawText }
  }

  if (result.error) throw new Error(result.error)

  const directLink = result.url || (result.fileId ? `https://lh3.googleusercontent.com/d/${result.fileId}` : '') || convertGoogleDriveLink(result.fileUrl)
  if (!directLink) {
    throw new Error('Google Drive upload did not return a valid file URL.')
  }
  return directLink
}

/**
 * Universal Image Upload Handler:
 * 1. Tries Google Drive if Web App URL is configured
 * 2. Tries Supabase Storage if configured
 * 3. Falls back to compressed local Data URL
 */
export async function uploadImageToStorage(file, folder = 'general', maxDim = 1200) {
  if (!file) return null

  // 1. Check if Google Drive Webhook URL is in environment, settings or default
  const gdriveScriptUrl =
    import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
    localStorage.getItem('vv_gdrive_upload_url') ||
    DEFAULT_GDRIVE_WEBHOOK

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

/**
 * Universal Video Upload Handler:
 * 1. Tries Google Drive if configured
 * 2. Tries Supabase Storage if configured
 * 3. Fallback to Data URL / Blob URL for local offline playback
 */
export async function uploadVideoToStorage(file, folder = 'videos') {
  if (!file) return null

  // 1. Check if Google Drive Webhook URL is configured
  const gdriveScriptUrl =
    import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL ||
    localStorage.getItem('vv_gdrive_upload_url') ||
    DEFAULT_GDRIVE_WEBHOOK

  if (gdriveScriptUrl) {
    try {
      return await uploadToGoogleDrive(file, gdriveScriptUrl)
    } catch (err) {
      console.warn('Google Drive video upload error, attempting fallback:', err)
    }
  }

  // 2. Try Supabase Storage if available
  if (supabase) {
    try {
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()
      const ext = file.name.split('.').pop() || 'mp4'
      const path = `${folder}/${Date.now()}-${sanitizedName}`
      const contentType = file.type || `video/${ext}`

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(path, file, {
          contentType,
          upsert: true
        })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('gallery').getPublicUrl(path)
        if (publicUrlData?.publicUrl) return publicUrlData.publicUrl
      }
    } catch (err) {
      console.warn('Supabase video upload error, using local fallback:', err)
    }
  }

  // 3. Fallback to base64 / Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

