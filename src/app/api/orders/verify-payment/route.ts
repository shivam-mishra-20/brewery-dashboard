import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

// Razorpay environment mode: 'test' or 'prod'
const RAZORPAY_MODE = process.env.RAZORPAY_MODE === 'prod' ? 'prod' : 'test'
const RAZORPAY_KEY_SECRET =
  RAZORPAY_MODE === 'prod'
    ? process.env.RAZORPAY_KEY_SECRET_PROD || ''
    : process.env.RAZORPAY_KEY_SECRET_TEST || 'your_test_secret'

export async function POST(request: NextRequest) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      await request.json()

    // Validate required fields
    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !orderId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment verification details',
        },
        { status: 400 },
      )
    }

    // Verify payment signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex')

    const isAuthentic = generatedSignature === razorpaySignature

    if (!isAuthentic) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature',
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

    // Update order payment status
    await withDBRetry(async () => {
      await OrderModel.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        'paymentDetails.provider': 'razorpay',
        'paymentDetails.paymentId': razorpayPaymentId,
        'paymentDetails.orderId': razorpayOrderId,
        'paymentDetails.verificationTimestamp': new Date(),
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
