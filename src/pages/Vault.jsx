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
import { isPlatformAuthenticatorAvailable, registerBiometricUnlock } from '../lib/webauthn'
import PhotoGrid from '../components/PhotoGrid'
import PhotoList from '../components/PhotoList'
import PhotoViewer from '../components/PhotoViewer'
import AlbumSidebar from '../components/AlbumSidebar'
import SearchBar from '../components/SearchBar'
import UploadButton from '../components/UploadButton'
import PaywallScreen from '../components/PaywallScreen'
import MoveToAlbumModal from '../components/MoveToAlbumModal'

export default function Vault() {
  const { user, signOut } = useAuth()
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  // null = all photos, 'favorites' = favorites view, otherwise an album id
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [search, setSearch] = useState('')
  const [viewingIndex, setViewingIndex] = useState(null)
  const [error, setError] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [totalPhotoCount, setTotalPhotoCount] = useState(null)
  const [paywall, setPaywall] = useState(null) // { reason, dismissible } | null
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricMessage, setBiometricMessage] = useState(null)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('vaultsnap_view_mode') || 'grid')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [moveTarget, setMoveTarget] = useState(null) // { photoIds, currentAlbumId } | null

  const subscribed = isSubscriptionActive(subscription)

  useEffect(() => {
    localStorage.setItem('vaultsnap_view_mode', viewMode)
  }, [viewMode])

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

  // Guard against the viewer holding a stale index if the list changes while it's open.
  useEffect(() => {
    if (viewingIndex !== null && viewingIndex >= photos.length) {
      setViewingIndex(null)
    }
  }, [photos, viewingIndex])

  useEffect(() => {
    getSubscription(user.id)
      .then(setSubscription)
      .catch((err) => setError(err.message))
    getPhotoCount()
      .then(setTotalPhotoCount)
      .catch(() => {})
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable)
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

  async function handleAddBiometric() {
    setBiometricMessage(null)
    try {
      await registerBiometricUnlock(user.id, user.email)
      setBiometricMessage('Face ID / Touch ID enabled for this device.')
    } catch (err) {
      setBiometricMessage(err.message)
    }
  }

  function handleOpenPhoto(photo) {
    const idx = photos.findIndex((p) => p.id === photo.id)
    setViewingIndex(idx === -1 ? null : idx)
  }

  function handleToggleSelectionMode() {
    setSelectionMode((mode) => !mode)
    setSelectedIds(new Set())
  }

  function handleToggleSelect(photoId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  function handleMoveSingle(photo) {
    setMoveTarget({ photoIds: [photo.id], currentAlbumId: photo.album_id })
  }

  function handleMoveSelected() {
    setMoveTarget({ photoIds: [...selectedIds], currentAlbumId: null })
  }

  async function handleMoved() {
    setMoveTarget(null)
    setSelectionMode(false)
    setSelectedIds(new Set())
    await loadPhotos()
    loadAlbums()
  }

  function handleEnhanced(photoId, enhancedStoragePath) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, enhanced_storage_path: enhancedStoragePath } : p)),
    )
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
            {biometricAvailable && (
              <button type="button" onClick={handleAddBiometric}>
                Add Face ID / Touch ID
              </button>
            )}
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

        {biometricMessage && <p className="biometric-message">{biometricMessage}</p>}

        {!subscribed && totalPhotoCount !== null && (
          <p className="free-tier-indicator">
            {totalPhotoCount} of {FREE_TIER_PHOTO_LIMIT} free photos used
          </p>
        )}

        <div className="vault-toolbar">
          <SearchBar value={search} onChange={setSearch} />
          <div className="view-mode-toggle">
            <button
              type="button"
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button type="button" className={selectionMode ? 'active' : ''} onClick={handleToggleSelectionMode}>
            {selectionMode ? 'Cancel select' : 'Select'}
          </button>
          <UploadButton albumId={uploadAlbumId} onUploaded={handleUploaded} onCapReached={handleCapReached} />
        </div>

        {selectionMode && (
          <div className="selection-bar">
            <span>{selectedIds.size} selected</span>
            <button type="button" onClick={handleMoveSelected} disabled={selectedIds.size === 0}>
              Move to album
            </button>
          </div>
        )}

        {error && <p role="alert">{error}</p>}

        {viewMode === 'grid' ? (
          <PhotoGrid
            photos={photos}
            onOpen={handleOpenPhoto}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onMove={handleMoveSingle}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        ) : (
          <PhotoList
            photos={photos}
            onOpen={handleOpenPhoto}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onMove={handleMoveSingle}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </main>

      {viewingIndex !== null && (
        <PhotoViewer
          photos={photos}
          index={viewingIndex}
          onNavigate={setViewingIndex}
          onClose={() => setViewingIndex(null)}
          subscribed={subscribed}
          onRequirePremium={() =>
            setPaywall({ reason: 'Unlock AI photo enhancement with Premium.', dismissible: true })
          }
          onEnhanced={handleEnhanced}
        />
      )}

      {paywall && (
        <PaywallScreen
          reason={paywall.reason}
          dismissible={paywall.dismissible}
          onDismiss={() => setPaywall(null)}
        />
      )}

      {moveTarget && (
        <MoveToAlbumModal
          photoIds={moveTarget.photoIds}
          currentAlbumId={moveTarget.currentAlbumId}
          albums={albums}
          userId={user.id}
          onMoved={handleMoved}
          onClose={() => setMoveTarget(null)}
        />
      )}
    </div>
  )
}
