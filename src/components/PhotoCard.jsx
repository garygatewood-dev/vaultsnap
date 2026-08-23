import { useEffect, useState } from 'react'
import { getSignedViewUrl } from '../lib/storage'
import { downloadFile } from '../lib/download'

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

  const [downloading, setDownloading] = useState(false)

  function handleThumbClick() {
    if (selectionMode) {
      onToggleSelect(photo.id)
    } else {
      onOpen(photo)
    }
  }

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      const fullUrl = await getSignedViewUrl(photo.storage_path)
      await downloadFile(fullUrl, photo.original_filename || 'photo')
    } catch (err) {
      console.error('Download failed', err)
    } finally {
      setDownloading(false)
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
          <button type="button" onClick={handleDownload} disabled={downloading} aria-label="Download">
            {downloading ? '…' : '⬇'}
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
