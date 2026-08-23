import { useEffect, useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { getSignedViewUrl } from '../lib/storage'
import { downloadFile } from '../lib/download'

const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|webm|m4v)$/i
const SWIPE_THRESHOLD = 50

export default function PhotoViewer({ photos, index, onNavigate, onClose }) {
  const photo = photos[index]
  const [url, setUrl] = useState(null)
  const [scale, setScale] = useState(1)
  const swipeRef = useRef(null)

  const isVideo = VIDEO_EXTENSION_PATTERN.test(photo.storage_path)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    getSignedViewUrl(photo.storage_path)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [photo.storage_path])

  // Zoom/pan lives inside TransformWrapper, keyed by photo id below — a fresh key
  // remounts it per photo, which is what resets zoom when navigating.
  useEffect(() => {
    setScale(1)
  }, [index])

  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!url || downloading) return
    setDownloading(true)
    try {
      await downloadFile(url, photo.original_filename || 'photo')
    } catch (err) {
      console.error('Download failed', err)
    } finally {
      setDownloading(false)
    }
  }

  function goTo(newIndex) {
    if (newIndex < 0 || newIndex >= photos.length) return
    onNavigate(newIndex)
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') goTo(index - 1)
      else if (e.key === 'ArrowRight') goTo(index + 1)
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length])

  // Swipe-to-navigate — only when not zoomed in, so it doesn't fight with the
  // library's own drag-to-pan (which we disable at scale 1, see panning prop below).
  function handlePointerDown(e) {
    if (isVideo || scale > 1) return
    swipeRef.current = { startX: e.clientX }
  }

  function handlePointerUp(e) {
    if (!swipeRef.current || scale > 1) {
      swipeRef.current = null
      return
    }
    const dx = e.clientX - swipeRef.current.startX
    swipeRef.current = null
    if (dx > SWIPE_THRESHOLD) goTo(index - 1)
    else if (dx < -SWIPE_THRESHOLD) goTo(index + 1)
  }

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true">
      <div
        className="viewer-stage"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeRef.current = null
        }}
      >
        {url ? (
          isVideo ? (
            <video src={url} controls autoPlay />
          ) : (
            <TransformWrapper
              key={photo.id}
              initialScale={1}
              minScale={1}
              maxScale={4}
              panning={{ disabled: scale <= 1 }}
              doubleClick={{ mode: 'toggle' }}
              onTransformed={(_ref, state) => setScale(state.scale)}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="viewer-zoom-controls">
                    <button type="button" onClick={() => zoomIn()} aria-label="Zoom in">
                      +
                    </button>
                    <button type="button" onClick={() => zoomOut()} aria-label="Zoom out">
                      −
                    </button>
                  </div>
                  <TransformComponent wrapperClass="viewer-transform-wrapper" contentClass="viewer-transform-content">
                    <img
                      src={url}
                      alt={photo.original_filename || 'Vault photo'}
                      draggable={false}
                      style={{ imageOrientation: 'from-image' }}
                      // The library measures layout bounds on mount, before this image has
                      // actually finished loading — so it can center/scale against a 0x0 or
                      // stale box and land on a wrong, zoomed-looking initial view. Forcing
                      // a reset once the real image is loaded fixes that without any visible
                      // animation (0ms).
                      onLoad={() => resetTransform(0)}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          )
        ) : (
          <p>Loading…</p>
        )}
      </div>

      {/*
        Close/prev/next are DOM siblings of .viewer-stage, not descendants of the
        zoomable TransformComponent tree — their on-screen position is fixed
        relative to the viewer overlay itself, so zooming/panning the image never
        moves or covers them.
      */}
      <button
        type="button"
        className="viewer-download"
        onClick={handleDownload}
        disabled={!url || downloading}
        aria-label="Download"
      >
        {downloading ? '…' : '⬇'}
      </button>

      <button type="button" className="viewer-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <button
        type="button"
        className="viewer-nav viewer-nav-prev"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Previous photo"
      >
        ‹
      </button>

      <button
        type="button"
        className="viewer-nav viewer-nav-next"
        onClick={() => goTo(index + 1)}
        disabled={index === photos.length - 1}
        aria-label="Next photo"
      >
        ›
      </button>
    </div>
  )
}
