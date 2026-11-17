import crypto from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { loginLimiter } from '../middleware/limiters.js'
import { sendMail } from '../utils/mailer.js'

const router = Router()

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim()
    const password = String(req.body.password || '')
    const user = await User.findOne({ email })
    const ok = user && (await bcrypt.compare(password, user.passwordHash))
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    })
    res.json({ token })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/forgot-password', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim()
    const user = await User.findOne({ email })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      user.resetTokenHash = sha256(token)
      user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000)
      await user.save()

      const siteUrl = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
        .split(',')[0]
        .trim()
        .replace(/\/+$/, '')

      await sendMail({
        to: user.email,
        subject: 'Reset your Sathi Cafe admin password',
        text: [
          'Someone asked to reset the admin password for Sathi Cafe.',
          'Open this link to choose a new one (it works for 30 minutes):',
          '',
          `${siteUrl}/admin/reset-password/${token}`,
          '',
          "If this wasn't you, ignore this email and nothing will change.",
        ].join('\n'),
      })
    }
  } catch (err) {
    console.error('forgot-password failed:', err.message)
  }

  res.json({ message: 'If that email belongs to an admin, a reset link is on its way.' })
})

router.post('/reset-password/:token', loginLimiter, async (req, res) => {
  try {
    const password = String(req.body.password || '')
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const user = await User.findOne({
      resetTokenHash: sha256(req.params.token),
      resetTokenExpires: { $gt: new Date() },
    })
    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' })
    }

    user.passwordHash = await bcrypt.hash(password, 12)
    user.resetTokenHash = undefined
    user.resetTokenExpires = undefined
    await user.save()

    res.json({ message: 'Password updated' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
