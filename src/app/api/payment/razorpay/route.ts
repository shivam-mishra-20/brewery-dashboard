import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

// These would normally be in environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_your_test_key'
const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_SECRET_KEY || 'your_test_secret'

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

    // Create a Razorpay order
    const response = await fetch('https://api.razorpay.com/v1/orders', {
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

export async function PUT(request: NextRequest) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
    } = await request.json()

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex')

    const isAuthentic = generatedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature',
        },
        { status: 400 },
      )
    }

    // Update order payment status
    await withDBRetry(async () => {
      await OrderModel.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        'paymentDetails.provider': 'razorpay',
        'paymentDetails.paymentId': razorpay_payment_id,
        'paymentDetails.orderId': razorpay_order_id,
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order updated successfully',
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
