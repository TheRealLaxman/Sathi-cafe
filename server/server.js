import './config/env.js'
import mongoose from 'mongoose'
import app from './app.js'
import connectDB from './config/db.js'
import { ensureUploadDir } from './config/uploads.js'

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env')
  process.exit(1)
}

try {
  await ensureUploadDir()
} catch (err) {
  console.error('Upload directory setup failed:', err.message)
  process.exit(1)
}

try {
  await connectDB()
} catch (err) {
  console.error('MongoDB connection failed:', err.message)
  process.exit(1)
}

const PORT = process.env.PORT || 5000
const host = process.env.HOST || '127.0.0.1'
const server = app.listen(PORT, host, () => console.log(`Server listening on ${host}:${PORT}`))

// Close the server and disconnect before exiting.
async function shutdown() {
  server.close(async () => {
    await mongoose.disconnect()
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
