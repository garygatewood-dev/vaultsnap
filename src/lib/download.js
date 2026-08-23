// Fetches a file and saves it. On mobile browsers that support sharing files
// (iOS Safari 15+, most modern Android browsers), this hands the photo to the
// native OS share sheet so the user can choose where it goes — Save to
// Photos, Files, AirDrop, Messages, etc. — rather than always landing in the
// browser's Downloads location, which is all a plain <a download> link can
// do (that's a browser sandboxing restriction, not something we can steer
// around directly). Everywhere else (desktop, or mobile browsers without
// file-sharing support) falls back to the direct download.
export async function downloadFile(url, filename) {
  const response = await fetch(url)
  const blob = await response.blob()
  const file = new File([blob], filename || 'photo', { type: blob.type })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (err) {
      // User backed out of the share sheet on purpose — leave it at that,
      // don't immediately dump a Downloads-folder copy on them too.
      if (err?.name === 'AbortError') return
      // Any other failure (e.g. share sheet rejected because too much time
      // passed since the tap that triggered this) — fall through to the
      // direct-download fallback below instead of leaving the user stuck.
    }
  }

  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename || 'photo'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
