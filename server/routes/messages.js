import { Router } from 'express'
import Message from '../models/Message.js'
import protect from '../middleware/auth.js'
import { requirePermission } from '../middleware/authorize.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { formLimiter } from '../middleware/limiters.js'
import { schemas } from '../validators.js'
import { PERMISSIONS } from '../config/roles.js'
import { httpError } from '../utils/httpError.js'
import { notifyOwner } from '../services/notify.js'

const router = Router()

router.post(
  '/',
  formLimiter,
  validate(schemas.message),
  asyncHandler(async (req, res) => {
    const { name, email, message } = req.body
    await Message.create({ name, email, message })
    void notifyOwner('New website message', `From ${name} <${email}>:\n\n${message}`)
    res.status(201).json({ message: 'Message sent' })
  })
)

router.get(
  '/',
  protect,
  requirePermission(PERMISSIONS.messagesRead),
  asyncHandler(async (req, res) => {
    const items = await Message.find().sort({ createdAt: -1 })
    res.json(items)
  })
)

router.delete(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.messagesDelete),
  asyncHandler(async (req, res) => {
    const item = await Message.findByIdAndDelete(req.params.id)
    if (!item) throw httpError(404, 'Message not found')
    res.json({ message: 'Deleted' })
  })
)

export default router
