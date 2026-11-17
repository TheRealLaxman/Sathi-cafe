import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    // date is YYYY-MM-DD, time is HH:mm
    date: { type: String, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true, min: 1, max: 20 },
    note: { type: String, default: '', maxlength: 300 },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
)

export default mongoose.model('Reservation', reservationSchema)
