import mongoose, { Document, Schema } from 'mongoose'

interface IBatchInventoryItem {
  inventoryItemId: mongoose.Types.ObjectId
  quantity: number
  costPerUnit: number
}

export interface IBatchInventoryUpdate extends Document {
  name: string
  items: IBatchInventoryItem[]
  notes: string
  performedBy: string
  status: 'pending' | 'completed' | 'cancelled'
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const BatchInventoryItemSchema = new Schema({
  inventoryItemId: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  quantity: { type: Number, required: true },
  costPerUnit: { type: Number, required: true },
})

const BatchInventoryUpdateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    items: [BatchInventoryItemSchema],
    notes: { type: String },
    performedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.models.BatchInventoryUpdate ||
  mongoose.model<IBatchInventoryUpdate>(
    'BatchInventoryUpdate',
    BatchInventoryUpdateSchema,
  )
