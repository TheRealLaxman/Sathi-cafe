import { Router } from 'express'
import Reservation from '../models/Reservation.js'
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
// Read the configured reservation guest capacity.
const capacity = () => Number(process.env.RESERVATION_CAPACITY) || 20
const digits = (value) => String(value).replace(/\D/g, '')

// Record a reservation when the time slot has room.
router.post(
  '/',
  formLimiter,
  validate(schemas.reservation),
  asyncHandler(async (req, res) => {
    const { name, phone, email, date, time, guests, note } = req.body
    const phoneKey = digits(phone)
    const active = { date, time, status: { $in: ['pending', 'confirmed'] } }

    const duplicate = await Reservation.findOne({ ...active, phone: { $regex: `${phoneKey}$` } })
    if (duplicate) throw httpError(409, 'You already have a booking for that time')

    const booked = await Reservation.aggregate([
      { $match: active },
      { $group: { _id: null, guests: { $sum: '$guests' } } },
    ])
    const taken = booked[0]?.guests || 0
    if (taken + guests > capacity()) {
      throw httpError(409, 'That time slot is full. Please choose another time.')
    }

    await Reservation.create({ name, phone, email, date, time, guests, note })
    void notifyOwner(
      'New table reservation',
      `${name} · ${phone}\n${date} at ${time} · ${guests} guests${note ? `\nNote: ${note}` : ''}`
    )
    res.status(201).json({ message: 'Reservation received' })
  })
)

router.get(
  '/',
  protect,
  requirePermission(PERMISSIONS.reservationsRead),
  asyncHandler(async (req, res) => {
    const items = await Reservation.find().sort({ date: 1, time: 1 })
    res.json(items)
  })
)

router.patch(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.reservationsWrite),
  validate(schemas.reservationStatus),
  asyncHandler(async (req, res) => {
    const before = await Reservation.findById(req.params.id)
    if (!before) throw httpError(404, 'Reservation not found')

    const item = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )

    if (before.email && before.status !== req.body.status) {
      const text =
        req.body.status === 'confirmed'
          ? `Hi ${before.name}, your table at Sathi Cafe is confirmed for ${before.date} at ${before.time}. See you soon!`
          : req.body.status === 'cancelled'
            ? `Hi ${before.name}, your table request for ${before.date} at ${before.time} was cancelled. Please contact us if this is a mistake.`
            : ''
      if (text) void notifyCustomer(before.email, 'Sathi Cafe reservation update', text)
    }

    res.json(item)
  })
)

router.delete(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.reservationsDelete),
  asyncHandler(async (req, res) => {
    const item = await Reservation.findByIdAndDelete(req.params.id)
    if (!item) throw httpError(404, 'Reservation not found')
    res.json({ message: 'Deleted' })
  })
)

export default router
