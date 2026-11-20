import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { permissionsFor } from '../config/roles.js'
import asyncHandler from './asyncHandler.js'
import { httpError } from '../utils/httpError.js'

// Authenticate the request and attach the user.
export default asyncHandler(async (req, res, next) => {
  const token = req.cookies?.sathi_access
  if (!token) throw httpError(401, 'Not authorized')

  let claims
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw httpError(401, 'Your session has expired. Please log in again.')
  }

  const user = await User.findById(claims.id).select('tokenVersion role isActive displayName')
  if (!user || !user.isActive || user.tokenVersion !== claims.v) {
    throw httpError(401, 'Your session has expired. Please log in again.')
  }

  if (!user.role) {
    user.role = 'owner'
    await user.save()
  }

  req.user = {
    id: claims.id,
    email: claims.email,
    displayName: user.displayName || '',
    role: user.role,
    permissions: permissionsFor(user.role),
  }
  next()
})
