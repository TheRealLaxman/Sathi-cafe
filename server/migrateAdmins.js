import './config/env.js'
import mongoose from 'mongoose'
import User from './models/User.js'

const { MONGO_URI } = process.env
if (!MONGO_URI) {
  console.error('Set MONGO_URI in .env first')
  process.exit(1)
}

await mongoose.connect(MONGO_URI)

const result = await User.updateMany(
  { createdBy: { $exists: false }, role: { $ne: 'owner' } },
  { $set: { role: 'owner', isActive: true } }
)

console.log(`Migrated ${result.modifiedCount || 0} existing admin account(s) to owner.`)
await mongoose.disconnect()
