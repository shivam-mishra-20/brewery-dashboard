'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { orderService } from '@/services/orderService'

function OrdersContent() {
  const searchParams = useSearchParams()
  const tableDataParam = searchParams?.get('tabledata')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      try {
        const res = await orderService.getOrders({
          tableNumber: tableDataParam ?? undefined,
        })
        if (res.success && res.orders) {
          setOrders(res.orders)
        } else {
          setError(res.error || 'Failed to fetch orders')
        }
      } catch {
        setError('Failed to fetch orders')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [tableDataParam])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <span className="ml-4 text-amber-700 font-bold">Loading orders...</span>
      </div>
    )
  }
  if (error) {
    return <div className="text-center text-red-500 mt-20">{error}</div>
  }
  if (!orders.length) {
    return (
      <div className="text-center text-gray-500 mt-20">No orders found.</div>
    )
  }
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-amber-900 text-center mb-8">
        Your Orders
      </h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-md p-6 border border-amber-100"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-amber-800">
                Order #{order.id}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-amber-100 text-amber-700'}`}
              >
                {order.status}
              </span>
            </div>
            <div className="mb-2 text-sm text-gray-600">
              Table: {order.tableNumber || '-'}
            </div>
            <div className="mb-2 text-sm text-gray-600">
              Customer: {order.customerName}
            </div>
            <div className="mb-2 text-sm text-gray-600">
              Total: ₹{order.totalAmount.toFixed(2)}
            </div>
            <div className="mb-2 text-xs text-gray-500">
              Placed: {new Date(order.createdAt).toLocaleString()}
            </div>
            <div className="mt-3">
              <div className="font-semibold text-amber-700 mb-1">Items:</div>
              <ul className="list-disc ml-6">
                {order.items.map((item: any) => (
                  <li key={item.menuItemId} className="mb-1">
                    <span className="font-bold text-gray-800">
                      {item.name || item.menuItemId}
                    </span>{' '}
                    x {item.quantity}{' '}
                    <span className="text-xs text-gray-500">
                      ₹{item.price?.toFixed(2) || '-'}
                    </span>
                    {item.ingredients && (
                      <span className="ml-2 text-xs text-amber-600">
                        Ingredients:{' '}
                        {item.ingredients
                          .map(
                            (ing: any) =>
                              `${ing.inventoryItemName} (${ing.quantity}${ing.unit})`,
                          )
                          .join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {order.notes && (
              <div className="mt-2 text-xs text-gray-500">
                Notes: {order.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return <OrdersContent />
}
