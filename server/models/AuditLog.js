import mongoose from 'mongoose'

const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS) || 180

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      role: String,
    },
    action: { type: String, required: true, maxlength: 80, index: true },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success' },
    target: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      role: String,
    },
    ip: String,
    userAgent: String,
    detail: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 })

export default mongoose.model('AuditLog', auditLogSchema)
