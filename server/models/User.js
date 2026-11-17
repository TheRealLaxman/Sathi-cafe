import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
