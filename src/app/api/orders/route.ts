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

    // Fetch table info for each order
    const tablesMap: Record<string, any> = {}
    const tableIds = orders.map((o) => o.tableId).filter(Boolean)
    if (tableIds.length > 0) {
      const tables = await (
        await import('@/models/Table')
      ).Table.find({ _id: { $in: tableIds } })
      for (const t of tables) {
        tablesMap[t._id as string] = t
      }
    }
    return NextResponse.json({
      success: true,
      orders: orders.map((order) => {
        const table = tablesMap[order.tableId]
        return {
          id: order._id,
          customerName: order.customerName,
          tableNumber: order.tableNumber || (table ? table.number : undefined),
          table: table ? table.name : undefined,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customer: order.customerName,
          time: order.createdAt,
        }
      }),
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
