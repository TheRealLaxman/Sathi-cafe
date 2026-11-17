import { Router } from 'express'
import Reservation from '../models/Reservation.js'
import protect from '../middleware/auth.js'
import { formLimiter } from '../middleware/limiters.js'

const router = Router()

// butwal is UTC+5:45 all year, so bookings are checked against that, not the server's clock
const CAFE_UTC_OFFSET = '+05:45'

router.post('/', formLimiter, async (req, res) => {
  try {
    const { name, phone, date, time, guests, note } = req.body

    const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time)
    const when = validFormat ? new Date(`${date}T${time}:00${CAFE_UTC_OFFSET}`) : null
    if (!when || isNaN(when) || when < new Date()) {
      return res.status(400).json({ message: 'Please choose a future date and time' })
    }

    await Reservation.create({ name, phone, date, time, guests, note })
    res.status(201).json({ message: 'Reservation received' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', protect, async (req, res) => {
  const items = await Reservation.find().sort({ date: 1, time: 1 })
  res.json(items)
})

router.patch('/:id', protect, async (req, res) => {
  try {
    const item = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
