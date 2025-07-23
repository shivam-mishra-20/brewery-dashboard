import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  name: string
  type: 'menu' | 'inventory'
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: { type: String, enum: ['menu', 'inventory'], required: true },
})

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', CategorySchema)