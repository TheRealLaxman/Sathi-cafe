import './config/env.js'
import mongoose from 'mongoose'
import app from './app.js'
import connectDB from './config/db.js'

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env')
  process.exit(1)
}

await connectDB()

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
