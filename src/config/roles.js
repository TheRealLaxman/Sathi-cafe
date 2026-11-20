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

export const ROLE_LABELS = Object.freeze({
  owner: 'Owner',
  manager: 'Manager',
  kitchen: 'Kitchen',
  'front-desk': 'Front Desk',
  content: 'Content',
})

export const ROLES = Object.keys(ROLE_LABELS)
export const STAFF_ROLES = ROLES.filter((role) => role !== 'owner' && role !== 'manager')

export const manageableRoles = (role) => (role === 'owner' ? ROLES : STAFF_ROLES)
