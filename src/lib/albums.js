import { supabase } from './supabaseClient'

export async function listAlbums() {
  const { data, error } = await supabase.from('albums').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createAlbum(userId, name) {
  const { data, error } = await supabase.from('albums').insert({ user_id: userId, name }).select().single()
  if (error) throw error
  return data
}

export async function renameAlbum(albumId, name) {
  const { error } = await supabase.from('albums').update({ name }).eq('id', albumId)
  if (error) throw error
}

export async function deleteAlbum(albumId) {
  const { error } = await supabase.from('albums').delete().eq('id', albumId)
  if (error) throw error
}
