import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { MenuItemModel } from '@/models/MenuItemModel'

// Define a type for the menu item document
interface MenuItemDoc {
  _id: string | { toString(): string }
  name: string
  description: string
  price: number
  category: string
  image?: string
  imageURL?: string
  images?: string[]
  imageURLs?: string[]
  available: boolean
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = {}
    if (category && category !== 'All') {
      // Filter by category if provided and not 'All'
      query = { category }
    }

    // Use withDBRetry to handle connection issues automatically
    const items = await withDBRetry(async () => {
      // Query MongoDB using Mongoose
      const menuItems = await MenuItemModel.find(query)
        .sort({ createdAt: -1 })
        .lean()

      // Map MongoDB documents to the expected format
      return menuItems.map((item: MenuItemDoc & { [key: string]: any }) => ({
        id: typeof item._id === 'string' ? item._id : item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || '',
        imageURL: item.imageURL || '',
        images: item.images || [],
        imageURLs: item.imageURLs || [],
        videoUrl: item.videoUrl || '',
        videoThumbnailUrl: item.videoThumbnailUrl || '',
        available: item.available,
        ingredients: item.ingredients || [],
        addOns: (item.addOns || []).map((addon: any) => ({
          name: addon.name,
          price: addon.price,
          available: addon.available,
          quantity: addon.quantity,
          unit: addon.unit,
          inventoryItemId: addon.inventoryItemId,
        })),
        createdAt: item.createdAt?.toISOString?.() || '',
        updatedAt: item.updatedAt?.toISOString?.() || '',
      }))
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch menu items',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
