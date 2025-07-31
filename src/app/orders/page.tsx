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
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing')

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
    <div
      className="container mx-auto px-4 py-6 pb-28 absolute z-10 bg-[#0B3D2E]/80"
      style={{
        backgroundImage: 'url("/bg-image.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: 1,
      }}
    >
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/menu${tableDataParam ? `?tabledata=${encodeURIComponent(tableDataParam)}` : ''}`}
              className="flex items-center text-white hover:text-amber-900 transition-colors"
              aria-label="Back to Menu"
            >
              <FiArrowLeft size={24} />
            </Link>
            <h1 className="flex-1 text-center text-2xl font-serif font-normal text-white">
              Your Orders
            </h1>
            <div className="w-8" /> {/* Spacer for symmetry */}
          </div>
          <hr className="border-t border-white/20 mt-4" />
        </div>

        {/* Auto refresh status */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 rounded-xl shadow-sm p-4 border transition-all duration-300 ${
            loading
              ? 'bg-black/40 border-amber-200'
              : 'bg-black/40 border-amber-100'
          } backdrop-blur-md`}
        >
          <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
            <FiRefreshCw
              className={`flex-shrink-0 ${autoRefresh && !loading ? 'text-amber-700' : loading ? 'animate-spin text-amber-500' : 'text-gray-400'}`}
              size={22}
            />
            <div className="min-w-0">
              <p className="text-md font-serif text-white flex flex-wrap items-center gap-2">
                {loading ? (
                  <>
                    <span className="inline-block w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
                    Refreshing<span className="dots-animation ml-1">...</span>
                  </>
                ) : autoRefresh ? (
                  <>
                    <span>Auto-refresh in</span>
                    <span className="font-bold text-amber-700 text-lg tabular-nums">
                      {Math.floor(refreshCountdown / 60)}m
                    </span>
                    <span className="font-bold text-amber-700 text-lg tabular-nums">
                      {refreshCountdown % 60}s
                    </span>
                  </>
                ) : (
                  <span>Auto-refresh is off</span>
                )}
              </p>
              <p className="text-xs font-serif text-gray-400 truncate">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end -mt-8">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full transition-colors border ${loading ? 'bg-amber-100 cursor-not-allowed border-amber-100' : 'hover:bg-amber-200 bg-white/60 border-amber-200'}`}
              disabled={loading}
              aria-label="Refresh orders"
              title="Refresh now"
            >
              <FiRefreshCw
                className={`${loading ? 'animate-spin' : ''} text-amber-700`}
                size={14}
              />
            </button>
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center px-2 py-2 rounded-full text-xs font-semibold font-serif transition-all border focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                autoRefresh
                  ? 'bg-amber-500/80 text-white border-amber-500 shadow-sm'
                  : 'bg-gray-100/80 text-gray-700 border-gray-300'
              }`}
              title={
                autoRefresh
                  ? 'Turn off auto-refresh (currently updating every 3 minutes)'
                  : 'Turn on auto-refresh (updates every 3 minutes)'
              }
            >
              {autoRefresh ? (
                <>
                  <FiRefreshCw className="mr-1" /> AUTO
                </>
              ) : (
                <>
                  <FiX className="mr-1" /> OFF
                </>
              )}
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
        <div className="relative mb-8">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white">
            <FiSearch size={22} />
          </span>
          <input
            type="text"
            placeholder="Search orders by name, table, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-black/60 border border-amber-200 rounded-xl shadow-sm outline-none transition-all text-white placeholder:text-gray-400 backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-amber-500 transition"
              aria-label="Clear search"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Main content */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col overflow-auto overflow-y-scroll h-full items-center justify-center py-16 bg-black/60 backdrop-blur-sm rounded-xl shadow-sm border border-amber-100 p-6">
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
          <div className="text-center  bg-red-50 border border-red-200 rounded-xl shadow-sm p-8 mt-4">
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
          <div className="text-center overflow-auto overflow-y-scroll h-full bg-black/80 backdrop-blur-sm border border-amber-100 rounded-xl shadow-sm p-8 mt-4">
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
                  className={`rounded-2xl shadow-lg p-6 border border-[#1B2E24] bg-[#121212]/60 backdrop-blur-sm text-white max-w-md mx-auto relative transition-all duration-300 ${
                    expandedOrderId === order.id
                      ? 'border-amber-400'
                      : 'border-transparent'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-lg tracking-wide">
                        Order #{order.id.substring(0, 8)}...
                      </span>
                      <div className="text-xs text-gray-300 mt-1">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow border border-amber-700 bg-amber-700/80 text-white`}
                      >
                        {order.status === 'preparing'
                          ? 'Being Prepared'
                          : order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-amber-400" />
                      <span className="text-sm text-amber-200 font-medium">
                        Estimated Time
                      </span>
                    </div>
                    <span className="text-sm text-amber-100 font-semibold">
                      ~18 minutes
                    </span>
                  </div>
                  <div className="w-full flex items-center mb-4">
                    {/* Timeline steps */}
                    <div className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold border-2 border-amber-600">
                          <span>✓</span>
                        </div>
                        <span className="text-xs mt-1 text-amber-100">
                          Ordered
                        </span>
                      </div>
                      <div className="h-1 bg-amber-700 flex-1 mx-1"></div>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-6 h-6 rounded-full ${order.status === 'preparing' ? 'bg-amber-400' : 'bg-gray-700'} flex items-center justify-center text-black font-bold border-2 border-amber-600`}
                        >
                          <span>{order.status === 'preparing' ? '✓' : ''}</span>
                        </div>
                        <span className="text-xs mt-1 text-amber-100">
                          Preparing
                        </span>
                      </div>
                      <div className="h-1 bg-amber-700 flex-1 mx-1"></div>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-6 h-6 rounded-full ${order.status === 'ready' || order.status === 'completed' ? 'bg-amber-400' : 'bg-gray-700'} flex items-center justify-center text-black font-bold border-2 border-amber-600`}
                        >
                          <span>
                            {order.status === 'ready' ||
                            order.status === 'completed'
                              ? '✓'
                              : ''}
                          </span>
                        </div>
                        <span className="text-xs mt-1 text-amber-100">
                          Ready
                        </span>
                      </div>
                      <div className="h-1 bg-amber-700 flex-1 mx-1"></div>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-6 h-6 rounded-full ${order.status === 'completed' ? 'bg-amber-400' : 'bg-gray-700'} flex items-center justify-center text-black font-bold border-2 border-amber-600`}
                        >
                          <span>{order.status === 'completed' ? '✓' : ''}</span>
                        </div>
                        <span className="text-xs mt-1 text-amber-100">
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-4">
                    <div className="font-semibold text-amber-200 mb-2">
                      Order Items
                    </div>
                    <ul className="space-y-2">
                      {order.items.map((item: any) => (
                        <li
                          key={item.menuItemId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${item.name.toLowerCase().includes('salmon') ? 'bg-red-500' : 'bg-green-500'}`}
                            ></span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold text-amber-100">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="mt-3 text-amber-400 font-semibold text-sm underline hover:text-amber-300 transition"
                    >
                      {expandedOrderId === order.id
                        ? 'Hide Full Order'
                        : 'View Full Order →'}
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2 text-amber-200">
                      <span className="bg-amber-900/40 rounded px-2 py-1 text-xs flex items-center gap-1">
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <rect
                            x="3"
                            y="7"
                            width="18"
                            height="10"
                            rx="2"
                            fill="#FFD580"
                          />
                        </svg>
                        Table #{order.tableNumber || '-'}
                      </span>
                    </div>
                    {/* Contact Staff button removed */}
                  </div>

                  {/* Expanded Full Order Details */}
                  {expandedOrderId === order.id && (
                    <div className="mt-6 p-4 rounded-xl bg-[#183828]/90 border border-amber-900 text-amber-100 shadow-inner">
                      <div className="mb-2">
                        <span className="font-bold text-lg">Order Details</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Customer:</span>{' '}
                        {order.customerName}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Table:</span>{' '}
                        {order.tableNumber}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Order ID:</span>{' '}
                        {order.id}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Created:</span>{' '}
                        {formatDate(order.createdAt)}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Status:</span>{' '}
                        {order.status}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Payment Status:</span>{' '}
                        {order.paymentStatus}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Payment Method:</span>{' '}
                        {order.paymentMethod || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Total Amount:</span> ₹
                        {order.totalAmount.toFixed(2)}
                      </div>
                      {order.notes && (
                        <div className="mb-2">
                          <span className="font-semibold">Notes:</span>{' '}
                          {order.notes}
                        </div>
                      )}
                      {/* Payment actions (keep as before) */}
                      <div className="mt-4 flex gap-2">
                        {order.paymentStatus !== 'paid' && (
                          <>
                            <button
                              className="px-4 py-2 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
                              onClick={() =>
                                handlePaymentProcess(order.id, 'online')
                              }
                            >
                              Pay Online
                            </button>
                            <button
                              className="px-4 py-2 rounded-full bg-gray-200 text-amber-700 font-semibold hover:bg-amber-100 transition"
                              onClick={() =>
                                handlePaymentProcess(order.id, 'cash')
                              }
                            >
                              Mark as Cash
                            </button>
                          </>
                        )}
                        {order.paymentStatus === 'paid' && (
                          <span className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold">
                            Paid
                          </span>
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
