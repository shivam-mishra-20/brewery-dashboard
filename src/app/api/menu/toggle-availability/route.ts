import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuItemModel } from '@/models/MenuItemModel'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { id, available } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 },
      )
    }

    if (available === undefined) {
      return NextResponse.json(
        { error: 'Available status is required' },
        { status: 400 },
      )
    }

    // Find the menu item in MongoDB
    const menuItem = await MenuItemModel.findById(id)

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 },
      )
    }

    // Update the availability status
    menuItem.available = available
    await menuItem.save()

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
    })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      {
        error: 'Failed to update availability',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
