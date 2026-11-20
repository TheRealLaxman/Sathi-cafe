import mongoose from 'mongoose'

// Connect to MongoDB; callers decide how to handle a failure.
export default async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  console.log('MongoDB connected')
}

let connecting

// Reuse one connection across warm serverless invocations.
export async function readyDB() {
  if (mongoose.connection.readyState === 1) return
  if (!connecting) {
    connecting = connectDB().finally(() => {
      connecting = undefined
    })
  }
  await connecting
}