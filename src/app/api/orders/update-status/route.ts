import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

export async function POST(request: NextRequest) {
  try {
    const { id, status, paymentStatus, notes } = await request.json()

    // Validate required fields
    if (!id || (!status && !paymentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            id: !id ? 'Order ID is required' : null,
            status:
              !status && !paymentStatus
                ? 'Either status or paymentStatus is required'
                : null,
          },
        },
        { status: 400 },
      )
    }

    // Validate status if provided
    if (status) {
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
    }

    // Validate paymentStatus if provided
    if (paymentStatus) {
      const validPaymentStatuses = ['unpaid', 'paid']
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid payment status',
            details: {
              paymentStatus: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`,
            },
          },
          { status: 400 },
        )
      }
    }

    // Update order status and table status if needed
    const order = await withDBRetry(async () => {
      const updateData: {
        status?: string
        paymentStatus?: string
        notes?: string
      } = {}
      if (status) updateData.status = status
      if (paymentStatus) updateData.paymentStatus = paymentStatus
      if (notes) updateData.notes = notes

      const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, {
        new: true,
      })

      if (!updatedOrder) {
        throw new Error('Order not found')
      }

      // If status is completed or cancelled, set table status to available
      if (status === 'completed' || status === 'cancelled') {
        const tableId = updatedOrder.tableId
        if (tableId) {
          await (
            await import('@/models/Table')
          ).Table.findByIdAndUpdate(tableId, {
            status: 'available',
            $push: {
              statusHistory: { status: 'available', timestamp: new Date() },
            },
          })
        }
      }

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        customerName: order.customerName,
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
      },
      message: 'Order updated successfully',
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
