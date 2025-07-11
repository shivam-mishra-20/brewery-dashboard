import mongoose, { Document, Schema } from 'mongoose'

export interface ISupplier extends Document {
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  notes: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.models.Supplier ||
  mongoose.model<ISupplier>('Supplier', SupplierSchema)
