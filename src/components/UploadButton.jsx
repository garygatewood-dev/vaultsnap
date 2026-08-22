import { useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { requestUploadUrls, uploadToSignedUrl } from '../lib/storage'
import { generateThumbnail } from '../lib/thumbnail'
import { createPhotoRecord } from '../lib/photos'

export default function UploadButton({ albumId, onUploaded, onCapReached }) {
  const { user } = useAuth()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    setUploading(true)
    setError(null)

    for (const file of files) {
      try {
        await uploadOne(file)
      } catch (err) {
        if (err.message === 'FREE_TIER_LIMIT_REACHED') {
          onCapReached?.()
          break
        }
        setError(err.message)
      }
    }

    setUploading(false)
    onUploaded()
  }

  async function uploadOne(file) {
    const extension = file.name.split('.').pop() || 'bin'
    const thumbnailBlob = await generateThumbnail(file)
    const { original, thumbnail } = await requestUploadUrls(extension)

    await Promise.all([
      uploadToSignedUrl(original.path, original.token, file),
      uploadToSignedUrl(thumbnail.path, thumbnail.token, thumbnailBlob),
    ])

    await createPhotoRecord({
      userId: user.id,
      storagePath: original.path,
      thumbnailPath: thumbnail.path,
      albumId,
      originalFilename: file.name,
    })
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFiles}
        disabled={uploading}
        style={{ display: 'none' }}
      />
      <button type="button" onClick={() => inputRef.current.click()} disabled={uploading}>
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
