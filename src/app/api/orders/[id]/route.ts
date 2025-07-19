import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 },
      )
    }

    const order = await withDBRetry(async () => {
      return await OrderModel.findById(orderId)
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 },
      )
    }

    // Get table details if available
    let table = null
    if (order.tableId) {
      table = await (
        await import('@/models/Table')
      ).Table.findById(order.tableId)
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        customerName: order.customerName,
        tableNumber: order.tableNumber || (table ? table.number : 'Unknown'),
        table: table ? table.name : 'Unknown',
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order details',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
