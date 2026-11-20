import { Router } from 'express'
import Order from '../models/Order.js'
import MenuItem from '../models/MenuItem.js'
import protect from '../middleware/auth.js'
import { requirePermission } from '../middleware/authorize.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { formLimiter } from '../middleware/limiters.js'
import { schemas } from '../validators.js'
import { PERMISSIONS } from '../config/roles.js'
import { httpError } from '../utils/httpError.js'
import { notifyCustomer, notifyOwner } from '../services/notify.js'

const router = Router()

// Validate and record a new customer order.
router.post(
  '/',
  formLimiter,
  validate(schemas.order),
  asyncHandler(async (req, res) => {
    const { name, phone, email, note, items } = req.body
    const ids = [...new Set(items.map((i) => i.id))]
    if (ids.length !== items.length) throw httpError(400, 'Duplicate items are not allowed')

    const docs = await MenuItem.find({ _id: { $in: ids } }).lean()
    if (docs.length !== ids.length) throw httpError(400, 'An item in your order is no longer available')

    const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]))
    const lines = items.map(({ id, qty }) => {
      const doc = byId.get(id)
      if (!doc?.isAvailable) throw httpError(400, `${doc?.name || 'An item'} is not available right now`)
      return { menuItem: doc._id, name: doc.name, price: doc.price, qty }
    })
    const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)

    const order = await Order.create({ name, phone, email, note, items: lines, total })
    void notifyOwner(
      'New order',
      `${name} · ${phone}\n${lines.map((l) => `${l.qty} × ${l.name} - Rs. ${l.qty * l.price}`).join('\n')}\nTotal: Rs. ${total}`
    )
    if (email) {
      void notifyCustomer(
        email,
        'Sathi Cafe order received',
        `Hi ${name}, we received your order of Rs. ${total}. We'll let you know when it is ready.`
      )
    }
    res.status(201).json(order)
  })
)

router.get(
  '/',
  protect,
  requirePermission(PERMISSIONS.ordersRead),
  asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  })
)

router.patch(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.ordersWrite),
  validate(schemas.orderStatus),
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
    if (!order) throw httpError(404, 'Order not found')

    if (order.email && ['ready', 'cancelled'].includes(req.body.status)) {
      const text =
        req.body.status === 'ready'
          ? `Hi ${order.name}, your Sathi Cafe order (Rs. ${order.total}) is ready for pickup.`
          : `Hi ${order.name}, your Sathi Cafe order (Rs. ${order.total}) was cancelled. Please contact us if this is a mistake.`
      void notifyCustomer(order.email, 'Sathi Cafe order update', text)
    }

    res.json(order)
  })
)

router.delete(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.ordersDelete),
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) throw httpError(404, 'Order not found')
    res.json({ message: 'Deleted' })
  })
)

export default router
