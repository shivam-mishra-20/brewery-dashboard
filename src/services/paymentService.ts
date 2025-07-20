import { CartItem } from '@/context/CartContext'

// Define Razorpay interface based on their documentation
declare global {
  interface Window {
    Razorpay: any
  }
}

export interface PaymentDetails {
  orderId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  tableId: string
  tableNumber: string
  tableName: string
  amount: number
  currency: string
  paymentMethod: 'online' | 'cash'
}

/**
 * Initialize Razorpay payment
 */
export const initializeRazorpay = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Process payment using Razorpay
 */
export const processPayment = async (
  paymentDetails: PaymentDetails,
  cartItems: CartItem[],
): Promise<{
  success: boolean
  orderId?: string
  paymentId?: string
  error?: string
}> => {
  try {
    // First initialize Razorpay script
    const isRazorpayLoaded = await initializeRazorpay()

    if (!isRazorpayLoaded) {
      throw new Error('Razorpay SDK failed to load')
    }

    // For cash payments, just create the order and redirect
    if (paymentDetails.paymentMethod === 'cash') {
      const orderResponse = await createOrder({
        ...paymentDetails,
        items: cartItems,
        paymentStatus: 'unpaid', // For cash payments, mark as unpaid initially
      })

      if (orderResponse.success) {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const tableDataParam = urlParams.get('tabledata') || ''

        // Redirect to success page
        window.location.href = `/payment-success?orderId=${orderResponse.orderId}&tabledata=${encodeURIComponent(tableDataParam)}`
      }

      return {
        success: orderResponse.success,
        orderId: orderResponse.orderId,
        error: orderResponse.error,
      }
    }

    // For online payments, create an order first to get payment details
    const orderResponse = await createRazorpayOrder(paymentDetails.amount)

    if (!orderResponse.success) {
      throw new Error(orderResponse.error || 'Failed to create Razorpay order')
    }

    // Create a local order in our database with pending payment status
    const localOrderResponse = await createOrder({
      ...paymentDetails,
      items: cartItems,
      paymentStatus: 'pending', // Mark as pending until payment is confirmed
      razorpayOrderId: orderResponse.orderId,
    })

    // No need to use router here as we'll use window.location.href for redirection

    // Define options for Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentDetails.amount * 100, // Razorpay expects amount in lowest currency unit (paise)
      currency: paymentDetails.currency,
      name: 'Work Brew Café',
      description: `Order for table ${paymentDetails.tableNumber}`,
      order_id: orderResponse.orderId,
      handler: async function (response: any) {
        // Verify payment using our verifyPayment function
        const verifyResult = await verifyPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          orderId: localOrderResponse.orderId!,
        })

        if (verifyResult.success) {
          // Use encrypted table data from URL if available
          const urlParams = new URLSearchParams(window.location.search)
          const tableDataParam = urlParams.get('tabledata') || ''

          // Redirect to success page with orderId and tabledata
          window.location.href = `/payment-success?orderId=${localOrderResponse.orderId}&tabledata=${encodeURIComponent(tableDataParam)}`
        } else {
          // Show error to user
          alert(
            'Payment verification failed: ' +
              (verifyResult.error || 'Unknown error'),
          )
        }
      },
      prefill: {
        name: paymentDetails.customerName,
        email: paymentDetails.customerEmail || '',
        contact: paymentDetails.customerPhone || '',
      },
      theme: {
        color: '#FBBF24', // Amber color to match the app theme
      },
    }

    // Create Razorpay instance and open checkout
    const paymentObject = new window.Razorpay(options)
    paymentObject.open()

    // Return a promise that resolves when payment is completed or fails
    return new Promise((resolve) => {
      // Create event handlers for successful payment
      const handlePaymentSuccess = (response: any) => {
        // Remove event listeners to prevent memory leaks
        paymentObject.off('payment.success', handlePaymentSuccess)
        paymentObject.off('payment.error', handlePaymentError)

        // Resolve with success
        resolve({
          success: true,
          orderId: localOrderResponse.orderId,
          paymentId: response.razorpay_payment_id,
        })
      }

      // Create event handlers for payment errors
      const handlePaymentError = (error: any) => {
        // Remove event listeners to prevent memory leaks
        paymentObject.off('payment.success', handlePaymentSuccess)
        paymentObject.off('payment.error', handlePaymentError)

        // Resolve with error
        resolve({
          success: false,
          error: error.description || 'Payment failed',
        })
      }

      // Add event listeners
      paymentObject.on('payment.success', handlePaymentSuccess)
      paymentObject.on('payment.error', handlePaymentError)
    })
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    }
  }
}

/**
 * Create a Razorpay order
 */
async function createRazorpayOrder(amount: number): Promise<{
  success: boolean
  orderId?: string
  error?: string
}> {
  try {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount * 100 }), // Convert to paise
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create order')
    }

    return {
      success: true,
      orderId: data.orderId,
    }
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    return {
      success: false,
      error: error.message || 'Failed to create order',
    }
  }
}

/**
 * Create an order in our database
 */
async function createOrder(orderData: any): Promise<{
  success: boolean
  orderId?: string
  error?: string
}> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create order')
    }

    return {
      success: true,
      orderId: data.orderId,
    }
  } catch (error: any) {
    console.error('Error creating order:', error)
    return {
      success: false,
      error: error.message || 'Failed to create order',
    }
  }
}

/**
 * Verify payment with our backend
 */
async function verifyPayment(paymentData: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  orderId: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Payment verification failed')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return {
      success: false,
      error: error.message || 'Payment verification failed',
    }
  }
}
