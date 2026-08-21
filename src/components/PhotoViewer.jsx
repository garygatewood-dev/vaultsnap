import { useEffect, useState } from 'react'
import { getSignedViewUrl } from '../lib/storage'

const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|webm|m4v)$/i

export default function PhotoViewer({ photo, onClose }) {
  const [url, setUrl] = useState(null)
  const isVideo = VIDEO_EXTENSION_PATTERN.test(photo.storage_path)

  useEffect(() => {
    let cancelled = false
    getSignedViewUrl(photo.storage_path)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [photo.storage_path])

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose}>
        Close
      </button>
      {url ? (
        isVideo ? (
          <video src={url} controls autoPlay />
        ) : (
          <img src={url} alt={photo.original_filename || 'Vault photo'} />
        )
      ) : (
        <p>Loading…</p>
      )}
    </div>
  )
}
