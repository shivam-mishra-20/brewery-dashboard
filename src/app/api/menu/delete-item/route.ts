import { deleteObject, ref } from 'firebase/storage'
import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/firebase'
import { withDBRetry } from '@/lib/mongodb'
import { MenuItemModel } from '@/models/MenuItemModel'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 },
      )
    }

    // Find the document in MongoDB using withDBRetry
    const menuItem = await withDBRetry(async () => {
      const item = await MenuItemModel.findById(id)
      if (!item) {
        throw new Error('Menu item not found')
      }
      return item
    }).catch((error) => {
      if (error.message === 'Menu item not found') {
        return null
      }
      throw error
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 },
      )
    }

    // Delete all images from storage if they exist
    if (menuItem.images && menuItem.images.length > 0) {
      // Delete all images using the images array
      for (const imagePath of menuItem.images) {
        try {
          const imageRef = ref(storage, imagePath)
          await deleteObject(imageRef)
        } catch (error) {
          console.error(
            `Error deleting image ${imagePath} (continuing):`,
            error,
          )
        }
      }
    } else if (menuItem.imageURL) {
      // Fallback for legacy items that only have imageURL
      try {
        const imageRef = ref(storage, menuItem.imageURL)
        await deleteObject(imageRef)
      } catch (error) {
        console.error('Error deleting image (continuing):', error)
      }
    }

    // Delete document from MongoDB with retry
    await withDBRetry(async () => {
      await MenuItemModel.findByIdAndDelete(id)
    })

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete menu item',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
