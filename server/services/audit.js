import AuditLog from '../models/AuditLog.js'

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '')

// Record an action in the audit log.
export async function logAction(req, action, options = {}) {
  const actor = options.actor || req.user || {}
  const target = options.target || {}

  try {
    await AuditLog.create({
      actor: {
        id: actor.id,
        email: text(actor.email, 120),
        role: text(actor.role, 40),
      },
      action: text(action, 80),
      outcome: options.outcome || 'success',
      target: target.id || target.email
        ? {
            id: target.id,
            email: text(target.email, 120),
            role: text(target.role, 40),
          }
        : undefined,
      ip: text(req.ip, 60),
      userAgent: text(req.get?.('user-agent'), 300),
      detail: text(options.detail, 500),
    })
  } catch (err) {
    console.error('Audit log failed:', err.message)
  }
}
