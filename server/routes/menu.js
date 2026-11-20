import { Router } from 'express'
import MenuItem from '../models/MenuItem.js'
import protect from '../middleware/auth.js'
import { requirePermission } from '../middleware/authorize.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { schemas } from '../validators.js'
import { PERMISSIONS } from '../config/roles.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { isAvailable: true }
    if (typeof req.query.category === 'string' && req.query.category.length <= 50) {
      filter.category = req.query.category
    }
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 })
    res.json(items)
  })
)

router.get(
  '/admin/all',
  protect,
  requirePermission(PERMISSIONS.menuRead),
  asyncHandler(async (req, res) => {
    const items = await MenuItem.find().sort({ category: 1, name: 1 })
    res.json(items)
  })
)

router.post(
  '/',
  protect,
  requirePermission(PERMISSIONS.menuWrite),
  validate(schemas.menu),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.create(req.body)
    res.status(201).json(item)
  })
)

router.put(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.menuWrite),
  validate(schemas.menuUpdate),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json(item)
  })
)

router.delete(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.menuDelete),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndDelete(req.params.id)
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json({ message: 'Deleted' })
  })
)

export default router
