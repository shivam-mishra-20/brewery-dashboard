import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import mime from 'mime-types'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '@/lib/firebase'
import { withDBRetry } from '@/lib/mongodb'
import InventoryItem from '@/models/db/InventoryItem'
import { MenuItemIngredient } from '@/models/InventoryItem'
import { MenuItemModel } from '@/models/MenuItemModel'

export async function POST(request: NextRequest) {
  try {
    // Get form data (multipart/form-data)
    const formData = await request.formData()

    // Extract ID and other fields from form data
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const category = formData.get('category') as string
    const available = formData.get('available') === 'true'

    // Get existing image URLs if provided
    const existingImageURLsStr = formData.get('existingImageURLs') as
      | string
      | null
    const existingImageURLs = existingImageURLsStr
      ? (JSON.parse(existingImageURLsStr) as string[])
      : []

    // Support up to 3 images
    const images: File[] = []
    for (let i = 0; i < 3; i++) {
      const img = formData.get(`image${i}`) as File | null
      if (img && img.size > 0) images.push(img)
    }

    // Get video file and existing video URL
    const videoFile = formData.get('video') as File | null
    const existingVideoUrl = formData.get('existingVideoUrl') as string | null
    const existingVideoThumbnailUrl = formData.get(
      'existingVideoThumbnailUrl',
    ) as string | null
    
    // Get the add-ons if provided
    const addOnsStr = formData.get('addOns') as string | null
    const addOns = addOnsStr ? JSON.parse(addOnsStr) : []

    // Get the ingredients if provided
    const ingredientsStr = formData.get('ingredients') as string | null
    const ingredients = ingredientsStr
      ? (JSON.parse(ingredientsStr) as MenuItemIngredient[])
      : []

    // Validate required fields
    if (!id || !name || !description || isNaN(price) || !category) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: {
            id: !id ? 'Item ID is required' : null,
            name: !name ? 'Name is required' : null,
            description: !description ? 'Description is required' : null,
            price: isNaN(price) ? 'Valid price is required' : null,
            category: !category ? 'Category is required' : null,
          },
        },
        { status: 400 },
      )
    }

    // Get the existing document from MongoDB
    const menuItem = await withDBRetry(async () => {
      const item = await MenuItemModel.findById(id)
      if (!item) {
        throw new Error('Menu item not found')
      }
      return item
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 },
      )
    }

    // If no new images but we have existingImageURLs, keep those
    if (images.length === 0 && existingImageURLs.length > 0) {
      // Keep existing images, no need to delete anything
      // We'll set them later
    }
    // If new images are uploaded, remove old ones
    else if (images.length > 0 && Array.isArray(menuItem.imageURLs)) {
      for (const url of menuItem.imageURLs) {
        try {
          const oldImageRef = ref(storage, url)
          await deleteObject(oldImageRef)
        } catch (error) {
          console.error('Error deleting old image (continuing):', error)
        }
      }
    }

    // Handle video deletion if a new video is uploaded but there was an existing one
    if (videoFile && videoFile.size > 0 && menuItem.videoUrl) {
      try {
        const oldVideoRef = ref(storage, menuItem.videoUrl)
        await deleteObject(oldVideoRef)
      } catch (error) {
        console.error('Error deleting old video (continuing):', error)
      }
    }

    const imageURLs: string[] = []
    const imageNames: string[] = []

    // Upload new images if provided
    if (images.length > 0) {
      try {
        for (const image of images) {
          const imageName = image.name
          const filename = `${uuidv4()}_${imageName}`
          const storageRef = ref(storage, `menu-items/${filename}`)
          const buffer = await image.arrayBuffer()
          const contentType =
            mime.lookup(imageName) || 'application/octet-stream'
          await uploadBytes(storageRef, buffer, { contentType })
          const imageURL = await getDownloadURL(storageRef)
          imageURLs.push(imageURL)
          imageNames.push(imageName)
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 },
        )
      }
    }

    // Video upload handling
    let videoUrl = existingVideoUrl || ''
    let videoThumbnailUrl = existingVideoThumbnailUrl || ''

    if (videoFile && videoFile.size > 0) {
      try {
        // Upload video to Firebase Storage
        const videoName = videoFile.name
        const videoFilename = `${uuidv4()}_${videoName}`
        const videoStorageRef = ref(storage, `menu-videos/${videoFilename}`)
        const videoBuffer = await videoFile.arrayBuffer()
        const videoContentType = mime.lookup(videoName) || 'video/mp4'

        await uploadBytes(videoStorageRef, videoBuffer, {
          contentType: videoContentType,
        })
        videoUrl = await getDownloadURL(videoStorageRef)

        // Generate a thumbnail URL (using the video URL for now)
        // In a production system, you might want to generate an actual thumbnail
        videoThumbnailUrl = videoUrl
      } catch (uploadError) {
        console.error('Error uploading video:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload video' },
          { status: 500 },
        )
      }
    }

    // Update document in MongoDB
    menuItem.name = name
    menuItem.description = description
    menuItem.price = price
    menuItem.category = category
    menuItem.available = available
    menuItem.videoUrl = videoUrl
    menuItem.videoThumbnailUrl = videoThumbnailUrl

    if (images.length > 0) {
      // If new images were uploaded
      menuItem.image = imageNames.length > 0 ? imageNames[0] : ''
      menuItem.imageURL = imageURLs.length > 0 ? imageURLs[0] : ''
      // Always set as arrays, even if single item
      menuItem.images = imageNames.length > 0 ? imageNames : []
      menuItem.imageURLs = imageURLs.length > 0 ? imageURLs : []
    } else if (existingImageURLs.length > 0) {
      // If keeping existing images (no new uploads but has existing URLs)
      // We need to ensure all image fields are properly populated:
      menuItem.imageURLs = existingImageURLs

      // For backwards compatibility, set the first image URL as the legacy imageURL
      if (existingImageURLs.length > 0) {
        menuItem.imageURL = existingImageURLs[0]
      }

      // Since we can't easily reconstruct the image names from URLs,
      // we'll keep any existing image names if they're available
      if (!menuItem.images || menuItem.images.length === 0) {
        menuItem.images = existingImageURLs.map((url) => {
          // Extract filename from URL (simplified)
          const parts = url.split('/')
          return parts[parts.length - 1].split('?')[0]
        })
      }

      // Set legacy image field to match first image name if available
      if (menuItem.images && menuItem.images.length > 0) {
        menuItem.image = menuItem.images[0]
      }
    }

    // Validate that all ingredients exist in inventory
    if (ingredients.length > 0) {
      const validationResult = await withDBRetry(async () => {
        const missingItems = []

        for (const ingredient of ingredients) {
          const inventoryItem = await InventoryItem.findById(
            ingredient.inventoryItemId,
          )

          if (!inventoryItem) {
            missingItems.push({
              name: ingredient.inventoryItemName || 'Unknown item',
              error: 'Item not found in inventory',
            })
          }
        }

        return missingItems
      })

      if (validationResult.length > 0) {
        return NextResponse.json(
          {
            error: 'Invalid ingredients',
            details: validationResult,
          },
          { status: 400 },
        )
      }
    }

    await withDBRetry(async () => {
      // Update ingredients without modifying inventory quantities
      menuItem.ingredients = ingredients
      // Update add-ons if provided
      menuItem.addOns = addOns
      await menuItem.save()
    })

    return NextResponse.json({
      success: true,
      id,
      message: 'Menu item updated successfully',
    })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      {
        error: 'Failed to update menu item',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
