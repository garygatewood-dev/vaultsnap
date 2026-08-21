import PhotoCard from './PhotoCard'

export default function PhotoGrid({ photos, onOpen, onToggleFavorite, onDelete }) {
  if (!photos.length) {
    return <p>No photos yet.</p>
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
