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
  available: boolean
  createdAt?: string
  updatedAt?: string
}

export interface MenuItemFormData {
  name: string
  description: string
  price: string | number
  category: string
  images: File[] // Up to 3 images
  imageURLs?: string[] // For preview, optional
  available: boolean
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
