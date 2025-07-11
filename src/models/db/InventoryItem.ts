import mongoose, { Document, Schema } from 'mongoose'

export interface IInventoryItem extends Document {
  name: string
  quantity: number
  unit: string
  costPerUnit: number
  category: string
  reorderPoint: number
  autoReorderThreshold: number
  autoReorderNotify: boolean
  autoReorderQuantity: number
  supplier: mongoose.Types.ObjectId
  lastRestocked: Date
  sku: string
  location: string
  createdAt: Date
  updatedAt: Date
}

const InventoryItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    costPerUnit: { type: Number, required: true },
    category: { type: String, required: true },
    reorderPoint: { type: Number, required: true },
    autoReorderThreshold: { type: Number, default: 0 },
    autoReorderNotify: { type: Boolean, default: false },
    autoReorderQuantity: { type: Number, default: 0 },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
    lastRestocked: { type: Date, default: Date.now },
    sku: { type: String },
    location: { type: String },
  },
  { timestamps: true },
)

export default mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema)
