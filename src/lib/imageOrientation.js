// Only JPEG carries EXIF orientation in the way phone cameras write it. PNG/WebP/HEIC
// either don't use it the same way or aren't reliably decodable via createImageBitmap
// across browsers regardless — out of scope here.
const JPEG_TYPES = new Set(['image/jpeg', 'image/jpg'])

// Reads just the EXIF orientation tag (1-8) from a JPEG's APP1 segment, without
// decoding the image. Returns null if the file isn't a JPEG or carries no
// orientation tag (both mean "nothing to correct").
export async function getJpegOrientation(file) {
  if (!JPEG_TYPES.has(file.type)) return null

  // EXIF headers live right after the JPEG SOI marker — no need to read the whole file.
  const buffer = await file.slice(0, 128 * 1024).arrayBuffer()
  const view = new DataView(buffer)

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return null

  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false)
    if ((marker & 0xff00) !== 0xff00) break

    const segmentLength = view.getUint16(offset + 2, false)

    if (marker === 0xffe1 && offset + 4 + segmentLength <= view.byteLength) {
      const exifStart = offset + 4
      const isExif =
        view.getUint32(exifStart, false) === 0x45786966 && view.getUint16(exifStart + 4, false) === 0x0000
      if (!isExif) return null

      const tiffStart = exifStart + 6
      const little = view.getUint16(tiffStart, false) === 0x4949
      const firstIfdOffset = view.getUint32(tiffStart + 4, little)
      const dirStart = tiffStart + firstIfdOffset
      if (dirStart + 2 > view.byteLength) return null

      const entryCount = view.getUint16(dirStart, little)
      for (let i = 0; i < entryCount; i++) {
        const entryOffset = dirStart + 2 + i * 12
        if (entryOffset + 10 > view.byteLength) break
        const tag = view.getUint16(entryOffset, little)
        if (tag === 0x0112) {
          return view.getUint16(entryOffset + 8, little)
        }
      }
      return null
    }

    if (marker === 0xffda) break // Start of Scan — no metadata segments follow this
    offset += 2 + segmentLength
  }

  return null
}

// Re-encodes the file with orientation baked into the pixels, matching what
// generateThumbnail() already does — but only when actually needed, to avoid
// quality loss on the (likely common) files that don't have a rotation tag.
export async function normalizeOrientation(file) {
  const orientation = await getJpegOrientation(file)
  if (!orientation || orientation === 1) {
    return file
  }

  const bitmap = await createImageBitmap(file) // respects EXIF by default — returns upright pixels
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          : reject(new Error('Failed to normalize image orientation')),
      'image/jpeg',
      0.95,
    )
  })
}
