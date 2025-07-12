import mongoose, { Document, Model, Schema } from 'mongoose'
import { MenuItemIngredient } from './InventoryItem'
import { DEFAULT_CATEGORIES } from './MenuItem'

// Interface for add-on items that can be added to menu items
export interface AddOnItem {
  name: string
  price: number
  available: boolean
  quantity: number
  unit: string
  inventoryItemId: string
}

export interface IMenuItem extends Document {
  name: string
  description: string
  price: number
  category: string
  image: string // legacy: first image name
  imageURL: string // legacy: first image URL
  images: string[] // array of image file names - required
  imageURLs: string[] // array of image URLs - required
  videoUrl?: string // URL to the recipe/promotional video
  videoThumbnailUrl?: string // URL to video thumbnail
  available: boolean
  ingredients?: MenuItemIngredient[] // Ingredients from inventory
  addOns?: AddOnItem[] // Optional add-on items with their own prices, quantity, unit, inventory link
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
    videoUrl: { type: String, default: '' },
    videoThumbnailUrl: { type: String, default: '' },
    available: { type: Boolean, default: true },
    ingredients: {
      type: [
        {
          inventoryItemId: { type: String, required: true },
          inventoryItemName: { type: String, required: true },
          quantity: { type: Number, required: true },
          unit: { type: String, required: true },
        },
      ],
      default: [],
    },
    addOns: {
      type: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          available: { type: Boolean, default: true },
          quantity: { type: Number, required: true },
          unit: { type: String, required: true },
          inventoryItemId: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
)

export const MenuItemModel: Model<IMenuItem> =
  mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>('MenuItem', MenuItemSchema)
