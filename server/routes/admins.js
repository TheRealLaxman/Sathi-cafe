import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import protect from '../middleware/auth.js'
import { requirePermission } from '../middleware/authorize.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { schemas } from '../validators.js'
import { httpError } from '../utils/httpError.js'
import { PERMISSIONS, manageableRolesBy } from '../config/roles.js'
import { logAction } from '../services/audit.js'
import { notifyOwner } from '../services/notify.js'

const router = Router()

// Shape an admin record for API responses.
const sanitize = (admin) => ({
  id: String(admin.id || admin._id),
  email: admin.email,
  displayName: admin.displayName || '',
  role: admin.role || 'owner',
  isActive: admin.isActive !== false,
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
})

// Invalidate all sessions for an admin.
function revokeSessions(admin) {
  admin.refreshTokenHash = undefined
  admin.previousRefreshHash = undefined
  admin.refreshTokenExpires = undefined
  admin.tokenVersion = (admin.tokenVersion || 0) + 1
}

router.get(
  '/',
  protect,
  requirePermission(PERMISSIONS.adminsRead),
  asyncHandler(async (req, res) => {
    const admins = await User.find().sort({ createdAt: 1 }).lean()
    res.json(admins.map(sanitize))
  })
)

router.post(
  '/',
  protect,
  requirePermission(PERMISSIONS.adminsWrite),
  validate(schemas.adminCreate),
  asyncHandler(async (req, res) => {
    const { email, displayName, role, password } = req.body
    if (!manageableRolesBy(req.user.role).includes(role)) {
      throw httpError(403, 'You cannot assign that role')
    }

    let admin
    try {
      admin = await User.create({
        email,
        displayName,
        role,
        passwordHash: await bcrypt.hash(password, 12),
        createdBy: req.user.id,
      })
    } catch (err) {
      if (err.code === 11000) throw httpError(409, 'An admin with that email already exists')
      throw err
    }

    await logAction(req, 'admin.create', {
      target: { id: admin._id.toString(), email: admin.email, role: admin.role },
      detail: `Created as ${admin.role}`,
    })
    void notifyOwner('New admin account', `${admin.email} was added as ${admin.role} by ${req.user.email}.`)
    res.status(201).json(sanitize(admin))
  })
)

router.patch(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.adminsWrite),
  validate(schemas.adminUpdate),
  asyncHandler(async (req, res) => {
    const admin = await User.findById(req.params.id)
    if (!admin) throw httpError(404, 'Admin not found')
    if (admin._id.toString() === req.user.id) {
      throw httpError(400, 'Use Account settings to change your own details')
    }

    const manageable = manageableRolesBy(req.user.role)
    if (!manageable.includes(admin.role || 'owner')) {
      throw httpError(403, 'You cannot manage this admin')
    }

    const { displayName, role, isActive } = req.body
    if (role !== undefined && !manageable.includes(role)) {
      throw httpError(403, 'You cannot assign that role')
    }

    const roleChanged = role !== undefined && role !== (admin.role || 'owner')
    const activeChanged = isActive !== undefined && isActive !== (admin.isActive !== false)
    const ownerLosingAccess =
      (admin.role || 'owner') === 'owner' && (roleChanged || (activeChanged && !isActive))

    if (ownerLosingAccess) {
      const activeOwners = await User.countDocuments({ role: 'owner', isActive: true })
      if (activeOwners <= 1) throw httpError(400, 'At least one active owner is required')
    }

    const changes = []
    if (displayName !== undefined) {
      admin.displayName = displayName
      changes.push('display name')
    }
    if (roleChanged) {
      admin.role = role
      changes.push(`role ${role}`)
    }
    if (activeChanged) {
      admin.isActive = isActive
      changes.push(isActive ? 'reactivated' : 'deactivated')
    }
    if (roleChanged || activeChanged) revokeSessions(admin)
    await admin.save()

    await logAction(req, 'admin.update', {
      target: { id: admin._id.toString(), email: admin.email, role: admin.role },
      detail: `Updated ${changes.join(', ') || 'account'}`,
    })
    void notifyOwner('Admin account updated', `${admin.email}: ${changes.join(', ') || 'updated'} by ${req.user.email}.`)
    res.json(sanitize(admin))
  })
)

router.post(
  '/:id/reset-password',
  protect,
  requirePermission(PERMISSIONS.adminsWrite),
  validate(schemas.adminPasswordReset),
  asyncHandler(async (req, res) => {
    const admin = await User.findById(req.params.id)
    if (!admin) throw httpError(404, 'Admin not found')
    if (admin._id.toString() === req.user.id) {
      throw httpError(400, 'Use Account settings to change your own password')
    }
    if (!manageableRolesBy(req.user.role).includes(admin.role || 'owner')) {
      throw httpError(403, 'You cannot manage this admin')
    }

    admin.passwordHash = await bcrypt.hash(req.body.password, 12)
    admin.passwordChangedAt = new Date()
    admin.resetTokenHash = undefined
    admin.resetTokenExpires = undefined
    revokeSessions(admin)
    await admin.save()

    await logAction(req, 'admin.password-reset', {
      target: { id: admin._id.toString(), email: admin.email, role: admin.role },
      detail: 'Password reset by another admin',
    })
    void notifyOwner('Admin password reset', `${admin.email}'s password was reset by ${req.user.email}.`)
    res.json({ message: 'Password updated' })
  })
)

router.delete(
  '/:id',
  protect,
  requirePermission(PERMISSIONS.adminsWrite),
  asyncHandler(async (req, res) => {
    const admin = await User.findById(req.params.id)
    if (!admin) throw httpError(404, 'Admin not found')
    if (admin._id.toString() === req.user.id) {
      throw httpError(400, 'You cannot delete your own account')
    }
    if (!manageableRolesBy(req.user.role).includes(admin.role || 'owner')) {
      throw httpError(403, 'You cannot manage this admin')
    }
    if ((admin.role || 'owner') === 'owner') {
      const owners = await User.countDocuments({ role: 'owner' })
      const activeOwners = await User.countDocuments({ role: 'owner', isActive: true })
      if (owners <= 1 || (admin.isActive !== false && activeOwners <= 1)) {
        throw httpError(400, 'At least one active owner is required')
      }
    }

    await admin.deleteOne()

    await logAction(req, 'admin.delete', {
      target: { id: admin._id.toString(), email: admin.email, role: admin.role },
      detail: `Deleted ${admin.email}`,
    })
    void notifyOwner('Admin account deleted', `${admin.email} was deleted by ${req.user.email}.`)
    res.json({ message: 'Admin deleted' })
  })
)

export { sanitize }
export default router
