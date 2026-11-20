export const ROLES = ['owner', 'manager', 'kitchen', 'front-desk', 'content']

export const PERMISSIONS = Object.freeze({
  reservationsRead: 'reservations:read',
  reservationsWrite: 'reservations:write',
  reservationsDelete: 'reservations:delete',
  messagesRead: 'messages:read',
  messagesDelete: 'messages:delete',
  ordersRead: 'orders:read',
  ordersWrite: 'orders:write',
  ordersDelete: 'orders:delete',
  menuRead: 'menu:read',
  menuWrite: 'menu:write',
  menuDelete: 'menu:delete',
  uploadsRead: 'uploads:read',
  uploadsWrite: 'uploads:write',
  adminsRead: 'admins:read',
  adminsWrite: 'admins:write',
  auditRead: 'audit:read',
})

const all = Object.values(PERMISSIONS)

export const ROLE_PERMISSIONS = Object.freeze({
  owner: all,
  manager: all,
  kitchen: [PERMISSIONS.ordersRead, PERMISSIONS.ordersWrite],
  'front-desk': [
    PERMISSIONS.reservationsRead,
    PERMISSIONS.reservationsWrite,
    PERMISSIONS.messagesRead,
    PERMISSIONS.messagesDelete,
  ],
  content: [
    PERMISSIONS.menuRead,
    PERMISSIONS.menuWrite,
    PERMISSIONS.menuDelete,
    PERMISSIONS.uploadsRead,
    PERMISSIONS.uploadsWrite,
  ],
})

export const STAFF_ROLES = ROLES.filter((role) => role !== 'owner' && role !== 'manager')

// Return permissions granted to a role.
export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || []
}

// Return roles this role can manage.
export function manageableRolesBy(role) {
  return role === 'owner' ? ROLES : STAFF_ROLES
}
