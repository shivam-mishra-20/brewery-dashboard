import mongoose, { Document, Model, Schema } from 'mongoose'
import { DEFAULT_CATEGORIES } from './MenuItem'

export interface IMenuItem extends Document {
  name: string
  description: string
  price: number
  category: string
  image: string // legacy: first image name
  imageURL: string // legacy: first image URL
  images: string[] // array of image file names - required
  imageURLs: string[] // array of image URLs - required
  available: boolean
  createdAt: Date
  updatedAt: Date
}

const MenuItemSchema: Schema<IMenuItem> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: [...DEFAULT_CATEGORIES, 'Other'],
    },
    image: { type: String, default: '' },
    imageURL: { type: String, default: '' },
    images: { type: [String], required: true, default: [] },
    imageURLs: { type: [String], required: true, default: [] },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const MenuItemModel: Model<IMenuItem> =
  mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>('MenuItem', MenuItemSchema)
