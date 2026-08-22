import { useState } from 'react'
import { updatePhotosAlbum } from '../lib/photos'
import { createAlbum } from '../lib/albums'

export default function MoveToAlbumModal({ photoIds, albums, userId, currentAlbumId, onMoved, onClose }) {
  const [newAlbumName, setNewAlbumName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleMoveTo(albumId) {
    setError(null)
    setBusy(true)
    try {
      await updatePhotosAlbum(photoIds, albumId)
      onMoved()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleCreateAndMove(e) {
    e.preventDefault()
    const name = newAlbumName.trim()
    if (!name) return
    setError(null)
    setBusy(true)
    try {
      const album = await createAlbum(userId, name)
      await updatePhotosAlbum(photoIds, album.id)
      onMoved()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="paywall-overlay">
      <div className="paywall-card">
        <button type="button" className="paywall-dismiss" onClick={onClose} disabled={busy} aria-label="Close">
          ×
        </button>
        <h1>Move {photoIds.length > 1 ? `${photoIds.length} photos` : 'photo'}</h1>

        <div className="move-album-list">
          <button type="button" onClick={() => handleMoveTo(null)} disabled={busy || currentAlbumId === null}>
            No album (Unsorted)
          </button>
          {albums.map((album) => (
            <button
              type="button"
              key={album.id}
              onClick={() => handleMoveTo(album.id)}
              disabled={busy || currentAlbumId === album.id}
            >
              {album.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateAndMove}>
          <input
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="New album name"
            disabled={busy}
          />
          <button type="submit" disabled={busy || !newAlbumName.trim()}>
            Create &amp; move
          </button>
        </form>

        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  )
}
