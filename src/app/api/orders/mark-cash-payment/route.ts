import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentMethod, paymentStatus } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 },
      )
    }

    // Verify the order exists
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

    // For cash payments, we can mark it as either paid (if already collected) or pending (if to be collected later)
    const finalPaymentStatus = paymentStatus || 'paid'

    // Update order payment status
    await withDBRetry(async () => {
      await OrderModel.findByIdAndUpdate(orderId, {
        paymentStatus: finalPaymentStatus,
        'paymentDetails.method': paymentMethod || 'cash',
        'paymentDetails.timestamp': new Date(),
      })
    })

    return NextResponse.json({
      success: true,
      message:
        finalPaymentStatus === 'paid'
          ? 'Order marked as paid with cash'
          : 'Order marked for cash payment',
    })
  } catch (error) {
    console.error('Error marking for cash payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payment status',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
