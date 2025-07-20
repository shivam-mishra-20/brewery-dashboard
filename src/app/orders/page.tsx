'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import confetti from 'canvas-confetti'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCoffee,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiX,
} from 'react-icons/fi'
import { orderService } from '@/services/orderService'
import { initializeRazorpay } from '@/services/paymentService'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
type PaymentStatus = 'unpaid' | 'paid' | 'pending'

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  selectedAddOns?: {
    name: string
    price: number
    quantity: number
    unit: string
  }[]
}

interface Order {
  id: string
  customerName: string
  tableNumber?: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: 'online' | 'cash'
  notes?: string
  createdAt: string
  updatedAt: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')
  const searchParam = searchParams.get('search')
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParam || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  // For polling updates
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'info' | 'error'
  } | null>(null)

  // Use refs to avoid dependency cycles and excessive re-renders
  const prevOrdersRef = useRef<Order[]>([])
  const countdownRef = useRef(refreshCountdown)
  const isLoadingRef = useRef(loading)
  const isAutoRefreshRef = useRef(autoRefresh)

  // API request tracker to prevent race conditions
  const apiRequestRef = useRef<number>(0)

  const fetchOrders = useCallback(async () => {
    // Prevent duplicate API calls if already loading
    if (loading) return

    // Track this specific API request with a timestamp
    const requestId = Date.now()
    apiRequestRef.current = requestId

    setLoading(true)

    // For debugging - remove in production
    console.log('Fetching orders with params:', {
      tableNumber: tableDataParam ?? undefined,
      customerName: searchParam ?? undefined,
    })

    try {
      // Handle the tableDataParam differently - it might be encrypted or encoded
      let tableNumber: string | undefined = undefined

      if (tableDataParam) {
        const decodedTableData = decodeURIComponent(tableDataParam)
        console.log('Using table data for API call:', decodedTableData)

        // Check if this is likely an encrypted value (base64-like string)
        const isEncrypted =
          /^[A-Za-z0-9+/=]+$/.test(decodedTableData) &&
          decodedTableData.length > 20

        if (isEncrypted) {
          console.log(
            'Table data appears to be encrypted, will use separate extraction approach',
          )
          // For encrypted values, try to extract table number or use as is
          tableNumber = decodedTableData
        } else {
          // If it's not encrypted, try to extract just the number
          const tableMatch = decodedTableData.match(/\b(\d+)\b/)
          if (tableMatch) {
            tableNumber = tableMatch[1]
            console.log(`Extracted table number: ${tableNumber}`)
          } else {
            tableNumber = decodedTableData
          }
        }
      }

      const res = await orderService.getOrders({
        tableNumber,
        customerName: searchParam ?? undefined,
      })

      // If another request came in while this one was processing, discard results
      if (apiRequestRef.current !== requestId) {
        console.log('Discarding stale API response')
        return // Don't update state with stale data
      }

      // Log the API response for debugging
      console.log('API Response:', res)

      if (res.success && res.orders && Array.isArray(res.orders)) {
        console.log(`Found ${res.orders.length} orders in response`)

        // If orders array is empty but response is success, handle specially
        if (res.orders.length === 0) {
          console.warn(
            'Server returned success but empty orders array. Manually creating test order.',
          )

          // This is a temporary workaround - can be removed when API is fixed
          // Check if this is a debugging environment
          if (process.env.NODE_ENV === 'development') {
            // Add a fallback test order for debugging purposes
            res.orders = [
              {
                id: 'test-order-' + Date.now(),
                customerName: 'Test Customer',
                tableNumber: tableNumber || 'Test Table',
                items: [
                  {
                    menuItemId: 'test-item',
                    name: 'Test Item',
                    price: 100,
                    quantity: 1,
                    selectedAddOns: [],
                  },
                ],
                totalAmount: 100,
                status: 'pending',
                paymentStatus: 'paid',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]

            console.log('Added test order for debugging:', res.orders[0])
          }
        }
        // More robust mapping to ensure all fields are properly typed
        const typedOrders = res.orders.map((order) => ({
          id: order.id || '',
          customerName: order.customerName || 'Anonymous',
          tableNumber: order.tableNumber || '',
          items: Array.isArray(order.items)
            ? order.items.map((item) => ({
                menuItemId: item.menuItemId || '',
                name: item.name || 'Unknown Item',
                price: typeof item.price === 'number' ? item.price : 0,
                quantity: typeof item.quantity === 'number' ? item.quantity : 1,
                selectedAddOns: Array.isArray(item.selectedAddOns)
                  ? item.selectedAddOns
                  : [],
              }))
            : [],
          totalAmount:
            typeof order.totalAmount === 'number' ? order.totalAmount : 0,
          status: (order.status || 'pending') as OrderStatus,
          paymentStatus: (order.paymentStatus || 'unpaid') as PaymentStatus,
          paymentMethod: (order as any).paymentMethod as
            | 'online'
            | 'cash'
            | undefined,
          notes: order.notes || '',
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString(),
        }))

        // Check if any order status has changed using the ref
        if (prevOrdersRef.current.length > 0) {
          const changedOrders = typedOrders.filter((newOrder) => {
            const prevOrder = prevOrdersRef.current.find(
              (p) => p.id === newOrder.id,
            )
            return (
              prevOrder &&
              (prevOrder.status !== newOrder.status ||
                prevOrder.paymentStatus !== newOrder.paymentStatus)
            )
          })

          // Show notification if there are changes
          if (changedOrders.length > 0) {
            setNotification({
              message: `${changedOrders.length} order${changedOrders.length > 1 ? 's' : ''} updated!`,
              type: 'success',
            })

            // Check if any order changed to completed status and trigger confetti
            const completedOrders = changedOrders.filter(
              (order) =>
                order.status === 'completed' &&
                prevOrdersRef.current.find((p) => p.id === order.id)?.status !==
                  'completed',
            )

            if (completedOrders.length > 0) {
              // Trigger confetti animation for completed orders
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#d97706', '#92400e', '#fbbf24'],
              })
            }

            // Auto-dismiss notification after 5 seconds
            setTimeout(() => {
              setNotification(null)
            }, 5000)
          }
        }

        // Update the ref with new orders
        prevOrdersRef.current = typedOrders

        setOrders(typedOrders)
        setFilteredOrders(typedOrders)
        setError(null) // Clear any previous errors
        setLastRefreshTime(new Date())
        // If we've just refreshed, reset the countdown to 3 minutes (180 seconds)
        const refreshInterval = 180
        setRefreshCountdown(refreshInterval)
        // Keep the ref in sync
        countdownRef.current = refreshInterval
      } else if (
        res.success &&
        (!res.orders || !Array.isArray(res.orders) || res.orders.length === 0)
      ) {
        // Handle empty orders array specifically
        console.log('API returned success but no orders found')
        setOrders([])
        setFilteredOrders([])
        setError(null) // No error, just no orders
        setLastRefreshTime(new Date())
        const refreshInterval = 180
        setRefreshCountdown(refreshInterval)
        countdownRef.current = refreshInterval
      } else {
        // Log the error for debugging
        console.error('API Error:', res.error || 'Unknown error')
        setError(res.error || 'Failed to fetch orders')
      }
    } catch (err) {
      console.error('Error fetching orders:', err)

      // More detailed error message
      let errorMessage = 'Failed to fetch orders'
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log('Fetch completed, loading state set to false')
    }
  }, [tableDataParam, searchParam, loading])

  // Track fetch attempts and status
  const initialFetchRef = useRef(false)
  const initialRetryAttemptsRef = useRef(0)
  const maxRetryAttempts = 5 // Increase retry attempts
  const lastAttemptTimeRef = useRef<Date | null>(null)

  // Initial order fetch - with retry logic
  useEffect(() => {
    const attemptInitialFetch = () => {
      // Record the time of this attempt
      lastAttemptTimeRef.current = new Date()
      console.log(
        `Order fetch attempt at ${lastAttemptTimeRef.current.toLocaleTimeString()}`,
      )

      if (!initialFetchRef.current || initialRetryAttemptsRef.current > 0) {
        console.log(
          'Attempting fetch of orders',
          initialRetryAttemptsRef.current > 0
            ? `(retry ${initialRetryAttemptsRef.current})`
            : '(initial)',
        )
        initialFetchRef.current = true

        // First attempt after a small delay
        const initialFetchTimer = setTimeout(() => {
          fetchOrders().catch((err) => {
            console.error('Order fetch failed:', err)

            // If first attempt fails, retry a few times with increasing delays
            if (initialRetryAttemptsRef.current < maxRetryAttempts) {
              initialRetryAttemptsRef.current++
              const retryDelay = 1500 * initialRetryAttemptsRef.current // Increase delay with each retry
              console.log(
                `Retrying fetch in ${retryDelay}ms (attempt ${initialRetryAttemptsRef.current}/${maxRetryAttempts})`,
              )

              setTimeout(() => {
                initialFetchRef.current = false // Reset to allow another attempt
                attemptInitialFetch()
              }, retryDelay)
            } else {
              console.log(
                'Maximum retry attempts reached. Please check network or API.',
              )
            }
          })
        }, 300) // Small initial delay

        return () => clearTimeout(initialFetchTimer)
      }
    }

    attemptInitialFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep refs updated with latest state values
  useEffect(() => {
    isLoadingRef.current = loading
  }, [loading])

  useEffect(() => {
    isAutoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    countdownRef.current = refreshCountdown
  }, [refreshCountdown])

  // Optimized auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return

    // UI countdown timer - updates every second for visual feedback only
    const countdownId = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev > 0) {
          return prev - 1
        } else {
          // When countdown reaches zero, fetch data if not already loading
          if (!isLoadingRef.current) {
            fetchOrders()
          }
          // Reset to 3 minutes (180 seconds)
          return 180
        }
      })
    }, 1000)

    return () => {
      clearInterval(countdownId)
    }
  }, [autoRefresh, fetchOrders])

  // Initialize search query from URL params
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam)
      setIsSearchActive(true)
    }
  }, [searchParam])

  // Create a debounced search function to avoid excessive filtering
  const debouncedSearchRef = useRef<NodeJS.Timeout | null>(null)

  // Filter orders based on search query with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current)
    }

    // Set a new timeout
    debouncedSearchRef.current = setTimeout(() => {
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
              (item.menuItemId &&
                item.menuItemId.toLowerCase().includes(query)),
          ) ||
          // Search by notes
          (order.notes && order.notes.toLowerCase().includes(query))
        )
      })

      setFilteredOrders(filtered)
    }, 600) // 600ms debounce

    // Cleanup on unmount
    return () => {
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current)
      }
    }
  }, [searchQuery, orders])

  // Function to handle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId((prevId) => (prevId === orderId ? null : orderId))
  }

  // Helper function to check if order has items
  const hasOrderItems = (order: Order) => {
    return order.items && Array.isArray(order.items) && order.items.length > 0
  }

  // Function to manually refresh orders
  const handleManualRefresh = () => {
    fetchOrders()
  }

  // Function to toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev)
  }

  // Function to initiate online payment through Razorpay
  const initiateOnlinePayment = async (order: Order) => {
    try {
      setLoading(true)

      // Show processing notification
      setNotification({
        message: 'Preparing payment gateway...',
        type: 'info',
      })

      // Create a payment request to the payment service API
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.totalAmount * 100, // Convert to paise
        }),
      })

      const razorpayResult = await response.json()

      if (!razorpayResult.success || !razorpayResult.orderId) {
        throw new Error(
          razorpayResult.error || 'Failed to create payment order',
        )
      }

      // Load Razorpay script dynamically
      const isLoaded = await initializeRazorpay()
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load')
      }

      // Create Razorpay instance with configuration
      const paymentObject = new window.Razorpay({
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_YOUR_TEST_KEY_HERE',
        amount: order.totalAmount * 100, // Amount in paisa
        currency: 'INR',
        name: 'WorkBrew',
        description: `Payment for Order #${order.id.substring(0, 8)}`,
        order_id: razorpayResult.orderId,
        prefill: {
          name: order.customerName,
        },
        theme: {
          color: '#f59e0b', // Amber color to match the theme
        },
        // This handler is called when payment completes successfully
        handler: async function (response: any) {
          try {
            // Verify payment with our backend
            const verificationResult = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            }).then((res) => res.json())

            if (verificationResult.success) {
              // Update the order to set paymentMethod to 'online' and paymentStatus to 'paid'
              await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: order.id,
                  paymentStatus: 'paid',
                  paymentMethod: 'online',
                }),
              })

              // Show success notification with confetti effect
              setNotification({
                message: 'Payment successful! Thank you for your order.',
                type: 'success',
              })

              // Trigger confetti for successful payment
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.5 },
                colors: ['#10b981', '#059669', '#065f46', '#34d399'],
              })

              // Refresh orders to show updated payment status
              fetchOrders()
            } else {
              throw new Error(
                verificationResult.error || 'Payment verification failed',
              )
            }
          } catch (error) {
            console.error('Verification error:', error)
            setNotification({
              message:
                error instanceof Error
                  ? error.message
                  : 'Payment verification failed',
              type: 'error',
            })
          }
        },
      })

      // Open payment form
      paymentObject.open()
    } catch (err) {
      console.error('Online payment error:', err)

      // Show detailed error notification
      setNotification({
        message: err instanceof Error ? err.message : 'Payment process failed',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to mark order for cash payment
  const markForCashPayment = async (order: Order) => {
    try {
      setLoading(true)

      // Show processing notification
      setNotification({
        message: 'Marking for cash payment...',
        type: 'info',
      })

      // Update the order status directly using the order update API
      const response = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: order.id,
          paymentStatus: 'pending', // Mark as pending until cash is collected
          paymentMethod: 'cash',
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Show success notification
        setNotification({
          message: 'Order marked for cash payment. Please pay at the counter.',
          type: 'success',
        })

        // Refresh orders to show updated payment status
        fetchOrders()
      } else {
        throw new Error(result.error || 'Failed to mark for cash payment')
      }
    } catch (err) {
      console.error('Cash payment marking error:', err)

      // Show detailed error notification
      setNotification({
        message:
          err instanceof Error
            ? err.message
            : 'Failed to update payment method',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to get appropriate status styling
  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          icon: <FiClock className="mr-1" />,
        }
      case 'preparing':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: <FiCoffee className="mr-1" />,
        }
      case 'ready':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: <FiPackage className="mr-1" />,
        }
      case 'completed':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          icon: <FiCheck className="mr-1" />,
        }
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          icon: <FiX className="mr-1" />,
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: <FiInfo className="mr-1" />,
        }
    }
  }

  // Function to get payment status styling and label
  const getPaymentStatusDisplay = (order: Order) => {
    let label = ''
    let bg = ''
    let text = ''
    let icon = null
    let extra = ''
    const isCash = order.paymentMethod === 'cash'
    // const isOnline = order.paymentMethod === 'online'
    if (order.paymentStatus === 'paid') {
      if (isCash) {
        label = 'Cash Paid'
        bg = 'bg-green-100'
        text = 'text-green-700'
        icon = <FiCheck className="mr-1" />
      } else {
        label = 'Online Paid'
        bg = 'bg-green-100'
        text = 'text-green-700'
        icon = <FiCheck className="mr-1" />
      }
    } else if (
      order.paymentStatus === 'pending' ||
      order.paymentStatus === 'unpaid'
    ) {
      if (isCash) {
        label = 'Cash Pending'
        bg = 'bg-yellow-100'
        text = 'text-yellow-700'
        icon = <FiClock className="mr-1" />
        // Show cash left to be collected
        extra = `₹${order.totalAmount.toFixed(2)} left to collect`
      } else {
        label = 'Online Pending'
        bg = 'bg-yellow-100'
        text = 'text-yellow-700'
        icon = <FiClock className="mr-1" />
      }
    } else {
      label = 'Unknown'
      bg = 'bg-gray-100'
      text = 'text-gray-700'
      icon = <FiInfo className="mr-1" />
    }
    return { label, bg, text, icon, extra }
  }

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Handles payment processing for an order (mark as cash or initiate online payment)
  async function handlePaymentProcess(
    id: string,
    method: 'cash' | 'online',
  ): Promise<void> {
    const order = orders.find((o) => o.id === id)
    if (!order) {
      setNotification({
        message: 'Order not found.',
        type: 'error',
      })
      return
    }
    if (method === 'cash') {
      await markForCashPayment(order)
    } else if (method === 'online') {
      await initiateOnlinePayment(order)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 px-4 py-8 pb-24">
      {/* Notification toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-50 rounded-lg shadow-lg p-4 flex items-center justify-between transition-all duration-500 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : notification.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full mr-3 ${
                notification.type === 'success'
                  ? 'bg-green-200 text-green-600'
                  : notification.type === 'error'
                    ? 'bg-red-200 text-red-600'
                    : 'bg-blue-200 text-blue-600'
              }`}
            >
              {notification.type === 'success' ? (
                <FiCheck />
              ) : notification.type === 'error' ? (
                <FiAlertCircle />
              ) : (
                <FiInfo />
              )}
            </div>
            <p className="font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <FiX />
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header with title and back button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
            Your Orders
          </h1>
          <Link
            href={`/menu${tableDataParam ? `?tabledata=${encodeURIComponent(tableDataParam)}` : ''}`}
            className="flex items-center text-amber-700 hover:text-amber-900 transition-colors"
          >
            <FiArrowLeft className="mr-1" /> Back to Menu
          </Link>
        </div>

        {/* Auto refresh status */}
        <div
          className={`flex items-center justify-between mb-4 rounded-lg shadow-sm p-3 border transition-all duration-300 ${loading ? 'bg-amber-50 border-amber-200' : 'bg-white border-amber-100'}`}
        >
          <div className="flex items-center">
            <FiRefreshCw
              className={`mr-2 ${autoRefresh && !loading ? 'text-amber-700' : loading ? 'animate-spin text-amber-500' : 'text-gray-400'}`}
            />
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center">
                {loading ? (
                  <>
                    <span className="inline-block w-3 h-3 bg-amber-500 rounded-full animate-pulse mr-2"></span>
                    Refreshing<span className="dots-animation ml-1">...</span>
                  </>
                ) : autoRefresh ? (
                  <>
                    Auto-refreshing in{' '}
                    <span className="font-bold ml-1 text-amber-700">
                      {Math.floor(refreshCountdown / 60)}m{' '}
                      {refreshCountdown % 60}s
                    </span>
                  </>
                ) : (
                  'Auto-refresh is off'
                )}
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full transition-colors ${loading ? 'bg-amber-100 cursor-not-allowed' : 'hover:bg-amber-100'}`}
              disabled={loading}
              aria-label="Refresh orders"
              title="Refresh now"
            >
              <FiRefreshCw
                className={`${loading ? 'animate-spin' : ''} text-amber-700`}
                size={18}
              />
            </button>
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                autoRefresh
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-700'
              }`}
              title={
                autoRefresh
                  ? 'Turn off auto-refresh (currently updating every 3 minutes)'
                  : 'Turn on auto-refresh (updates every 3 minutes)'
              }
            >
              {autoRefresh ? 'AUTO' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Add CSS animation for dots and notifications */}
        <style jsx global>{`
          @keyframes dotAnimation {
            0% {
              content: '.';
            }
            33% {
              content: '..';
            }
            66% {
              content: '...';
            }
            100% {
              content: '';
            }
          }
          .dots-animation::after {
            content: '';
            animation: dotAnimation 1.5s infinite;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
            <FiSearch size={24} />
          </span>
          <input
            type="text"
            placeholder="Search orders by name, table, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-amber-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Main content */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-amber-100 p-6">
            <div className="w-24 h-24 mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-amber-100"></div>
              <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-amber-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiCoffee className="text-amber-500 text-2xl" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary mb-2">
              Brewing Your Orders
            </h3>
            <p className="text-amber-600 text-center">
              Please wait while we fetch your order history...
            </p>
          </div>
        ) : error ? (
          <div className="text-center bg-red-50 border border-red-200 rounded-xl shadow-sm p-8 mt-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <FiAlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-red-700 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center bg-white/80 backdrop-blur-sm border border-amber-100 rounded-xl shadow-sm p-8 mt-4">
            <div className="w-40 h-40 mx-auto mb-6">
              <DotLottieReact
                src="https://lottie.host/8f640ecf-517b-4af2-a0d7-5f64686db407/aEH8wUJWWD.lottie"
                autoplay
                loop
              />
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary mb-3">
              {isSearchActive ? 'No Matching Orders' : 'No Orders Yet'}
            </h3>
            <p className="text-gray-600 mb-4 max-w-sm mx-auto">
              {isSearchActive
                ? `We couldn't find any orders matching "${searchQuery}". Try a different search term.`
                : tableDataParam
                  ? `No orders found for table ${tableDataParam}. Browse our menu to place an order.`
                  : "You haven't placed any orders yet. Browse our delicious menu to get started."}
            </p>

            {/* Technical debug information - can be removed in production */}
            <div className="bg-gray-100 border border-gray-200 rounded p-3 mb-4 text-left text-xs font-mono overflow-auto max-h-40">
              <div>
                <strong>Debug Info:</strong>
              </div>
              <div>Table param: {JSON.stringify(tableDataParam)}</div>
              <div>API loaded: {loading ? 'Loading...' : 'Complete'}</div>
              <div>
                Last attempt:{' '}
                {lastAttemptTimeRef.current?.toLocaleTimeString() || 'None'}
              </div>
              <div>
                Retry count: {initialRetryAttemptsRef.current}/
                {maxRetryAttempts}
              </div>
              <div>Raw orders array: {orders.length}</div>
              <div>Filtered orders: {filteredOrders.length}</div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Table data: {tableDataParam || 'Not provided'} • Last checked:{' '}
              {lastRefreshTime.toLocaleTimeString()}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isSearchActive && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-center">
                    <FiX className="mr-2" />
                    Clear Search
                  </div>
                </button>
              )}

              {/* Debug button to help diagnose API issues */}
              <button
                onClick={() => {
                  console.log('Creating test order manually')
                  // Create a test order for debugging
                  const testOrder: Order = {
                    id: 'test-order-' + Date.now(),
                    customerName: 'Test Customer',
                    tableNumber: tableDataParam || 'Test Table',
                    items: [
                      {
                        menuItemId: 'test-item',
                        name: 'Test Item',
                        price: 100,
                        quantity: 1,
                        selectedAddOns: [],
                      },
                    ],
                    totalAmount: 100,
                    status: 'pending' as OrderStatus,
                    paymentStatus: 'paid' as PaymentStatus,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }

                  setOrders([testOrder])
                  setFilteredOrders([testOrder])
                  setError(null)
                  setLastRefreshTime(new Date())
                }}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-center">
                  <FiShoppingBag className="mr-2" />
                  Create Test Order
                </div>
              </button>
              <Link
                href={`/menu${tableDataParam ? `?tabledata=${encodeURIComponent(tableDataParam)}` : ''}`}
                className="px-5 py-2.5 bg-gradient-to-r from-secondary to-primary text-white rounded-lg hover:from-primary hover:to-secondary transition-all shadow-sm"
              >
                <div className="flex items-center justify-center">
                  <FiShoppingBag className="mr-2" />
                  Browse Menu
                </div>
              </Link>
            </div>
          </div>
        ) : (
          // Orders list
          <div className="space-y-6">
            {filteredOrders.length > 0 &&
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow-md p-5 border ${expandedOrderId === order.id ? 'border-amber-300' : 'border-amber-100'}`}
                >
                  {/* Order header with ID and status badges */}
                  <div className="flex flex-wrap justify-between items-center mb-3">
                    <div className="flex items-center">
                      <span className="font-bold text-amber-800 mr-3">
                        Order #{order.id.substring(0, 8)}...
                      </span>
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="text-xs text-amber-600 hover:text-amber-800 underline"
                      >
                        {expandedOrderId === order.id
                          ? 'Hide details'
                          : 'View details'}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1 sm:mt-0">
                      {/* Order status badge */}
                      <div
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusStyles(order.status).bg} ${getStatusStyles(order.status).text}`}
                      >
                        {getStatusStyles(order.status).icon}
                        {order.status}
                      </div>

                      {/* Payment status badge (improved) */}
                      {(() => {
                        const { label, bg, text, icon, extra } =
                          getPaymentStatusDisplay(order)
                        return (
                          <div
                            className={`flex items-center px-3 py-1 rounded-full text-xs font-bold ${bg} ${text}`}
                          >
                            {icon}
                            {label}
                            {extra && (
                              <span className="ml-2 text-xs font-normal text-amber-700">
                                {extra}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Payment action banner for unpaid orders */}
                  {(order.paymentStatus === 'unpaid' ||
                    order.paymentStatus === 'pending') && (
                    <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="p-2 bg-amber-100 rounded-full mr-2">
                            <FiAlertCircle className="text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-amber-800 text-sm">
                              Payment Required
                            </h4>
                            <p className="text-xs text-amber-700">
                              This order requires payment of ₹
                              {order.totalAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Show payment method only if order is not expanded */}
                        {expandedOrderId !== order.id && (
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                          >
                            Choose Payment Method
                          </button>
                        )}
                      </div>

                      {/* Payment options - shown only when order is expanded */}
                      {expandedOrderId === order.id && (
                        <div className="mt-2 pt-2 border-t border-amber-100">
                          <p className="text-xs text-amber-800 mb-2">
                            Select a payment method:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {/* Cash payment option */}
                            <button
                              onClick={() => markForCashPayment(order)}
                              className="flex-1 px-3 py-2 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-md shadow-sm transition-colors flex items-center justify-center"
                              disabled={loading}
                            >
                              <FiDollarSign className="mr-1" />
                              <span className="font-medium text-sm">
                                Pay Cash
                              </span>
                            </button>

                            {/* Online payment option with Razorpay */}
                            <button
                              onClick={() => initiateOnlinePayment(order)}
                              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors flex items-center justify-center"
                              disabled={loading}
                            >
                              <FiCreditCard className="mr-1" />
                              <span className="font-medium text-sm">
                                Pay Online
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order summary info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                    <div className="text-sm text-gray-600">
                      <span className="text-xs text-gray-500">Table:</span>{' '}
                      {order.tableNumber || '-'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="text-xs text-gray-500">Customer:</span>{' '}
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="text-xs text-gray-500">Total:</span> ₹
                      {order.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 col-span-2 sm:col-span-3">
                      <span className="text-xs text-gray-500">Placed:</span>{' '}
                      {formatDate(order.createdAt)}
                    </div>

                    {/* Payment method if available */}
                    {order.paymentMethod && (
                      <div className="text-sm text-gray-600 col-span-2 sm:col-span-3">
                        <span className="text-xs text-gray-500">
                          Payment Method:
                        </span>{' '}
                        {order.paymentMethod === 'online'
                          ? 'Online (Razorpay)'
                          : 'Cash'}
                      </div>
                    )}
                  </div>

                  {/* Order items */}
                  <div
                    className={`mt-4 transition-all duration-300 ${expandedOrderId === order.id ? 'opacity-100' : 'hidden'}`}
                  >
                    <div className="font-semibold text-amber-700 mb-2 pb-1 border-b border-amber-100">
                      Items ({hasOrderItems(order) ? order.items.length : 0})
                    </div>

                    {!hasOrderItems(order) ? (
                      <p className="text-gray-500 text-sm italic">
                        No items found in this order.
                      </p>
                    ) : (
                      <ul className="space-y-2 pl-1">
                        {order.items.map((item: any) => (
                          <li
                            key={item.menuItemId}
                            className="bg-amber-50/50 p-2 rounded"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-800">
                                  {item.name || item.menuItemId}
                                </span>
                                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                  x{item.quantity}
                                </span>
                              </div>
                              <span className="font-medium text-amber-800">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Add-ons if available */}
                            {item.selectedAddOns &&
                              item.selectedAddOns.length > 0 && (
                                <div className="mt-1.5 ml-4 text-xs text-gray-600">
                                  <span className="text-amber-700">
                                    Add-ons:
                                  </span>{' '}
                                  {item.selectedAddOns.map((addon: any) => (
                                    <span
                                      key={addon.name}
                                      className="ml-1 px-1.5 py-0.5 bg-white rounded text-xs"
                                    >
                                      {addon.name} (₹{addon.price.toFixed(2)})
                                    </span>
                                  ))}
                                </div>
                              )}

                            {/* Ingredients if available */}
                            {item.ingredients &&
                              item.ingredients.length > 0 && (
                                <div className="mt-1 ml-4 text-xs text-gray-500">
                                  <span className="text-amber-600">
                                    Ingredients:
                                  </span>{' '}
                                  {item.ingredients
                                    .map(
                                      (ing: any) =>
                                        `${ing.inventoryItemName} (${ing.quantity}${ing.unit})`,
                                    )
                                    .join(', ')}
                                </div>
                              )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Notes if available */}
                    {order.notes && (
                      <div className="mt-3 text-sm border-t border-amber-100 pt-2">
                        <span className="font-medium text-amber-700">
                          Notes:
                        </span>
                        <p className="mt-1 text-gray-600 bg-yellow-50 p-2 rounded italic">
                          &ldquo;{order.notes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Order timeline - shows in expanded view */}
                  {expandedOrderId === order.id && (
                    <div className="mt-4 pt-3 border-t border-amber-100">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center text-amber-700">
                          <FiClock className="mr-1.5" />
                          <span>Order Progress</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last updated:{' '}
                          {formatDate(order.updatedAt || order.createdAt)}
                        </div>
                      </div>

                      {/* Order progress bar */}
                      <div className="mb-4 relative">
                        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-amber-100">
                          <div
                            style={{
                              width:
                                order.status === 'pending'
                                  ? '20%'
                                  : order.status === 'preparing'
                                    ? '40%'
                                    : order.status === 'ready'
                                      ? '70%'
                                      : order.status === 'completed'
                                        ? '100%'
                                        : '0%',
                            }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              order.status === 'cancelled'
                                ? 'bg-red-500'
                                : 'bg-gradient-to-r from-amber-500 to-amber-400'
                            } transition-all duration-1000 ease-in-out`}
                          ></div>
                        </div>

                        {/* Progress steps */}
                        <div className="flex justify-between mt-1 px-1">
                          <div
                            className={`text-xs font-medium ${order.status === 'pending' || order.status === 'preparing' || order.status === 'ready' || order.status === 'completed' ? 'text-amber-700' : 'text-gray-400'}`}
                          >
                            Pending
                          </div>
                          <div
                            className={`text-xs font-medium ${order.status === 'preparing' || order.status === 'ready' || order.status === 'completed' ? 'text-amber-700' : 'text-gray-400'}`}
                          >
                            Preparing
                          </div>
                          <div
                            className={`text-xs font-medium ${order.status === 'ready' || order.status === 'completed' ? 'text-amber-700' : 'text-gray-400'}`}
                          >
                            Ready
                          </div>
                          <div
                            className={`text-xs font-medium ${order.status === 'completed' ? 'text-amber-700' : 'text-gray-400'}`}
                          >
                            Completed
                          </div>
                        </div>
                      </div>

                      {/* Payment information - DETAILED */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Payment Information
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Status:
                            </span>
                            {(() => {
                              const { label, text, icon, extra } =
                                getPaymentStatusDisplay(order)
                              return (
                                <span
                                  className={`text-sm font-medium flex items-center gap-1 ${text}`}
                                >
                                  {icon}
                                  {label}
                                  {extra && (
                                    <span className="ml-1 text-xs font-normal text-amber-700">
                                      {extra}
                                    </span>
                                  )}
                                </span>
                              )
                            })()}
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Method:
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {order.paymentMethod === 'online'
                                ? 'Online (Razorpay)'
                                : order.paymentMethod === 'cash'
                                  ? 'Cash'
                                  : 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Amount:
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              ₹{order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          {/* Show all payment details if available */}
                          {order.razorpayOrderId && (
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Razorpay Order ID:
                              </span>
                              <span className="text-xs font-mono text-gray-700">
                                {order.razorpayOrderId}
                              </span>
                            </div>
                          )}
                          {order.razorpayPaymentId && (
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Razorpay Payment ID:
                              </span>
                              <span className="text-xs font-mono text-gray-700">
                                {order.razorpayPaymentId}
                              </span>
                            </div>
                          )}
                          {order.paymentStatus && (
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Payment Status:
                              </span>
                              <span className="text-xs font-mono text-gray-700">
                                {order.paymentStatus}
                              </span>
                            </div>
                          )}
                          {order.paymentMethod && (
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Payment Method:
                              </span>
                              <span className="text-xs font-mono text-gray-700">
                                {order.paymentMethod}
                              </span>
                            </div>
                          )}
                          {order.updatedAt && (
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Last Updated:
                              </span>
                              <span className="text-xs font-mono text-gray-700">
                                {formatDate(order.updatedAt)}
                              </span>
                            </div>
                          )}
                          {order.createdAt && (
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Created At:
                              </span>
                              <span className="text-xs font-mono text-gray-700">
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Payment options for unpaid orders */}
                        {(order.paymentStatus === 'unpaid' ||
                          order.paymentStatus === 'pending') && (
                          <div className="w-full mt-3 border-t border-gray-200 pt-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 mb-2">
                                Process Payment:
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handlePaymentProcess(order.id, 'cash')
                                  }
                                  className="flex items-center justify-center px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
                                  disabled={loading}
                                >
                                  <FiCheck className="mr-1" /> Mark as Cash
                                  Payment
                                </button>
                                <button
                                  onClick={() =>
                                    handlePaymentProcess(order.id, 'online')
                                  }
                                  className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                                  disabled={loading}
                                >
                                  <span className="flex items-center">
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      className="mr-1"
                                    >
                                      <path
                                        d="M17.32 9.36L19.31 11.35C19.5 11.54 19.5 11.85 19.31 12.04L12.7 18.65C12.51 18.84 12.2 18.84 12.01 18.65L8.99 15.63C8.9 15.54 8.75 15.54 8.66 15.63L5.69 18.6C5.5 18.79 5.19 18.79 5 18.6L3.01 16.61C2.82 16.42 2.82 16.11 3.01 15.92L9.62 9.31C9.81 9.12 10.12 9.12 10.31 9.31L13.33 12.33C13.42 12.42 13.57 12.42 13.66 12.33L16.63 9.36C16.82 9.17 17.13 9.17 17.32 9.36Z"
                                        fill="white"
                                      />
                                    </svg>
                                    Process Online Payment
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return <OrdersContent />
}
