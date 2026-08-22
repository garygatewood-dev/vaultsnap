import { useEffect, useState } from 'react'
import { getSignedViewUrl } from '../lib/storage'

function PhotoListRow({
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

  const date = photo.created_at ? new Date(photo.created_at).toLocaleDateString() : ''

  function handleRowClick() {
    if (selectionMode) {
      onToggleSelect(photo.id)
    } else {
      onOpen(photo)
    }
  }

  return (
    <div className="photo-list-row">
      {selectionMode && (
        <span className={`photo-list-checkbox ${selected ? 'checked' : ''}`} aria-hidden="true">
          {selected ? '✓' : ''}
        </span>
      )}
      <button type="button" className="photo-list-thumb" onClick={handleRowClick}>
        {thumbUrl ? <img src={thumbUrl} alt="" loading="lazy" /> : <div aria-hidden="true" />}
      </button>
      <button type="button" className="photo-list-name" onClick={handleRowClick}>
        {photo.original_filename || 'Untitled'}
      </button>
      <span className="photo-list-date">{date}</span>
      {!selectionMode && (
        <div className="photo-list-actions">
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

export default function PhotoList({
  photos,
  onOpen,
  onToggleFavorite,
  onDelete,
  onMove,
  selectionMode,
  selectedIds,
  onToggleSelect,
}) {
  if (!photos.length) {
    return <p>No photos yet.</p>
  }

  return (
    <div className="photo-list">
      {photos.map((photo) => (
        <PhotoListRow
          key={photo.id}
          photo={photo}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
          onMove={onMove}
          selectionMode={selectionMode}
          selected={selectedIds?.has(photo.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}
