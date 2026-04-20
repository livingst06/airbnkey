export const MAX_APARTMENT_IMAGES = 10

export const MAX_STORED_IMAGE_BYTES = 250 * 1024
export const TARGET_IMAGE_BYTES = 220 * 1024

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const

export const ACCEPTED_IMAGE_MIME_TYPE_SET = new Set<string>(
  ACCEPTED_IMAGE_MIME_TYPES,
)
