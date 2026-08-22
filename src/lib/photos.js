import { supabase } from './supabaseClient'

export async function listPhotos({ albumId, favoritesOnly, search } = {}) {
  let query = supabase.from('photos').select('*').order('created_at', { ascending: false })

  if (albumId) query = query.eq('album_id', albumId)
  if (favoritesOnly) query = query.eq('is_favorite', true)
  if (search) query = query.ilike('original_filename', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createPhotoRecord({ userId, storagePath, thumbnailPath, albumId, originalFilename }) {
  const { data, error } = await supabase
    .from('photos')
    .insert({
      user_id: userId,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      album_id: albumId ?? null,
      original_filename: originalFilename ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPhotoCount() {
  const { count, error } = await supabase.from('photos').select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function toggleFavorite(photoId, isFavorite) {
  const { error } = await supabase.from('photos').update({ is_favorite: isFavorite }).eq('id', photoId)
  if (error) throw error
}

export async function deletePhotoRecord(photoId) {
  const { error } = await supabase.from('photos').delete().eq('id', photoId)
  if (error) throw error
}

export async function updatePhotosAlbum(photoIds, albumId) {
  const { error } = await supabase.from('photos').update({ album_id: albumId }).in('id', photoIds)
  if (error) throw error
}
