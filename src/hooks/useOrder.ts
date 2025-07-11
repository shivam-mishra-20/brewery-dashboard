import { useCallback, useState } from 'react'
import {
  GetOrdersResponse,
  orderService,
  PlaceOrderRequest,
  UpdateOrderStatusRequest,
} from '@/services/orderService'

/**
 * Custom hook for order-related operations
 */
export const useOrder = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<GetOrdersResponse['orders']>([])

  /**
   * Place a new order
   */
  const placeOrder = useCallback(async (orderData: PlaceOrderRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await orderService.placeOrder(orderData)

      if (!result.success) {
        setError(result.error || 'Failed to place order')
        return { success: false, error: result.error, details: result.details }
      }

      return { success: true, order: result.order }
    } catch (err) {
      const errorMessage =
        (err as Error).message || 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch orders with optional filtering
   */
  const fetchOrders = useCallback(
    async (filters?: {
      status?: string
      tableNumber?: string
      customerName?: string
    }) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await orderService.getOrders(filters)

        if (!result.success) {
          setError(result.error || 'Failed to fetch orders')
          return {
            success: false,
            error: result.error,
            details: result.details,
          }
        }

        setOrders(result.orders || [])
        return { success: true, orders: result.orders }
      } catch (err) {
        const errorMessage =
          (err as Error).message || 'An unexpected error occurred'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(
    async (updateData: UpdateOrderStatusRequest) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await orderService.updateOrderStatus(updateData)

        if (!result.success) {
          setError(result.error || 'Failed to update order status')
          return {
            success: false,
            error: result.error,
            details: result.details,
          }
        }

        // Update the local state if we have orders
        if (orders?.length) {
          setOrders((prevOrders) =>
            prevOrders?.map((order) =>
              order.id === updateData.id
                ? {
                    ...order,
                    status: updateData.status,
                    updatedAt: new Date().toISOString(),
                  }
                : order,
            ),
          )
        }

        return { success: true, order: result.order }
      } catch (err) {
        const errorMessage =
          (err as Error).message || 'An unexpected error occurred'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [orders],
  )

  return {
    isLoading,
    error,
    orders,
    placeOrder,
    fetchOrders,
    updateOrderStatus,
  }
}
