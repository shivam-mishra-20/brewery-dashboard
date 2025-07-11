import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tableNumber = searchParams.get('tableNumber')
    const customerName = searchParams.get('customerName')

    // Build query
    const query: Record<string, unknown> = {}
    if (status) query.status = status
    if (tableNumber) query.tableNumber = tableNumber
    if (customerName)
      query.customerName = { $regex: customerName, $options: 'i' }

    // Fetch orders
    const orders = await withDBRetry(async () => {
      return await OrderModel.find(query).sort({ createdAt: -1 }).limit(100) // Limit to prevent too many results
    })

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        id: order._id,
        customerName: order.customerName,
        tableNumber: order.tableNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
