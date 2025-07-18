import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import InventoryItem from '@/models/db/InventoryItem'
import InventoryTransaction from '@/models/db/InventoryTransaction'
import dbConnect from '@/utils/dbConnect'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock') === 'true'
    const autoReorderOnly = searchParams.get('autoReorderOnly') === 'true'

    // Ensure MongoDB connection is established before proceeding
    const mongoose = await dbConnect()

    // Wait for the connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const query: any = {}

    // Apply filters
    if (category && category !== 'All') {
      query.category = category
    }

    if (lowStock) {
      // Find items where quantity <= reorderPoint
      query.$expr = { $lte: ['$quantity', '$reorderPoint'] }
    }

    if (autoReorderOnly) {
      query.autoReorderNotify = true
    }

    const items = await InventoryItem.find(query)
      .populate('supplier', 'name')
      .sort({ category: 1, name: 1 })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Ensure MongoDB connection is established before proceeding
    const mongoose = await dbConnect()

    // Wait for the connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const newItem = new InventoryItem(data)
    await newItem.save()

    // Create an initial transaction for the new inventory item
    const transaction = new InventoryTransaction({
      inventoryItem: newItem._id,
      type: 'restock',
      quantity: newItem.quantity,
      previousQuantity: 0,
      newQuantity: newItem.quantity,
      unitCost: newItem.costPerUnit,
      totalCost: newItem.quantity * newItem.costPerUnit,
      notes: 'Initial inventory creation',
      performedBy: 'System',
    })

    await transaction.save()

    revalidatePath('/dashboard/inventory')

    return NextResponse.json({
      success: true,
      item: await newItem.populate('supplier', 'name'),
    })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 },
      )
    }

    // Ensure MongoDB connection is established before proceeding
    const mongoose = await dbConnect()

    // Wait for the connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Get the original item to record the change
    const originalItem = await InventoryItem.findById(id)

    if (!originalItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 },
      )
    }

    // If quantity has changed, create a transaction
    if (
      updateData.quantity !== undefined &&
      updateData.quantity !== originalItem.quantity
    ) {
      const transaction = new InventoryTransaction({
        inventoryItem: id,
        type:
          updateData.quantity > originalItem.quantity
            ? 'restock'
            : 'adjustment',
        quantity: Math.abs(updateData.quantity - originalItem.quantity),
        previousQuantity: originalItem.quantity,
        newQuantity: updateData.quantity,
        unitCost: updateData.costPerUnit || originalItem.costPerUnit,
        totalCost:
          Math.abs(updateData.quantity - originalItem.quantity) *
          (updateData.costPerUnit || originalItem.costPerUnit),
        notes: 'Manual update via inventory management',
        performedBy: 'Admin', // You might want to get the actual user
      })

      await transaction.save()

      // Update lastRestocked if it's a restock operation
      if (updateData.quantity > originalItem.quantity) {
        updateData.lastRestocked = new Date()
      }
    }

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).populate('supplier', 'name')

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 },
      )
    }

    revalidatePath('/dashboard/inventory')

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 },
      )
    }

    await dbConnect()

    // Check if the item exists
    const item = await InventoryItem.findById(id)
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 },
      )
    }

    // Delete related transactions
    await InventoryTransaction.deleteMany({ inventoryItem: id })

    // Delete the item
    await InventoryItem.findByIdAndDelete(id)

    revalidatePath('/dashboard/inventory')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 },
    )
  }
}
