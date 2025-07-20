import { OrderItem } from '@/models/OrderModel'

export interface PlaceOrderRequest {
  customerName: string
  tableId: string
  items: OrderRequestItem[]
  notes?: string
}

export interface OrderRequestItem {
  menuItemId: string
  quantity: number
  selectedAddOns?: {
    name: string
    price: number
  }[]
}

export interface PlaceOrderResponse {
  success: boolean
  order?: {
    id: string
    customerName: string
    tableNumber?: string
    status: string
    paymentStatus: string
    totalAmount: number
    createdAt: string
  }
  error?: string
  details?: unknown
  message?: string
}

export interface GetOrdersResponse {
  success: boolean
  orders?: Array<{
    id: string
    customerName: string
    tableNumber?: string
    items: OrderItem[]
    totalAmount: number
    status: string
    paymentStatus: string
    notes?: string
    createdAt: string
    updatedAt: string
  }>
  error?: string
  details?: unknown
}

export interface UpdateOrderStatusRequest {
  id: string
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  paymentStatus?: 'unpaid' | 'paid'
  notes?: string
}

export interface UpdateOrderStatusResponse {
  success: boolean
  order?: {
    id: string
    customerName: string
    status: string
    paymentStatus: string
    updatedAt: string
  }
  error?: string
  details?: unknown
  message?: string
}

/**
 * Service for order-related operations
 */
export const orderService = {
  /**
   * Place a new order
   */
  placeOrder: async (
    orderData: PlaceOrderRequest,
  ): Promise<PlaceOrderResponse> => {
    try {
      const response = await fetch('/api/orders/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to place order',
        details: (error as Error).message,
      }
    }
  },

  /**
   * Get orders with optional filtering
   */
  getOrders: async (filters?: {
    status?: string
    tableNumber?: string
    customerName?: string
  }): Promise<GetOrdersResponse> => {
    try {
      const queryParams = new URLSearchParams()

      if (filters) {
        // Special handling for tableNumber
        if (filters.tableNumber) {
          // Try to use the tableNumber directly as it might already be properly formatted
          const tableNumber = filters.tableNumber
          console.log('Using table number:', tableNumber)

          // If the tableNumber looks like an encrypted value, we'll use a special approach
          const isEncrypted =
            /^[A-Za-z0-9+/=]+$/.test(tableNumber) && tableNumber.length > 20
          if (isEncrypted) {
            // For encrypted values, the API will handle it specially
            console.log('Table number appears to be encrypted')
          }

          // Add the parameter in either case - the API will handle it appropriately
          queryParams.append('tableNumber', tableNumber)
        }

        if (filters.status) queryParams.append('status', filters.status)
        if (filters.customerName)
          queryParams.append('customerName', filters.customerName)
      }

      console.log('Fetching orders with URL params:', queryParams.toString())

      const apiUrl = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      console.log('Full API URL:', apiUrl)

      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
        cache: 'no-store', // Disable caching to ensure fresh data
      })

      // Clear the timeout since we got a response
      clearTimeout(timeoutId)

      // Log response status for debugging
      console.log(
        `API response status: ${response.status} ${response.statusText}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          `API error: ${response.status} ${response.statusText}`,
          errorText,
        )
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
          details: errorText,
        }
      }

      try {
        const result = await response.json()

        // Capture the full response for detailed debugging
        console.log('FULL API RESPONSE DATA:', JSON.stringify(result, null, 2))

        // Log the actual response data structure for debugging
        console.log('API response data structure:', {
          success: result.success,
          hasOrders: result.orders && result.orders.length > 0,
          orderCount: result.orders?.length || 0,
          firstOrderId: result.orders?.[0]?.id || 'none',
        })

        // Validate response format
        if (!result) {
          return {
            success: false,
            error: 'Invalid response from API',
          }
        }

        // If the API says success but returns empty orders array, let's try to fetch directly
        if (result.success && (!result.orders || result.orders.length === 0)) {
          console.warn(
            'API returned success but empty orders array. This may be an API issue.',
          )

          // You can optionally implement a direct database check here if needed
        }

        return result
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        return {
          success: false,
          error: 'Failed to parse API response',
          details:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        }
      }
    } catch (error) {
      console.error('Exception in getOrders:', error)
      return {
        success: false,
        error: 'Failed to fetch orders',
        details: (error as Error).message,
      }
    }
  },

  /**
   * Create a Razorpay order and get payment details
   * This is for client-side payment initiation
   */
  createRazorpayOrder: async (
    orderId: string,
  ): Promise<{
    success: boolean
    razorpayOrderId?: string
    totalAmount?: number
    error?: string
  }> => {
    try {
      const response = await fetch('/api/orders/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      return await response.json()
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      return {
        success: false,
        error: 'Failed to initialize payment',
      }
    }
  },

  /**
   * Mark an order for cash payment
   * This indicates customer will pay by cash in person
   */
  markOrderForCashPayment: async (
    orderId: string,
  ): Promise<{
    success: boolean
    error?: string
  }> => {
    try {
      const response = await fetch('/api/orders/mark-cash-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentMethod: 'cash',
          paymentStatus: 'pending',
        }),
      })

      return await response.json()
    } catch (error) {
      console.error('Error marking for cash payment:', error)
      return {
        success: false,
        error: 'Failed to update payment method',
      }
    }
  },

  /**
   * Verify Razorpay payment after completion
   * Called after user completes payment in Razorpay popup
   */
  verifyRazorpayPayment: async (paymentData: {
    orderId: string
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
  }): Promise<{
    success: boolean
    error?: string
  }> => {
    try {
      const response = await fetch('/api/orders/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      return await response.json()
    } catch (error) {
      console.error('Error verifying payment:', error)
      return {
        success: false,
        error: 'Failed to verify payment',
      }
    }
  },

  /**
   * Update order status
   * This is for admin/dashboard use
   */
  updateOrderStatus: async (
    updateData: UpdateOrderStatusRequest,
  ): Promise<UpdateOrderStatusResponse> => {
    try {
      const response = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update order status',
        details: (error as Error).message,
      }
    }
  },

  /**
   * Process payment for an order
   */
  processPayment: async (
    orderId: string,
    paymentMethod: 'online' | 'cash',
  ): Promise<UpdateOrderStatusResponse> => {
    try {
      // For online payments, we would typically integrate with a payment gateway here
      // For cash payments, we just mark it as paid

      const response = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          paymentStatus: 'paid',
          paymentMethod: paymentMethod,
        }),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process payment',
        details: (error as Error).message,
      }
    }
  },
}
