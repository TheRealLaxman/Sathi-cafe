import mongoose from 'mongoose'

// Connect to MongoDB or exit on failure.
export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }
}