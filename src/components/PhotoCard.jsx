import { useEffect, useState } from 'react'
import { getSignedViewUrl } from '../lib/storage'

export default function PhotoCard({
  photo,
  onOpen,
  onToggleFavorite,
  onDelete,
  onMove,
  selectionMode,
  selected,
  onToggleSelect,
}) {
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

  function handleThumbClick() {
    if (selectionMode) {
      onToggleSelect(photo.id)
    } else {
      onOpen(photo)
    }
  }

  return (
    <div className="photo-card">
      <button type="button" className="photo-card-thumb" onClick={handleThumbClick}>
        {selectionMode && (
          <span className={`photo-card-checkbox ${selected ? 'checked' : ''}`} aria-hidden="true">
            {selected ? '✓' : ''}
          </span>
        )}
        {thumbUrl ? (
          <img src={thumbUrl} alt={photo.original_filename || 'Vault photo'} loading="lazy" />
        ) : (
          <div aria-hidden="true" />
        )}
      </button>
      {!selectionMode && (
        <div className="photo-card-actions">
          <button type="button" onClick={() => onToggleFavorite(photo)}>
            {photo.is_favorite ? '★' : '☆'}
          </button>
          <button type="button" onClick={() => onMove(photo)}>
            Move
          </button>
          <button type="button" onClick={() => onDelete(photo)}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
