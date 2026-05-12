const RAW_APARTMENT_UPLOAD_PREFIX = "apartments/raw/"

const RAW_APARTMENT_UPLOAD_PATH_RE =
  /^apartments\/raw\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/i

function sanitizeExtension(fileName: string | undefined): string {
  const raw = fileName?.trim().toLowerCase() ?? ""
  if (!raw.includes(".")) return "jpg"
  const ext = raw.slice(raw.lastIndexOf(".") + 1)
  if (!ext) return "jpg"
  if (!/^[a-z0-9]{1,10}$/.test(ext)) return "jpg"
  return ext
}

export function createRawApartmentUploadPath(fileName: string | undefined): string {
  return `${RAW_APARTMENT_UPLOAD_PREFIX}${crypto.randomUUID()}.${sanitizeExtension(fileName)}`
}

export function isRawApartmentUploadPath(sourcePath: string): boolean {
  return RAW_APARTMENT_UPLOAD_PATH_RE.test(sourcePath)
}
