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

    // Debug the incoming request
    console.log('API: Orders GET request received', {
      url: request.url,
      params: {
        status,
        tableNumber,
        customerName,
      },
    })

    // Build query
    const query: Record<string, unknown> = {}
    if (status) query.status = status

    // Special handling for tableNumber
    if (tableNumber) {
      // The tableNumber param might be encrypted - check if it looks like base64
      const isEncrypted =
        /^[A-Za-z0-9+/=]+$/.test(tableNumber) && tableNumber.length > 20

      if (isEncrypted) {
        console.log(
          `API: Received encrypted tableNumber, using fallback approach`,
        )
        // We'll use a special approach for encrypted values
        // Don't filter by tableNumber when it's encrypted - get all recent orders instead
        console.log(`API: Skipping tableNumber filter due to encryption`)
      } else {
        // Try to extract just the table number if it contains additional data
        const extractedNumber = tableNumber.match(/\d+/)
        if (extractedNumber) {
          const simpleTableNumber = extractedNumber[0]
          console.log(`API: Extracted table number: ${simpleTableNumber}`)
          query.tableNumber = simpleTableNumber
        } else {
          // Use as-is if no number found
          query.tableNumber = tableNumber
        }
        console.log(`API: Using tableNumber filter: ${query.tableNumber}`)
      }
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' }
      console.log(`API: Using customerName filter: ${customerName}`)
    }

    console.log('API: MongoDB query:', JSON.stringify(query, null, 2))

    // Check if we have an encrypted tableNumber (>20 chars and base64-like)
    const hasEncryptedTable =
      tableNumber &&
      /^[A-Za-z0-9+/=]+$/.test(tableNumber) &&
      tableNumber.length > 20

    // For encrypted values, don't use tableNumber filter
    if (hasEncryptedTable) {
      delete query.tableNumber
      console.log('API: Removed encrypted tableNumber from query')
    }

    // Fetch orders - try with modified query first
    const orders = await withDBRetry(async () => {
      const results = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
      console.log(`API: Found ${results.length} orders with query`)

      // If no results and we have filters, try without filters as fallback
      if (results.length === 0 && Object.keys(query).length > 0) {
        console.log('API: No orders found with filters, trying without filters')
        const allOrders = await OrderModel.find({})
          .sort({ createdAt: -1 })
          .limit(20)
        console.log(`API: Found ${allOrders.length} orders without filters`)

        // Log first order for debugging if exists
        if (allOrders.length > 0) {
          console.log('API: Sample order in DB:', {
            id: allOrders[0]._id,
            table: allOrders[0].tableNumber,
            customer: allOrders[0].customerName,
            status: allOrders[0].status,
          })
        }

        // Still use filtered results, just logging for debugging
      }

      return results
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
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: order.razorpayPaymentId,
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

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Validate required fields
    if (
      !orderData.customerName ||
      !orderData.tableId ||
      !orderData.items ||
      orderData.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required order information',
        },
        { status: 400 },
      )
    }

    // Calculate total amount from items if not provided
    const totalAmount =
      orderData.totalAmount ||
      orderData.items.reduce((total: number, item: any) => {
        return (
          total +
          (item.price * item.quantity +
            (item.addOns?.reduce((s: number, a: any) => s + a.price, 0) || 0) *
              item.quantity)
        )
      }, 0)

    // Prepare order data with payment information
    const newOrder = {
      customerName: orderData.customerName,
      tableId: orderData.tableId,
      tableNumber: orderData.tableNumber,
      items: orderData.items.map((item: any) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedAddOns:
          item.addOns?.map((addon: any) => ({
            name: addon.name,
            price: addon.price,
            quantity: 1, // Default quantity for add-ons
            unit: 'item', // Default unit for add-ons
            inventoryItemId: addon.inventoryItemId || '0', // Default if not provided
          })) || [],
      })),
      totalAmount: totalAmount,
      status: 'pending',
      paymentStatus: orderData.paymentStatus || 'unpaid',
      paymentMethod: orderData.paymentMethod || 'cash',
      notes: orderData.notes || '',
      // Add payment information if available
      razorpayOrderId: orderData.razorpayOrderId || null,
      razorpayPaymentId: orderData.razorpayPaymentId || null,
    }

    // Create order in database
    const createdOrder = await withDBRetry(async () => {
      return await OrderModel.create(newOrder)
    })

    return NextResponse.json({
      success: true,
      orderId: createdOrder._id,
      message: 'Order created successfully',
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to create order',
      },
      { status: 500 },
    )
  }
}
