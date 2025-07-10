import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '@/lib/firebase'
import { withDBRetry } from '@/lib/mongodb'
import { MenuItemModel } from '@/models/MenuItemModel'

// This handler accepts form data with a file
export async function POST(request: NextRequest) {
  try {
    // Get form data (multipart/form-data)
    const formData = await request.formData()

    // Extract fields from form data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const category = formData.get('category') as string
    const available = formData.get('available') === 'true'
    // Support up to 3 images
    const images: File[] = []
    for (let i = 0; i < 3; i++) {
      const img = formData.get(`image${i}`) as File | null
      if (img && img.size > 0) images.push(img)
    }

    // Validate required fields
    if (!name || !description || isNaN(price) || !category) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: {
            name: !name ? 'Name is required' : null,
            description: !description ? 'Description is required' : null,
            price: isNaN(price) ? 'Valid price is required' : null,
            category: !category ? 'Category is required' : null,
          },
        },
        { status: 400 },
      )
    }

    const imageURLs: string[] = []
    const imageNames: string[] = []

    // Upload images to Firebase Storage if they exist
    if (images.length > 0) {
      try {
        for (const image of images) {
          const imageName = image.name
          const filename = `${uuidv4()}_${imageName}`
          const storageRef = ref(storage, `menu-items/${filename}`)
          const buffer = await image.arrayBuffer()
          await uploadBytes(storageRef, buffer)
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

    // Use withDBRetry for reliable database operations
    const menuItem = await withDBRetry(async () => {
      // Add document to MongoDB
      return await MenuItemModel.create({
        name,
        description,
        price,
        category,
        image: imageNames.length > 0 ? imageNames[0] : '',
        imageURL: imageURLs.length > 0 ? imageURLs[0] : '',
        // Ensure these are always arrays even if empty
        images: imageNames.length > 0 ? imageNames : [],
        imageURLs: imageURLs.length > 0 ? imageURLs : [],
        available,
      })
    })

    return NextResponse.json({
      success: true,
      id: menuItem._id,
      message: 'Menu item created successfully',
    })
  } catch (error) {
    console.error('Error adding menu item:', error)
    return NextResponse.json(
      { error: 'Failed to add menu item', details: (error as Error).message },
      { status: 500 },
    )
  }
}
