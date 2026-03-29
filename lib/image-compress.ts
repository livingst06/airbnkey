/** Réduit la taille côté client avant un futur vrai upload. */
export const IMAGE_MAX_LONG_SIDE_PX = 1600
export const IMAGE_JPEG_QUALITY = 0.82

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"))
    reader.readAsDataURL(file)
  })
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("canvas.toBlob returned null")),
      "image/jpeg",
      quality,
    )
  })
}

/**
 * Image bitmap → JPEG redimensionné.
 * SVG et types non pris en charge : blob fichier d’origine (pas de recompression).
 */
export async function compressImageFileToBlob(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (nw < 1 || nh < 1) {
      return new Blob([await file.arrayBuffer()], { type: file.type })
    }
    const maxSide = Math.max(nw, nh)
    const scale =
      maxSide > IMAGE_MAX_LONG_SIDE_PX ? IMAGE_MAX_LONG_SIDE_PX / maxSide : 1
    const w = Math.max(1, Math.round(nw * scale))
    const h = Math.max(1, Math.round(nh * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return new Blob([await file.arrayBuffer()], { type: file.type })
    }
    ctx.drawImage(img, 0, 0, w, h)
    return canvasToJpegBlob(canvas, IMAGE_JPEG_QUALITY)
  } catch {
    return new Blob([await file.arrayBuffer()], { type: file.type })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = src
  })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"))
    reader.readAsDataURL(blob)
  })
}
