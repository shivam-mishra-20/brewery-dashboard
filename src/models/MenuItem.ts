import { MenuItemIngredient } from './InventoryItem'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string // legacy: first image name
  imageURL: string // legacy: first image URL
  images: string[] // all image file names
  imageURLs: string[] // all image URLs
  videoUrl?: string // URL to the recipe/promotional video
  videoThumbnailUrl?: string // URL to video thumbnail
  available: boolean
  createdAt?: string
  updatedAt?: string
  ingredients?: MenuItemIngredient[] // Ingredients from inventory
}

export interface MenuItemFormData {
  name: string
  description: string
  price: string | number
  category: string
  images: File[] // Up to 3 images
  imageURLs?: string[] // For preview, optional
  videoFile?: File | null // Recipe/promotional video
  videoUrl?: string // For existing video
  videoThumbnailUrl?: string // For video thumbnail
  available: boolean
  ingredients?: MenuItemIngredient[] // Ingredients from inventory
}

export const DEFAULT_CATEGORIES = [
  'Coffee',
  'Tea',
  'Bakery',
  'Snacks',
  'Desserts',
  'Breakfast',
  'Lunch',
  'Beverages',
]
