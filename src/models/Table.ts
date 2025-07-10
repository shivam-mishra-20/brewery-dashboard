import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ITable extends Document {
  name: string
  number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  qrCode?: string
  location?: string
  createdAt: Date
  updatedAt: Date
  statusHistory: {
    status: 'available' | 'occupied' | 'reserved' | 'maintenance'
    timestamp: Date
  }[]
}

const TableSchema: Schema<ITable> = new Schema({
  name: { type: String, required: true },
  number: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available',
  },
  qrCode: { type: String },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
      },
      timestamp: { type: Date, default: Date.now },
    },
  ],
})

// Update the updatedAt field on save
TableSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export const Table: Model<ITable> =
  mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema)
