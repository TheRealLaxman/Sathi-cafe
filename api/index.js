import '../server/config/env.js'
import app from '../server/app.js'
import { readyDB } from '../server/config/db.js'

export default async function handler(req, res) {
  if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    return res.status(500).json({ message: 'Server is not configured' })
  }
  try {
    await readyDB()
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    return res.status(503).json({ message: 'Service unavailable' })
  }
  return app(req, res)
}
