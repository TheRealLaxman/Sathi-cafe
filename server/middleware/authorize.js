import { httpError } from '../utils/httpError.js'

const denied = () => httpError(403, 'You do not have access to this action')

// Require every listed permission.
export const requirePermission = (...required) => (req, res, next) => {
  const have = req.user?.permissions || []
  return required.every((permission) => have.includes(permission)) ? next() : next(denied())
}

// Require one of the listed roles.
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(denied())
