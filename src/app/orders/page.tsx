'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import { orderService } from '@/services/orderService'

function OrdersContent() {
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')
  const searchParam = searchParams.get('search')
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParam || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      try {
        const res = await orderService.getOrders({
          tableNumber: tableDataParam ?? undefined,
          customerName: searchParam ?? undefined,
        })
        if (res.success && res.orders) {
          setOrders(res.orders)
          setFilteredOrders(res.orders)
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
  }, [tableDataParam, searchParam])

  // Initialize search query from URL params
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam)
      setIsSearchActive(true)
    }
  }, [searchParam])

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders)
      setIsSearchActive(false)
      return
    }

    setIsSearchActive(true)
    const query = searchQuery.toLowerCase().trim()
    const filtered = orders.filter((order) => {
      return (
        // Search by order ID
        (order.id && order.id.toLowerCase().includes(query)) ||
        // Search by customer name
        (order.customerName &&
          order.customerName.toLowerCase().includes(query)) ||
        // Search by table number
        (order.tableNumber && order.tableNumber.toString().includes(query)) ||
        // Search by status
        (order.status && order.status.toLowerCase().includes(query)) ||
        // Search by items
        order.items.some(
          (item: any) =>
            (item.name && item.name.toLowerCase().includes(query)) ||
            (item.menuItemId && item.menuItemId.toLowerCase().includes(query)),
        ) ||
        // Search by notes
        (order.notes && order.notes.toLowerCase().includes(query))
      )
    })

    setFilteredOrders(filtered)
  }, [searchQuery, orders])

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
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Update URL with search parameter
    const url = new URL(window.location.href)
    if (searchQuery.trim()) {
      url.searchParams.set('search', searchQuery.trim())
    } else {
      url.searchParams.delete('search')
    }
    window.history.pushState({}, '', url.toString())
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setIsSearchActive(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('search')
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-amber-900 text-center mb-6">
        Your Orders
      </h1>

      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
              <CiSearch style={{ fontSize: 24 }} />
            </span>
            <input
              type="text"
              placeholder="Search orders by name, ID, table, items..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-12 py-3 bg-white border border-amber-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Search results indicator */}
      {isSearchActive && (
        <div className="flex items-center justify-between mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <div className="text-amber-800">
            <span className="font-medium">Search results: </span>
            <span className="font-bold">{filteredOrders.length}</span>
            <span>
              {' '}
              {filteredOrders.length === 1 ? 'order' : 'orders'} found
            </span>
          </div>
          <button
            onClick={clearSearch}
            className="text-amber-600 hover:text-amber-800 text-sm flex items-center gap-1"
          >
            <span>Clear</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      )}

      {/* Empty state for search results */}
      {isSearchActive && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl shadow-sm border border-amber-100">
          <div className="text-amber-500 mb-3">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">
            No orders found
          </h3>
          <p className="text-gray-500 text-center max-w-xs">
            We couldn&apos;t find any orders matching &quot;{searchQuery}&quot;.
            Try using different keywords or
            <button
              onClick={clearSearch}
              className="text-amber-600 hover:underline ml-1"
            >
              clear search
            </button>
          </p>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-6">
        {filteredOrders.length > 0 &&
          filteredOrders.map((order) => (
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
