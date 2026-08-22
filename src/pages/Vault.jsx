import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { listPhotos, toggleFavorite, deletePhotoRecord, getPhotoCount } from '../lib/photos'
import { listAlbums, createAlbum, renameAlbum, deleteAlbum } from '../lib/albums'
import { removeFiles } from '../lib/storage'
import {
  getSubscription,
  isSubscriptionActive,
  createPortalSession,
  FREE_TIER_PHOTO_LIMIT,
} from '../lib/subscription'
import PhotoGrid from '../components/PhotoGrid'
import PhotoViewer from '../components/PhotoViewer'
import AlbumSidebar from '../components/AlbumSidebar'
import SearchBar from '../components/SearchBar'
import UploadButton from '../components/UploadButton'
import PaywallScreen from '../components/PaywallScreen'

export default function Vault() {
  const { user, signOut } = useAuth()
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  // null = all photos, 'favorites' = favorites view, otherwise an album id
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [search, setSearch] = useState('')
  const [viewingPhoto, setViewingPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [totalPhotoCount, setTotalPhotoCount] = useState(null)
  const [paywall, setPaywall] = useState(null) // { reason, dismissible } | null

  const subscribed = isSubscriptionActive(subscription)

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

  useEffect(() => {
    getSubscription(user.id)
      .then(setSubscription)
      .catch((err) => setError(err.message))
    getPhotoCount()
      .then(setTotalPhotoCount)
      .catch(() => {})
  }, [user.id])

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
      getPhotoCount().then(setTotalPhotoCount).catch(() => {})
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

  async function handleUploaded() {
    await loadPhotos()
    try {
      const count = await getPhotoCount()
      setTotalPhotoCount(count)
      // Shown once ever per account, the first time they have a photo in the vault.
      if (count >= 1 && !subscribed) {
        const key = `vaultsnap_upsell_shown_${user.id}`
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1')
          setPaywall({
            reason: 'Nice — your vault is growing. Upgrade anytime for unlimited photos.',
            dismissible: true,
          })
        }
      }
    } catch {
      // non-critical — free-tier indicator just won't update this cycle
    }
  }

  async function handleManageSubscription() {
    try {
      window.location.href = await createPortalSession()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleCapReached() {
    setPaywall({
      reason: `You've reached the ${FREE_TIER_PHOTO_LIMIT}-photo free limit. Upgrade to add more.`,
      dismissible: true,
    })
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
          <div className="vault-header-actions">
            {subscribed ? (
              <button type="button" onClick={handleManageSubscription}>
                Manage subscription
              </button>
            ) : (
              <button type="button" onClick={() => setPaywall({ dismissible: true })}>
                Upgrade
              </button>
            )}
            <button type="button" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </header>

        {!subscribed && totalPhotoCount !== null && (
          <p className="free-tier-indicator">
            {totalPhotoCount} of {FREE_TIER_PHOTO_LIMIT} free photos used
          </p>
        )}

        <div className="vault-toolbar">
          <SearchBar value={search} onChange={setSearch} />
          <UploadButton albumId={uploadAlbumId} onUploaded={handleUploaded} onCapReached={handleCapReached} />
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

      {paywall && (
        <PaywallScreen
          reason={paywall.reason}
          dismissible={paywall.dismissible}
          onDismiss={() => setPaywall(null)}
        />
      )}
    </div>
  )
}
