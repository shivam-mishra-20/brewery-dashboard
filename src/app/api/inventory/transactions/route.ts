import { NextRequest, NextResponse } from 'next/server'
import InventoryItem from '@/models/db/InventoryItem'
import InventoryTransaction from '@/models/db/InventoryTransaction'
import dbConnect from '@/utils/dbConnect'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inventoryItemId = searchParams.get('itemId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    await dbConnect()

    // Build query based on filters
    const query: Record<string, any> = {}

    if (inventoryItemId) {
      query.inventoryItem = inventoryItemId
    }

    if (type && ['restock', 'usage', 'adjustment', 'waste'].includes(type)) {
      query.type = type
    }

    if (startDate || endDate) {
      query.createdAt = {}

      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }

      if (endDate) {
        // Set to end of day
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        query.createdAt.$lte = endDateTime
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get transactions
    const transactions = await InventoryTransaction.find(query)
      .populate('inventoryItem', 'name unit category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count
    const total = await InventoryTransaction.countDocuments(query)

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory transactions' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { inventoryItemId, type, quantity, notes, performedBy } = data

    if (!inventoryItemId || !type || quantity === undefined || !performedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    await dbConnect()

    // Get the inventory item
    const inventoryItem = await InventoryItem.findById(inventoryItemId)
    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 },
      )
    }

    // Calculate new quantity
    let newQuantity
    switch (type) {
      case 'restock':
        newQuantity = inventoryItem.quantity + quantity
        break
      case 'usage':
      case 'waste':
        newQuantity = Math.max(0, inventoryItem.quantity - quantity)
        break
      case 'adjustment':
        newQuantity = quantity // Direct set
        break
      default:
        return NextResponse.json(
          { error: 'Invalid transaction type' },
          { status: 400 },
        )
    }

    // Create transaction
    const transaction = new InventoryTransaction({
      inventoryItem: inventoryItemId,
      type,
      quantity: Math.abs(newQuantity - inventoryItem.quantity),
      previousQuantity: inventoryItem.quantity,
      newQuantity,
      unitCost: inventoryItem.costPerUnit,
      totalCost:
        Math.abs(newQuantity - inventoryItem.quantity) *
        inventoryItem.costPerUnit,
      notes,
      performedBy,
    })

    await transaction.save()

    // Update inventory item quantity
    inventoryItem.quantity = newQuantity

    // If restocking, update lastRestocked
    if (type === 'restock') {
      inventoryItem.lastRestocked = new Date()
    }

    await inventoryItem.save()

    return NextResponse.json({
      success: true,
      transaction: await transaction.populate(
        'inventoryItem',
        'name unit category',
      ),
    })
  } catch (error) {
    console.error('Error creating inventory transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory transaction' },
      { status: 500 },
    )
  }
}
