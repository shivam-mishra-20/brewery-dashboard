import { OrderItem } from '@/models/OrderModel'

export interface PlaceOrderRequest {
  customerName: string
  tableNumber?: string
  items: OrderRequestItem[]
  notes?: string
}

export interface OrderRequestItem {
  menuItemId: string
  quantity: number
}

export interface PlaceOrderResponse {
  success: boolean
  order?: {
    id: string
    customerName: string
    tableNumber?: string
    status: string
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
    notes?: string
    createdAt: string
    updatedAt: string
  }>
  error?: string
  details?: unknown
}

export interface UpdateOrderStatusRequest {
  id: string
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  notes?: string
}

export interface UpdateOrderStatusResponse {
  success: boolean
  order?: {
    id: string
    customerName: string
    status: string
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
        if (filters.status) queryParams.append('status', filters.status)
        if (filters.tableNumber)
          queryParams.append('tableNumber', filters.tableNumber)
        if (filters.customerName)
          queryParams.append('customerName', filters.customerName)
      }

      const response = await fetch(
        `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const result = await response.json()
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch orders',
        details: (error as Error).message,
      }
    }
  },

  /**
   * Update order status
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
}
