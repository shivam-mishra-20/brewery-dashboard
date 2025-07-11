import mongoose, { Document, Schema } from 'mongoose'

export interface IInventoryTransaction extends Document {
  inventoryItem: mongoose.Types.ObjectId
  type: 'restock' | 'usage' | 'adjustment' | 'waste'
  quantity: number
  previousQuantity: number
  newQuantity: number
  unitCost: number
  totalCost: number
  notes: string
  performedBy: string
  batchId?: string
  menuItemId?: mongoose.Types.ObjectId
  createdAt: Date
}

const InventoryTransactionSchema: Schema = new Schema({
  inventoryItem: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  type: {
    type: String,
    enum: ['restock', 'usage', 'adjustment', 'waste'],
    required: true,
  },
  quantity: { type: Number, required: true },
  previousQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  notes: { type: String },
  performedBy: { type: String, required: true },
  batchId: { type: String },
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>(
    'InventoryTransaction',
    InventoryTransactionSchema,
  )
