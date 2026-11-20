import crypto from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import protect from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { loginLimiter, refreshLimiter } from '../middleware/limiters.js'
import { schemas } from '../validators.js'
import { httpError } from '../utils/httpError.js'
import { isProd } from '../utils/env.js'
import { mailConfigured, sendMail } from '../utils/mailer.js'
import { notifyOwner } from '../services/notify.js'
import { logAction } from '../services/audit.js'
import { publicUser } from '../utils/identity.js'

const router = Router()
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

const ACCESS = 'sathi_access'
const REFRESH = 'sathi_refresh'
const cookieBase = { httpOnly: true, secure: isProd(), sameSite: 'strict' }
const accessOptions = { ...cookieBase, path: '/', maxAge: 15 * 60 * 1000 }
const refreshOptions = { ...cookieBase, path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000 }

// Sign a short-lived access token for the admin.
const accessToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, v: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )

// Replace the stored refresh token hash for a user.
async function rotateRefresh(user) {
  const token = crypto.randomBytes(48).toString('hex')
  user.previousRefreshHash = user.refreshTokenHash
  user.refreshTokenHash = sha256(token)
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await user.save()
  return token
}

// Remove access and refresh cookies from the response.
function clearSession(res) {
  res.clearCookie(ACCESS, { ...cookieBase, path: '/' })
  res.clearCookie(REFRESH, { ...cookieBase, path: '/api/auth' })
}

// Attach access and refresh cookies to the response.
function setSession(res, user, refresh) {
  res.cookie(ACCESS, accessToken(user), accessOptions)
  res.cookie(REFRESH, refresh, refreshOptions)
}

// Invalidate all sessions for a user.
function revokeSessions(user) {
  user.refreshTokenHash = undefined
  user.previousRefreshHash = undefined
  user.refreshTokenExpires = undefined
  user.tokenVersion = (user.tokenVersion || 0) + 1
}

router.get('/me', protect, (req, res) => res.json(publicUser(req.user)))

router.post(
  '/login',
  loginLimiter,
  validate(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await logAction(req, 'auth.login-failed', {
        outcome: 'failure',
        actor: { email },
        detail: 'Invalid email or password',
      })
      throw httpError(401, 'Invalid email or password')
    }
    if (!user.isActive) {
      await logAction(req, 'auth.login-blocked', {
        outcome: 'failure',
        actor: publicUser(user),
        detail: 'Account is deactivated',
      })
      throw httpError(403, 'This account is deactivated. Please contact the cafe owner.')
    }

    if (!user.role) user.role = 'owner'
    user.lastLoginAt = new Date()
    setSession(res, user, await rotateRefresh(user))
    await logAction(req, 'auth.login', { actor: publicUser(user), detail: `Signed in from ${req.ip || 'unknown IP'}` })
    void notifyOwner('Admin login', `${user.email} signed in from ${req.ip || 'unknown IP'}.`)
    res.json(publicUser(user))
  })
)

// Rotate a valid refresh token into a new session.
router.post(
  '/refresh',
  refreshLimiter,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH]
    if (!token) throw httpError(401, 'Session expired')

    const hash = sha256(token)
    const user = await User.findOne({
      $or: [{ refreshTokenHash: hash }, { previousRefreshHash: hash }],
      refreshTokenExpires: { $gt: new Date() },
    })
    if (!user || !user.isActive) {
      clearSession(res)
      throw httpError(401, 'Session expired')
    }

    if (user.previousRefreshHash === hash) {
      revokeSessions(user)
      await user.save()
      await logAction(req, 'auth.refresh-reuse', {
        outcome: 'failure',
        actor: publicUser(user),
        detail: 'Refresh token reuse detected; all sessions revoked',
      })
      clearSession(res)
      throw httpError(401, 'Session expired')
    }

    setSession(res, user, await rotateRefresh(user))
    res.json(publicUser(user))
  })
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH]
    if (token) {
      const user = await User.findOne({ refreshTokenHash: sha256(token) })
      if (user) {
        revokeSessions(user)
        await user.save()
        await logAction(req, 'auth.logout', { actor: publicUser(user) })
      }
    }
    clearSession(res)
    res.json({ message: 'Logged out' })
  })
)

router.post(
  '/change-password',
  protect,
  loginLimiter,
  validate(schemas.changePassword),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
    if (!user) throw httpError(401, 'Not authorized')
    if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
      await logAction(req, 'auth.password-change-failed', {
        outcome: 'failure',
        actor: publicUser(user),
        detail: 'Current password did not match',
      })
      throw httpError(400, 'Current password is incorrect')
    }

    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12)
    user.passwordChangedAt = new Date()
    revokeSessions(user)
    await user.save()
    await logAction(req, 'auth.password-change', {
      actor: publicUser(user),
      detail: 'Changed their own password',
    })
    void notifyOwner('Admin password changed', `${user.email} changed their password.`)
    clearSession(res)
    res.json({ message: 'Password updated' })
  })
)

// Email a password reset link when email is configured.
router.post(
  '/forgot-password',
  loginLimiter,
  validate(schemas.forgot),
  asyncHandler(async (req, res) => {
    const emailEnabled = mailConfigured()

    if (emailEnabled) {
      const user = await User.findOne({ email: req.body.email })
      if (user) {
        const token = crypto.randomBytes(32).toString('hex')
        user.resetTokenHash = sha256(token)
        user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000)
        await user.save()

        const siteUrl =
          process.env.SITE_URL ||
          (process.env.CLIENT_ORIGIN || '').split(',')[0].trim() ||
          `${req.protocol}://${req.get('host')}`

        await sendMail({
          to: user.email,
          subject: 'Reset your Sathi Cafe admin password',
          text: [
            'Someone asked to reset the admin password for Sathi Cafe.',
            'Open this link to choose a new one (it works for 30 minutes):',
            '',
            `${siteUrl.replace(/\/+$/, '')}/admin/reset-password/${token}`,
            '',
            "If this wasn't you, ignore this email and nothing will change.",
          ].join('\n'),
        })
      }
    }

    await logAction(req, 'auth.password-reset-requested', {
      outcome: 'success',
      actor: { email: req.body.email },
      detail: emailEnabled ? 'Reset email requested' : 'Reset unavailable: email not configured',
    })

    res.json({
      emailEnabled,
      message: emailEnabled
        ? 'If that email belongs to an admin, a reset link is on its way.'
        : 'Email delivery is not set up yet. Please ask the cafe owner to reset the password using the admin runbook.',
    })
  })
)

// Set a new password using a valid reset link.
router.post(
  '/reset-password/:token',
  loginLimiter,
  validate(schemas.reset),
  asyncHandler(async (req, res) => {
    if (!/^[a-f0-9]{64}$/i.test(req.params.token)) {
      throw httpError(400, 'This reset link is invalid')
    }

    const user = await User.findOne({
      resetTokenHash: sha256(req.params.token),
      resetTokenExpires: { $gt: new Date() },
    })
    if (!user) throw httpError(400, 'This reset link is invalid or has expired')

    user.passwordHash = await bcrypt.hash(req.body.password, 12)
    user.passwordChangedAt = new Date()
    revokeSessions(user)
    user.resetTokenHash = undefined
    user.resetTokenExpires = undefined
    await user.save()
    await logAction(req, 'auth.password-reset-complete', { actor: publicUser(user) })
    clearSession(res)

    void notifyOwner('Admin password changed', `${user.email} set a new password.`)
    res.json({ message: 'Password updated' })
  })
)

export default router
