import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

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

// Initialize Razorpay with credentials
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 },
      )
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount), // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to create order',
      },
      { status: 500 },
    )
  }
}
