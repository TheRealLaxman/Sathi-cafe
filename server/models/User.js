import mongoose from 'mongoose'
import { ROLES } from '../config/roles.js'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true, maxlength: 80, default: '' },
    role: { type: String, enum: ROLES, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    tokenVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
    refreshTokenHash: { type: String },
    previousRefreshHash: { type: String },
    refreshTokenExpires: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
