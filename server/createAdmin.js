import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'

dotenv.config()

const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first')
  process.exit(1)
}

await mongoose.connect(MONGO_URI)
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
await User.findOneAndUpdate(
  { email: ADMIN_EMAIL.toLowerCase() },
  { passwordHash },
  { upsert: true }
)
console.log('Admin ready:', ADMIN_EMAIL)
await mongoose.disconnect()
