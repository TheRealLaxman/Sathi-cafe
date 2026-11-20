import './config/env.js'
import mongoose from 'mongoose'
import MenuItem from './models/MenuItem.js'
import { menu } from '../src/data/menu.js'

const force = process.argv.includes('--force')

if (process.env.NODE_ENV === 'production') {
  console.error('Seeding is disabled in production')
  process.exit(1)
}

await mongoose.connect(process.env.MONGO_URI)

const count = await MenuItem.countDocuments()
if (count > 0 && !force) {
  console.log(`Menu already has ${count} items, so seeding was skipped.`)
  console.log('To wipe and reseed on purpose, run: node seed.js --force')
  await mongoose.disconnect()
  process.exit(0)
}

if (force) await MenuItem.deleteMany({})
await MenuItem.insertMany(menu.map(({ id, ...rest }) => rest))
console.log(`Seeded ${menu.length} items`)
await mongoose.disconnect()