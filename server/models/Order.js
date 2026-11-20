import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, default: '', trim: true, maxlength: 120 },
    note: { type: String, default: '', maxlength: 300 },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['new', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'new',
    },
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)
