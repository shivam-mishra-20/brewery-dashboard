'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiShoppingBag,
} from 'react-icons/fi'
import { useCart } from '@/context/CartContext'
import { PaymentDetails, processPayment } from '@/services/paymentService'

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>(
    'online',
  )
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableInfo, setTableInfo] = useState<{
    tableId: string
    tableName: string
    tableNumber: string
  } | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [error, setError] = useState('')

  // Calculate total amount
  const total = cart.reduce(
    (sum, item) =>
      sum +
      (item.price * item.quantity +
        (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) * item.quantity),
    0,
  )

  // Get table info from session storage or URL
  useEffect(() => {
    if (tableDataParam) {
      // Import dynamically to avoid server-side issues
      import('@/lib/table').then(({ getTableDataFromUrl }) => {
        try {
          const tableData = getTableDataFromUrl(window.location.href)
          if (tableData) {
            setTableInfo(tableData)
          } else {
            // If decryption fails, redirect to verification page
            router.push(
              `/qr-verification?tabledata=${encodeURIComponent(tableDataParam)}`,
            )
          }
        } catch (error) {
          console.error('Error processing table data:', error)
          // Redirect to verification page on error
          router.push(
            `/qr-verification?tabledata=${encodeURIComponent(tableDataParam)}`,
          )
        }
      })
    } else {
      // Check if we have table info in session storage
      const storedTableInfo = sessionStorage.getItem('tableInfo')
      if (storedTableInfo) {
        setTableInfo(JSON.parse(storedTableInfo))
      } else {
        // No table info, redirect to menu
        router.push('/menu')
      }
    }
  }, [tableDataParam, router])

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      router.push('/menu')
    }
  }, [cart.length, router, orderSuccess])

  const handlePayment = async () => {
    // Validate customer name
    if (!customerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (tableInfo) {
      setLoading(true)
      setError('')

      try {
        // Prepare payment details
        const paymentDetails: PaymentDetails = {
          customerName: customerName,
          customerPhone: customerPhone || undefined,
          orderId: '', // This will be assigned by the server
          tableId: tableInfo.tableId,
          tableNumber: tableInfo.tableNumber,
          tableName: tableInfo.tableName,
          amount: total,
          currency: 'INR',
          paymentMethod: paymentMethod,
        }

        // Process payment
        const result = await processPayment(paymentDetails, cart)

        if (result.success) {
          setOrderId(result.orderId || '')
          setOrderSuccess(true)
          clearCart()
        } else {
          setError(result.error || 'Payment processing failed')
        }
      } catch (error: any) {
        setError(error.message || 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    } else {
      setError('Table information not available')
    }
  }

  // If payment is successful, show success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 pt-8 pb-32 px-2 sm:px-0 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center justify-center w-32 h-32">
              <FiCheckCircle className="w-20 h-20 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Order Successful!
          </h2>
          <p className="text-gray-600 mb-8">
            Your order #{orderId.slice(-6)} has been placed successfully and is
            being processed.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            {paymentMethod === 'online'
              ? 'Your payment has been processed successfully.'
              : 'Please pay at the counter when your order is ready.'}
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/menu"
              className="px-6 py-3 bg-primary/90 text-gray-900 rounded-xl font-bold shadow hover:bg-primary transition-colors border border-primary/30 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 pt-8 pb-32 px-2 sm:px-0">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            href="/cart"
            className="mr-4 p-2 hover:bg-amber-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-amber-900" />
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary tracking-tight">
            Checkout
          </h1>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-4 border border-amber-100">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">
            Customer Information
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-amber-800 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-amber-800 mb-1"
              >
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your phone number"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-4 border border-amber-100">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between pb-3 border-b border-amber-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative rounded overflow-hidden bg-amber-50">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">{item.name}</p>
                    <p className="text-xs text-amber-700">
                      Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                    </p>
                    {item.addOns && item.addOns.length > 0 && (
                      <p className="text-xs text-amber-600 italic">
                        With: {item.addOns.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-amber-800">
                  ₹
                  {(
                    item.price * item.quantity +
                    (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) *
                      item.quantity
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span>Total Amount:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-amber-100">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">
            Payment Method
          </h2>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="radio"
                name="payment"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
                className="mr-3"
              />
              <FiCreditCard className="mr-2 text-amber-700" />
              <span>Pay Online (Razorpay)</span>
            </label>
            <label className="flex items-center p-3 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="mr-3"
              />
              <FiDollarSign className="mr-2 text-amber-700" />
              <span>Pay at Counter (Cash)</span>
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-secondary to-primary text-white font-bold shadow hover:from-primary hover:to-secondary transition-colors border border-secondary/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>Processing...</>
          ) : (
            <>
              <FiShoppingBag />
              Place Order{' '}
              {paymentMethod === 'online' ? '& Pay Now' : '(Pay Later)'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
