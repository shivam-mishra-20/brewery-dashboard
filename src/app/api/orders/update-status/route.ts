import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

export async function POST(request: NextRequest) {
  try {
    const { id, status, notes } = await request.json()

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            id: !id ? 'Order ID is required' : null,
            status: !status ? 'Status is required' : null,
          },
        },
        { status: 400 },
      )
    }

    // Validate status
    const validStatuses = [
      'pending',
      'preparing',
      'ready',
      'completed',
      'cancelled',
    ]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status',
          details: {
            status: `Status must be one of: ${validStatuses.join(', ')}`,
          },
        },
        { status: 400 },
      )
    }

    // Update order status
    const order = await withDBRetry(async () => {
      const updateData: { status: string; notes?: string } = { status }
      if (notes) updateData.notes = notes

      const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, {
        new: true,
      })

      if (!updatedOrder) {
        throw new Error('Order not found')
      }

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        customerName: order.customerName,
        status: order.status,
        updatedAt: order.updatedAt,
      },
      message: 'Order status updated successfully',
    })
  } catch (error) {
    console.error('Error updating order status:', error)

    if ((error as Error).message === 'Order not found') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order status',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
