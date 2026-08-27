import { requireSupabase } from './supabase'

export async function compressImage(file, maxDim = 800, quality = 0.82) {
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
 * Compresses and uploads an image file to Supabase Storage bucket 'gallery'.
 * Returns the public URL.
 */
export async function uploadImageToStorage(file, folder = 'general', maxDim = 800) {
  if (!file) return null
  const client = requireSupabase()
  const compressedBlob = await compressImage(file, maxDim)
  const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase()
  const path = `${folder}/${Date.now()}-${sanitizedName}.jpg`

  const { error: uploadError } = await client.storage
    .from('gallery')
    .upload(path, compressedBlob, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (uploadError) throw uploadError

  const { data: publicUrlData } = client.storage
    .from('gallery')
    .getPublicUrl(path)

  return publicUrlData.publicUrl
}

