import { NextResponse } from 'next/server'
import { connectDB, disconnectDB } from '@/lib/mongodb'
import { MenuItemModel } from '@/models/MenuItemModel'

// This endpoint will migrate all menu items to use the images and imageURLs arrays
export async function GET() {
  try {
    await connectDB()

    // Find all menu items that don't have images array populated
    const menuItems = await MenuItemModel.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { imageURLs: { $exists: false } },
        { imageURLs: { $size: 0 } },
      ],
    })

    const results = []

    // Update each menu item to include the arrays if needed
    for (const item of menuItems) {
      // Build images array from image field
      if ((!item.images || item.images.length === 0) && item.image) {
        item.images = [item.image]
      }

      // Build imageURLs array from imageURL field
      if ((!item.imageURLs || item.imageURLs.length === 0) && item.imageURL) {
        item.imageURLs = [item.imageURL]
      }

      // Save the updated document
      await item.save()

      results.push({
        id: (item._id as { toString: () => string }).toString(),
        name: item.name,
        imagesBefore:
          !item.images || item.images.length === 0
            ? 'empty'
            : item.images.length,
        imagesAfter: item.images.length,
        imageURLsBefore:
          !item.imageURLs || item.imageURLs.length === 0
            ? 'empty'
            : item.imageURLs.length,
        imageURLsAfter: item.imageURLs.length,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete',
      itemsUpdated: results.length,
      details: results,
    })
  } catch (error) {
    console.error('Error migrating menu items:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate menu items',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  } finally {
    await disconnectDB()
  }
}
