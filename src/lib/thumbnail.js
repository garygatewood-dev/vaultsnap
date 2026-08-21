const THUMB_MAX_DIMENSION = 400
const THUMB_QUALITY = 0.7

export async function generateThumbnail(file) {
  if (file.type.startsWith('video/')) {
    return generateVideoThumbnail(file)
  }
  return generateImageThumbnail(file)
}

async function generateImageThumbnail(file) {
  const bitmap = await createImageBitmap(file)
  return drawThumbnail(bitmap, bitmap.width, bitmap.height)
}

async function generateVideoThumbnail(file) {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = url
  video.muted = true
  video.playsInline = true

  try {
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve
      video.onerror = () => reject(new Error('Could not read video'))
    })
    video.currentTime = Math.min(0.1, video.duration || 0)
    await new Promise((resolve) => {
      video.onseeked = resolve
    })
    return await drawThumbnail(video, video.videoWidth, video.videoHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function drawThumbnail(source, width, height) {
  const scale = Math.min(1, THUMB_MAX_DIMENSION / Math.max(width, height))
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Thumbnail generation failed'))),
      'image/jpeg',
      THUMB_QUALITY,
    )
  })
}
