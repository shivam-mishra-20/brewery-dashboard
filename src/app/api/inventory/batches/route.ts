import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import BatchInventoryUpdate from '@/models/db/BatchInventoryUpdate'
import InventoryItem from '@/models/db/InventoryItem'
import InventoryTransaction from '@/models/db/InventoryTransaction'
import dbConnect from '@/utils/dbConnect'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    await dbConnect()

    // Build query based on filters
    const query: Record<string, unknown> = {}

    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      query.status = status
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get batches
    const batches = await BatchInventoryUpdate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count
    const total = await BatchInventoryUpdate.countDocuments(query)

    return NextResponse.json({
      batches,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching batch updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch updates' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { name, items, notes, performedBy, executeImmediately = false } = data

    if (!name || !items || items.length === 0 || !performedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    await dbConnect()

    // Create the batch
    const batch = new BatchInventoryUpdate({
      name,
      items,
      notes,
      performedBy,
      status: executeImmediately ? 'completed' : 'pending',
      completedAt: executeImmediately ? new Date() : undefined,
    })

    await batch.save()

    // If executing immediately, apply all inventory updates
    if (executeImmediately) {
      await processBatchUpdate(batch)
    }

    revalidatePath('/dashboard/inventory/batches')

    return NextResponse.json({
      success: true,
      batch,
    })
  } catch (error) {
    console.error('Error creating batch update:', error)
    return NextResponse.json(
      { error: 'Failed to create batch update' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, action } = data

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Batch ID and action are required' },
        { status: 400 },
      )
    }

    await dbConnect()

    const batch = await BatchInventoryUpdate.findById(id)

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch update not found' },
        { status: 404 },
      )
    }

    if (batch.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only process pending batches' },
        { status: 400 },
      )
    }

    switch (action) {
      case 'execute':
        batch.status = 'completed'
        batch.completedAt = new Date()
        await batch.save()
        await processBatchUpdate(batch)
        break

      case 'cancel':
        batch.status = 'cancelled'
        await batch.save()
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    revalidatePath('/dashboard/inventory/batches')

    return NextResponse.json({
      success: true,
      batch,
    })
  } catch (error) {
    console.error('Error processing batch update:', error)
    return NextResponse.json(
      { error: 'Failed to process batch update' },
      { status: 500 },
    )
  }
}

// Helper function to process batch updates
async function processBatchUpdate(batch: any) {
  // Process each item in the batch
  for (const item of batch.items) {
    try {
      // Get inventory item
      const inventoryItem = await InventoryItem.findById(item.inventoryItemId)

      if (inventoryItem) {
        // Record previous quantity
        const previousQuantity = inventoryItem.quantity

        // Update inventory quantity
        inventoryItem.quantity += item.quantity

        // Update cost per unit if provided and it's a positive update
        if (item.costPerUnit && item.quantity > 0) {
          inventoryItem.costPerUnit = item.costPerUnit
        }

        // Update lastRestocked if this is a restock
        if (item.quantity > 0) {
          inventoryItem.lastRestocked = new Date()
        }

        await inventoryItem.save()

        // Create transaction record
        await new InventoryTransaction({
          inventoryItem: item.inventoryItemId,
          type: item.quantity > 0 ? 'restock' : 'adjustment',
          quantity: Math.abs(item.quantity),
          previousQuantity,
          newQuantity: inventoryItem.quantity,
          unitCost: item.costPerUnit || inventoryItem.costPerUnit,
          totalCost:
            Math.abs(item.quantity) *
            (item.costPerUnit || inventoryItem.costPerUnit),
          notes: `Batch update: ${batch.name}`,
          performedBy: batch.performedBy,
          batchId: batch._id,
        }).save()
      }
    } catch (err) {
      console.error(`Error processing batch item ${item.inventoryItemId}:`, err)
    }
  }
}
