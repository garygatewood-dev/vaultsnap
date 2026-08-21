import { useEffect, useState } from 'react'
import { getSignedViewUrl } from '../lib/storage'

export default function PhotoCard({ photo, onOpen, onToggleFavorite, onDelete }) {
  const [thumbUrl, setThumbUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    getSignedViewUrl(photo.thumbnail_path)
      .then((url) => {
        if (!cancelled) setThumbUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [photo.thumbnail_path])

  return (
    <div className="photo-card">
      <button type="button" onClick={() => onOpen(photo)}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={photo.original_filename || 'Vault photo'} loading="lazy" />
        ) : (
          <div aria-hidden="true" />
        )}
      </button>
      <div className="photo-card-actions">
        <button type="button" onClick={() => onToggleFavorite(photo)}>
          {photo.is_favorite ? '★' : '☆'}
        </button>
        <button type="button" onClick={() => onDelete(photo)}>
          Delete
        </button>
      </div>
    </div>
  )
}
