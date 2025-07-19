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
import dbConnect from '@/utils/dbConnect'

// This handler is for updating a menu item with file uploads using FormData
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
    // Only delete images that are no longer in existingImageURLs
    else if (images.length > 0 && Array.isArray(menuItem.imageURLs)) {
      // Don't delete all old images - only delete the ones not in existingImageURLs
      const imagesToDelete = menuItem.imageURLs.filter(
        (url) => !existingImageURLs.includes(url),
      )

      for (const url of imagesToDelete) {
        try {
          // Parse the URL to extract just the path
          const parsedUrl = new URL(url)
          const pathMatch = parsedUrl.pathname.match(/o\/([^?]+)/)

          if (pathMatch && pathMatch[1]) {
            // Decode the URL-encoded path
            const storagePath = decodeURIComponent(pathMatch[1])
            console.log(`Deleting image at storage path: ${storagePath}`)

            const oldImageRef = ref(storage, storagePath)
            await deleteObject(oldImageRef)
          } else {
            console.error(`Could not parse storage path from URL: ${url}`)
          }
        } catch (error) {
          console.error('Error deleting old image (continuing):', error)
        }
      }
    }

    // Handle video deletion if a new video is uploaded but there was an existing one
    if (videoFile && videoFile.size > 0 && menuItem.videoUrl) {
      try {
        // Parse the URL to extract just the path
        const parsedUrl = new URL(menuItem.videoUrl)
        const pathMatch = parsedUrl.pathname.match(/o\/([^?]+)/)

        if (pathMatch && pathMatch[1]) {
          // Decode the URL-encoded path
          const storagePath = decodeURIComponent(pathMatch[1])
          console.log(`Deleting video at storage path: ${storagePath}`)

          const oldVideoRef = ref(storage, storagePath)
          await deleteObject(oldVideoRef)
        } else {
          console.error(
            `Could not parse storage path from URL: ${menuItem.videoUrl}`,
          )
        }
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

    // Handle both existing and new images
    if (images.length > 0) {
      // If new images were uploaded, combine them with existing ones
      const combinedImageURLs = [...existingImageURLs, ...imageURLs]

      // Update image-related fields
      menuItem.imageURLs = combinedImageURLs
      menuItem.imageURL =
        combinedImageURLs.length > 0 ? combinedImageURLs[0] : ''

      // For image names, keep existing ones and add new ones
      // Since we can't easily get names from existing URLs, we'll append new names
      const updatedImageNames = [...(menuItem.images || []), ...imageNames]
      menuItem.images = updatedImageNames
      menuItem.image = updatedImageNames.length > 0 ? updatedImageNames[0] : ''
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

// Ensure the backend update handler preserves existing data

export async function PUT(request: NextRequest) {
  try {
    const { id } = Object.fromEntries(request.nextUrl.searchParams)
    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 },
      )
    }

    const data = await request.json()
    console.log('Updating menu item with ID:', id)

    await dbConnect()

    // First, get the existing item
    const existingItem = await MenuItemModel.findById(id)
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 },
      )
    }

    // Merge the existing data with the new data
    const updatedData = {
      ...existingItem.toObject(), // Convert mongoose doc to plain object
      ...data,
      // Ensure certain fields are properly updated
      updatedAt: new Date(),

      // Properly handle ingredients array
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients
        : existingItem.ingredients || [],

      // Ensure images is always an array of strings to match the schema
      images: Array.isArray(data.images)
        ? data.images.filter((img: any) => typeof img === 'string')
        : existingItem.images || [],

      // Make sure imageURLs are properly handled - this is what MongoDB expects
      imageURLs: Array.isArray(data.imageURLs)
        ? data.imageURLs
        : existingItem.imageURLs || [],
    }

    // Image legacy field for backward compatibility
    if (
      updatedData.imageURLs &&
      updatedData.imageURLs.length > 0 &&
      !updatedData.imageURL
    ) {
      updatedData.imageURL = updatedData.imageURLs[0]
    }

    // Update image names if they're missing
    if (
      (updatedData.imageURLs?.length || 0) > 0 &&
      (updatedData.images?.length || 0) === 0
    ) {
      updatedData.images = updatedData.imageURLs.map((url: string) => {
        const parts = url.split('/')
        return parts[parts.length - 1].split('?')[0]
      })
    }

    console.log('Data prepared for update:', {
      id,
      images: updatedData.images,
      imageURLs: updatedData.imageURLs,
    })

    // Use findByIdAndUpdate with { new: true } to get the updated document
    const updatedMenuItem = await MenuItemModel.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      },
    )

    if (!updatedMenuItem) {
      throw new Error('Failed to update menu item in database')
    }

    // Verify the update worked correctly
    console.log('Menu item updated successfully:', {
      id: updatedMenuItem._id,
      imageCount: updatedMenuItem.imageURLs?.length || 0,
      imageURLs: updatedMenuItem.imageURLs || [],
      images: updatedMenuItem.images || [],
    })

    return NextResponse.json({
      message: 'Menu item updated successfully',
      menuItem: updatedMenuItem,
    })
  } catch (error) {
    console.error('Error updating menu item:', error)

    // Provide more detailed error message
    let errorMessage = 'Failed to update menu item'
    let details = null

    if (error instanceof Error) {
      errorMessage = error.message

      // Handle MongoDB cast errors
      if (error.name === 'CastError' && 'path' in error) {
        const castError = error as any
        errorMessage = `Invalid data format for field: ${castError.path}`
        details = castError
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: details,
      },
      { status: 500 },
    )
  }
}
