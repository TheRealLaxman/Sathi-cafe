import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { access, mkdir, readdir, unlink, writeFile } from 'node:fs/promises'

const here = path.dirname(fileURLToPath(import.meta.url))
export const uploadDir = path.resolve(here, '../uploads')

export const photoName = /^[a-f0-9-]+\.webp$/i

const r2Configured = () => Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET &&
  process.env.R2_PUBLIC_BASE_URL
)

export const usesRemoteStorage = r2Configured

export function publicUploadUrl(name) {
  if (!r2Configured()) return `/uploads/${name}`
  return `${process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${name}`
}

async function r2Client() {
  const { S3Client } = await import('@aws-sdk/client-s3')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

const notFound = () => Object.assign(new Error('Photo not found'), { code: 'ENOENT' })

export async function ensureUploadDir() {
  if (r2Configured()) return
  if (process.env.NODE_ENV === 'production') {
    throw new Error('R2 storage must be configured in production')
  }
  await mkdir(uploadDir, { recursive: true })
}

export async function putUpload(name, bytes, contentType = 'image/webp') {
  if (!r2Configured()) {
    await ensureUploadDir()
    await writeFile(path.join(uploadDir, name), bytes)
    return
  }
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  await (await r2Client()).send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: name,
    Body: bytes,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
}

export async function listUploads() {
  if (!r2Configured()) {
    await ensureUploadDir()
    return readdir(uploadDir)
  }
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
  const res = await (await r2Client()).send(new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET,
    MaxKeys: 1000,
  }))
  return (res.Contents || []).map((item) => item.Key).filter(Boolean)
}

export async function uploadExists(name) {
  if (!r2Configured()) {
    try {
      await access(path.join(uploadDir, name))
      return true
    } catch {
      return false
    }
  }
  const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
  try {
    await (await r2Client()).send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: name }))
    return true
  } catch {
    return false
  }
}

export async function deleteUpload(name) {
  if (!r2Configured()) {
    try {
      await unlink(path.join(uploadDir, name))
    } catch (err) {
      if (err.code === 'ENOENT') throw notFound()
      throw err
    }
    return
  }
  const s3 = await r2Client()
  const { HeadObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: name }))
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) throw notFound()
    throw err
  }
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: name }))
}
