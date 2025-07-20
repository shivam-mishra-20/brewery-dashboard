import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import { OrderModel } from '@/models/OrderModel'

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
          error: 'Missing required payment verification parameters',
        },
        { status: 400 },
      )
    }

    // Verify signature
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    })

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 },
      )
    }

    // Update order payment status in database
    await withDBRetry(async () => {
      await OrderModel.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'paid',
          razorpayPaymentId,
          updatedAt: new Date(),
        },
        { new: true },
      )
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to verify payment',
      },
      { status: 500 },
    )
  }
}

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  // Razorpay environment mode: 'test' or 'prod'
  const RAZORPAY_MODE = process.env.RAZORPAY_MODE === 'prod' ? 'prod' : 'test'
  const secret =
    RAZORPAY_MODE === 'prod'
      ? process.env.RAZORPAY_KEY_SECRET_PROD || ''
      : process.env.RAZORPAY_KEY_SECRET_TEST || 'your_test_secret'
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generatedSignature === signature
}
