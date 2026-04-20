import "server-only"

import sharp from "sharp"

import {
  MAX_STORED_IMAGE_BYTES,
  TARGET_IMAGE_BYTES,
} from "@/lib/apartment-image-constraints"

type EncodeAttempt = {
  maxLongSidePx: number
  quality: number
}

type ProcessedImage = {
  buffer: Buffer
  contentType: "image/jpeg"
  sizeBytes: number
}

const ENCODE_ATTEMPTS: EncodeAttempt[] = [
  { maxLongSidePx: 2048, quality: 82 },
  { maxLongSidePx: 1920, quality: 80 },
  { maxLongSidePx: 1600, quality: 76 },
  { maxLongSidePx: 1440, quality: 72 },
  { maxLongSidePx: 1280, quality: 68 },
  { maxLongSidePx: 1120, quality: 64 },
  { maxLongSidePx: 960, quality: 60 },
  { maxLongSidePx: 840, quality: 56 },
  { maxLongSidePx: 720, quality: 52 },
]

async function encodeJpeg(
  inputBuffer: Buffer,
  attempt: EncodeAttempt,
): Promise<Buffer> {
  return sharp(inputBuffer, { failOn: "none", limitInputPixels: 64_000_000 })
    .rotate()
    .resize({
      width: attempt.maxLongSidePx,
      height: attempt.maxLongSidePx,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: attempt.quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: "4:2:0",
    })
    .toBuffer()
}

export async function processImageForStorage(inputBuffer: Buffer): Promise<ProcessedImage> {
  for (const attempt of ENCODE_ATTEMPTS) {
    const candidate = await encodeJpeg(inputBuffer, attempt)

    if (candidate.byteLength <= TARGET_IMAGE_BYTES) {
      return {
        buffer: candidate,
        contentType: "image/jpeg",
        sizeBytes: candidate.byteLength,
      }
    }

    if (candidate.byteLength < MAX_STORED_IMAGE_BYTES) {
      return {
        buffer: candidate,
        contentType: "image/jpeg",
        sizeBytes: candidate.byteLength,
      }
    }
  }

  throw new Error("Image could not be optimized below 250KB")
}
