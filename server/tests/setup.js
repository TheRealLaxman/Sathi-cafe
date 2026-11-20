import { afterAll, afterEach, beforeAll } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-for-tests-only'
process.env.CLIENT_ORIGIN = ''
process.env.SMTP_HOST = ''
process.env.SITE_URL = 'http://localhost:5173'

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections)
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
