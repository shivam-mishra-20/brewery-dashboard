import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import InventoryItem from '@/models/db/InventoryItem'
import dbConnect from '@/utils/dbConnect'

// Get all existing categories from inventory items
export async function GET() {
  try {
    // Ensure MongoDB connection is established before proceeding
    const mongoose = await dbConnect()

    // Wait for the connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Aggregate to get unique categories
    const categories = await InventoryItem.aggregate([
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: '$_id' } },
    ])

    const categoryNames = categories.map((cat) => cat.name)

    // Always include default categories if they don't exist
    const DEFAULT_CATEGORIES = [
      'Beverages',
      'Dairy',
      'Grains',
      'Produce',
      'Meats',
      'Spices',
      'Baking',
      'Other',
    ]

    // Add any default categories that don't exist yet
    DEFAULT_CATEGORIES.forEach((cat) => {
      if (!categoryNames.includes(cat)) {
        categoryNames.push(cat)
      }
    })

    // Sort alphabetically
    categoryNames.sort()

    // Always put 'All' at the beginning
    if (categoryNames.includes('All')) {
      categoryNames.splice(categoryNames.indexOf('All'), 1)
    }
    categoryNames.unshift('All')

    return NextResponse.json({ categories: categoryNames })
  } catch (error) {
    console.error('Error fetching inventory categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory categories' },
      { status: 500 },
    )
  }
}

// Create a new category (this is actually just validation, as categories
// are created implicitly when adding/updating inventory items)
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 },
      )
    }

    // Validate the category name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Category name must be at least 2 characters long' },
        { status: 400 },
      )
    }

    // We don't need to actually create anything in the database
    // as categories are stored with each inventory item

    revalidatePath('/dashboard/inventory')

    return NextResponse.json({
      success: true,
      message: 'Category validated successfully',
    })
  } catch (error) {
    console.error('Error validating category:', error)
    return NextResponse.json(
      { error: 'Failed to validate category' },
      { status: 500 },
    )
  }
}
