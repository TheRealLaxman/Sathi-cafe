import crypto from 'crypto'
import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import protect from '../middleware/auth.js'
import { requirePermission } from '../middleware/authorize.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { httpError } from '../utils/httpError.js'
import { PERMISSIONS } from '../config/roles.js'
import { photoName, publicUploadUrl, listUploads, putUpload, deleteUpload } from '../config/uploads.js'
import MenuItem from '../models/MenuItem.js'
import { logAction } from '../services/audit.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  // Accept only supported image upload types.
  fileFilter(req, file, cb) {
    if (/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) return cb(null, true)
    cb(httpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed'))
  },
})

router.get(
  '/',
  protect,
  requirePermission(PERMISSIONS.uploadsRead),
  asyncHandler(async (req, res) => {
    const files = await listUploads()
    const images = files
      .filter((name) => photoName.test(name))
      .sort()
      .reverse()
      .slice(0, 200)
      .map((name) => ({ name, url: publicUploadUrl(name) }))
    res.json(images)
  })
)

router.post(
  '/',
  protect,
  requirePermission(PERMISSIONS.uploadsWrite),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, 'Choose an image to upload')

    const name = `${crypto.randomUUID()}.webp`
    let image
    try {
      image = await sharp(req.file.buffer)
        .rotate()
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
    } catch {
      throw httpError(400, 'That file is not a valid image')
    }

    await putUpload(name, image)
    res.status(201).json({ name, url: publicUploadUrl(name) })
  })
)

router.delete(
  '/:name',
  protect,
  requirePermission(PERMISSIONS.uploadsWrite),
  asyncHandler(async (req, res) => {
    const name = String(req.params.name)
    if (!photoName.test(name)) throw httpError(400, 'Invalid photo name')

    const used = await MenuItem.exists({
      image: { $regex: `(?:^|/)${name.replace(/\./g, '\\.')}$`, $options: 'i' },
    })
    if (used) throw httpError(409, 'This photo is used by a menu item. Remove it from the item first.')

    try {
      await deleteUpload(name)
    } catch (err) {
      if (err.code === 'ENOENT') throw httpError(404, 'Photo not found')
      throw err
    }

    await logAction(req, 'upload.delete', { detail: `Deleted photo ${name}` })
    res.json({ message: 'Photo deleted' })
  })
)

export default router
