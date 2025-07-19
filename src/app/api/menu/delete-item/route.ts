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
    if (menuItem.imageURLs && menuItem.imageURLs.length > 0) {
      // Use imageURLs instead of images for deletion since these contain the full storage paths
      for (const imageUrl of menuItem.imageURLs) {
        try {
          // Extract the storage path from the URL
          // This is necessary because Firebase Storage URLs contain token parameters
          // The ref function needs the storage path, not the full download URL
          
          // Parse the URL to extract just the path
          const parsedUrl = new URL(imageUrl);
          const pathMatch = parsedUrl.pathname.match(/o\/([^?]+)/);
          
          if (pathMatch && pathMatch[1]) {
            // Decode the URL-encoded path
            const storagePath = decodeURIComponent(pathMatch[1]);
            console.log(`Deleting image at storage path: ${storagePath}`);
            
            const imageRef = ref(storage, storagePath);
            await deleteObject(imageRef);
          } else {
            console.error(`Could not parse storage path from URL: ${imageUrl}`);
          }
        } catch (error) {
          console.error(
            `Error deleting image URL ${imageUrl} (continuing):`,
            error,
          )
        }
      }
    } else if (menuItem.imageURL) {
      // Fallback for legacy items that only have imageURL
      try {
        // Parse the URL to extract just the path
        const parsedUrl = new URL(menuItem.imageURL);
        const pathMatch = parsedUrl.pathname.match(/o\/([^?]+)/);
        
        if (pathMatch && pathMatch[1]) {
          const storagePath = decodeURIComponent(pathMatch[1]);
          console.log(`Deleting legacy image at storage path: ${storagePath}`);
          
          const imageRef = ref(storage, storagePath);
          await deleteObject(imageRef);
        } else {
          console.error(`Could not parse storage path from URL: ${menuItem.imageURL}`);
        }
      } catch (error) {
        console.error('Error deleting legacy image (continuing):', error)
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
