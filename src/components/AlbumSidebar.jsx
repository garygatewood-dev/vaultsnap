import { useState } from 'react'

export default function AlbumSidebar({ albums, selectedAlbumId, onSelect, onCreate, onRename, onDelete }) {
  const [newAlbumName, setNewAlbumName] = useState('')

  function handleCreate(e) {
    e.preventDefault()
    const name = newAlbumName.trim()
    if (!name) return
    onCreate(name)
    setNewAlbumName('')
  }

  function handleRename(album) {
    const name = window.prompt('Rename album', album.name)
    if (name && name.trim()) onRename(album.id, name.trim())
  }

  return (
    <aside>
      <h2>Albums</h2>
      <ul>
        <li>
          <button type="button" onClick={() => onSelect(null)} aria-current={selectedAlbumId === null}>
            All photos
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onSelect('favorites')}
            aria-current={selectedAlbumId === 'favorites'}
          >
            Favorites
          </button>
        </li>
        {albums.map((album) => (
          <li key={album.id}>
            <button type="button" onClick={() => onSelect(album.id)} aria-current={selectedAlbumId === album.id}>
              {album.name}
            </button>
            <button type="button" onClick={() => handleRename(album)}>
              Rename
            </button>
            <button type="button" onClick={() => onDelete(album.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate}>
        <input
          value={newAlbumName}
          onChange={(e) => setNewAlbumName(e.target.value)}
          placeholder="New album name"
        />
        <button type="submit">Create album</button>
      </form>
    </aside>
  )
}
