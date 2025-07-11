import mongoose, { Document, Schema } from 'mongoose'

export interface IReorderNotification extends Document {
  inventoryItem: mongoose.Types.ObjectId
  quantityNeeded: number
  currentQuantity: number
  reorderPoint: number
  autoReorderThreshold: number
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  supplier: mongoose.Types.ObjectId
  notifiedAt: Date
  orderedAt?: Date
  receivedAt?: Date
  orderReference?: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

const ReorderNotificationSchema: Schema = new Schema(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    quantityNeeded: { type: Number, required: true },
    currentQuantity: { type: Number, required: true },
    reorderPoint: { type: Number, required: true },
    autoReorderThreshold: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'ordered', 'received', 'cancelled'],
      default: 'pending',
    },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    notifiedAt: { type: Date, default: Date.now },
    orderedAt: { type: Date },
    receivedAt: { type: Date },
    orderReference: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
)

export default mongoose.models.ReorderNotification ||
  mongoose.model<IReorderNotification>(
    'ReorderNotification',
    ReorderNotificationSchema,
  )
