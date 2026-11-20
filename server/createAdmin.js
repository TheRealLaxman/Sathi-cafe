import './config/env.js'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import AuditLog from './models/AuditLog.js'
import { ROLES } from './config/roles.js'

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE = 'owner', MONGO_URI } = process.env

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first')
  process.exit(1)
}

if (!ROLES.includes(ADMIN_ROLE)) {
  console.error(`ADMIN_ROLE must be one of: ${ROLES.join(', ')}`)
  process.exit(1)
}

await mongoose.connect(MONGO_URI)

const email = ADMIN_EMAIL.toLowerCase()
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

await User.findOneAndUpdate(
  { email },
  {
    $set: { passwordHash, role: ADMIN_ROLE, isActive: true, passwordChangedAt: new Date() },
    $inc: { tokenVersion: 1 },
    $unset: {
      refreshTokenHash: '',
      previousRefreshHash: '',
      refreshTokenExpires: '',
      resetTokenHash: '',
      resetTokenExpires: '',
    },
  },
  { upsert: true, runValidators: true }
)

await AuditLog.create({
  action: 'admin.bootstrap',
  actor: { email, role: ADMIN_ROLE },
  outcome: 'success',
  detail: 'Bootstrap admin created or password reset',
})

console.log(`Admin ready: ${email} (${ADMIN_ROLE})`)
await mongoose.disconnect()
