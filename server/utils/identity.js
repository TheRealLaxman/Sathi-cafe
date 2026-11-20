import { permissionsFor } from '../config/roles.js'

// Return user fields safe for clients.
export function publicUser(user) {
  const role = user.role || 'owner'
  return {
    id: String(user.id || user._id),
    email: user.email,
    displayName: user.displayName || '',
    role,
    permissions: permissionsFor(role),
  }
}
