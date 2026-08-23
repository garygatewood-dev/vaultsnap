// Fetches a file and saves it via a real browser download, rather than just
// navigating to the URL (which cross-origin signed URLs often don't trigger a
// save for) — used by the full-screen viewer and the per-photo card/list
// actions, so grid and list views get a real download without opening the
// viewer first (useful on mobile, where long-press-to-save is the only other
// option).
export async function downloadFile(url, filename) {
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename || 'photo'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
