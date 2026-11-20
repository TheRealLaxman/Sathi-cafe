import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'

const here = path.dirname(fileURLToPath(import.meta.url))

export const uploadDir = path.resolve(here, '../uploads')

// Create the upload directory if needed.
export async function ensureUploadDir() {
  await mkdir(uploadDir, { recursive: true })
}
