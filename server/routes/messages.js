import { Router } from 'express'
import Message from '../models/Message.js'
import protect from '../middleware/auth.js'
import { formLimiter } from '../middleware/limiters.js'

const router = Router()

router.post('/', formLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body
    await Message.create({ name, email, message })
    res.status(201).json({ message: 'Message sent' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', protect, async (req, res) => {
  const items = await Message.find().sort({ createdAt: -1 })
  res.json(items)
})

router.delete('/:id', protect, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
