import { Router } from 'express'
import MenuItem from '../models/MenuItem.js'
import protect from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const filter = { isAvailable: true }
    if (req.query.category) filter.category = req.query.category
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin/all', protect, async (req, res) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 })
  res.json(items)
})

router.post('/', protect, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body)
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
