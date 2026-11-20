import { Router } from 'express'
import AuditLog from '../models/AuditLog.js'
import protect from '../middleware/auth.js'
import { requirePermission } from '../middleware/authorize.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { httpError } from '../utils/httpError.js'
import { PERMISSIONS } from '../config/roles.js'

const router = Router()

// List recent audit entries with cursor pagination.
router.get(
  '/',
  protect,
  requirePermission(PERMISSIONS.auditRead),
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
    const cursor = String(req.query.cursor || '')
    if (cursor && !/^[a-f\d]{24}$/i.test(cursor)) throw httpError(400, 'Invalid cursor')

    const items = await AuditLog.find(cursor ? { _id: { $lt: cursor } } : {})
      .sort({ _id: -1 })
      .limit(limit)
      .lean()

    res.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        action: item.action,
        outcome: item.outcome,
        actor: item.actor,
        target: item.target,
        detail: item.detail,
        ip: item.ip,
        createdAt: item.createdAt,
      })),
      nextCursor: items.length === limit ? items[items.length - 1]._id.toString() : null,
    })
  })
)

export default router
