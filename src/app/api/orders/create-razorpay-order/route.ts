import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

// Razorpay environment mode: 'test' or 'prod'
const RAZORPAY_MODE = process.env.RAZORPAY_MODE === 'prod' ? 'prod' : 'test'
const RAZORPAY_KEY_ID =
  RAZORPAY_MODE === 'prod'
    ? process.env.RAZORPAY_KEY_ID_PROD || ''
    : process.env.RAZORPAY_KEY_ID_TEST || 'rzp_test_your_test_key'
const RAZORPAY_KEY_SECRET =
  RAZORPAY_MODE === 'prod'
    ? process.env.RAZORPAY_KEY_SECRET_PROD || ''
    : process.env.RAZORPAY_KEY_SECRET_TEST || 'your_test_secret'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 },
      )
    }

    // Fetch order details
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

    // Razorpay requires amount in paise (multiply by 100)
    const amountInPaise = Math.round(order.totalAmount * 100)

    // Use correct endpoint for test/prod (Razorpay uses same endpoint, but you can log mode)
    const endpoint = 'https://api.razorpay.com/v1/orders'
    // Create a Razorpay order
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: {
          customerName: order.customerName,
          tableNumber: order.tableNumber,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Razorpay error:', errorData)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment order',
          details: errorData,
        },
        { status: response.status },
      )
    }

    const razorpayOrder = await response.json()

    // Update the order with razorpay order reference
    await withDBRetry(async () => {
      await OrderModel.findByIdAndUpdate(orderId, {
        'paymentDetails.provider': 'razorpay',
        'paymentDetails.orderId': razorpayOrder.id,
        paymentStatus: 'pending', // Mark as pending since payment has been initiated
      })
    })

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      key: RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payment order',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
