import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { listPhotos, toggleFavorite, deletePhotoRecord } from '../lib/photos'
import { listAlbums, createAlbum, renameAlbum, deleteAlbum } from '../lib/albums'
import { removeFiles } from '../lib/storage'
import PhotoGrid from '../components/PhotoGrid'
import PhotoViewer from '../components/PhotoViewer'
import AlbumSidebar from '../components/AlbumSidebar'
import SearchBar from '../components/SearchBar'
import UploadButton from '../components/UploadButton'

export default function Vault() {
  const { user, signOut } = useAuth()
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  // null = all photos, 'favorites' = favorites view, otherwise an album id
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [search, setSearch] = useState('')
  const [viewingPhoto, setViewingPhoto] = useState(null)
  const [error, setError] = useState(null)

  const loadAlbums = useCallback(async () => {
    try {
      setAlbums(await listAlbums())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const loadPhotos = useCallback(async () => {
    try {
      const filters = {}
      if (selectedAlbumId === 'favorites') {
        filters.favoritesOnly = true
      } else if (selectedAlbumId) {
        filters.albumId = selectedAlbumId
      }
      if (search.trim()) filters.search = search.trim()
      setPhotos(await listPhotos(filters))
    } catch (err) {
      setError(err.message)
    }
  }, [selectedAlbumId, search])

  useEffect(() => {
    loadAlbums()
  }, [loadAlbums])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  async function handleToggleFavorite(photo) {
    try {
      await toggleFavorite(photo.id, !photo.is_favorite)
      loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(photo) {
    if (!window.confirm('Delete this photo permanently?')) return
    try {
      await removeFiles([photo.storage_path, photo.thumbnail_path].filter(Boolean))
      await deletePhotoRecord(photo.id)
      loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateAlbum(name) {
    try {
      await createAlbum(user.id, name)
      loadAlbums()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRenameAlbum(albumId, name) {
    try {
      await renameAlbum(albumId, name)
      loadAlbums()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteAlbum(albumId) {
    if (!window.confirm('Delete this album? Photos inside will become unsorted.')) return
    try {
      await deleteAlbum(albumId)
      if (selectedAlbumId === albumId) setSelectedAlbumId(null)
      loadAlbums()
      loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  const uploadAlbumId = selectedAlbumId === 'favorites' ? null : selectedAlbumId

  return (
    <div className="vault-layout">
      <AlbumSidebar
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onSelect={setSelectedAlbumId}
        onCreate={handleCreateAlbum}
        onRename={handleRenameAlbum}
        onDelete={handleDeleteAlbum}
      />

      <main>
        <header className="vault-header">
          <h1>Your vault</h1>
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </header>

        <div className="vault-toolbar">
          <SearchBar value={search} onChange={setSearch} />
          <UploadButton albumId={uploadAlbumId} onUploaded={loadPhotos} />
        </div>

        {error && <p role="alert">{error}</p>}

        <PhotoGrid
          photos={photos}
          onOpen={setViewingPhoto}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
      </main>

      {viewingPhoto && <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />}
    </div>
  )
}
