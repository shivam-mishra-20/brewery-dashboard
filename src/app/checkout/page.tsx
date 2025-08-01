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
  const tableDataParam = searchParams?.get('tabledata')
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
      <div className="min-h-screen bg-[#0B3D2E] bg-[url('/bg-image.png')] bg-cover bg-center bg-no-repeat bg-fixed pt-8 pb-32 px-2 sm:px-0 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#23272F]/90 rounded-2xl shadow-2xl p-8 text-center border border-[#FFC600]/30">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center justify-center w-28 h-28 rounded-full bg-[#FFC600]/20">
              <FiCheckCircle className="w-16 h-16 text-[#10B981]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4 font-serif">
            Order Successful!
          </h2>
          <p className="text-[#FFC600] mb-6 font-medium">
            Your order #{orderId.slice(-6)} has been placed successfully and is
            being processed.
          </p>
          <p className="text-sm text-gray-300 mb-8 font-serif">
            {paymentMethod === 'online'
              ? 'Your payment has been processed successfully.'
              : 'Please pay at the counter when your order is ready.'}
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/menu"
              className="px-6 py-3 bg-gradient-to-r from-[#FFC600] to-[#FFD700] text-[#23272F] rounded-xl font-bold shadow hover:from-[#FFD700] hover:to-[#FFC600] transition-colors border border-[#FFC600]/30 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
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
      <div className="max-w-xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            href="/cart"
            className="mr-4 p-2 hover:bg-[#FFC600]/20 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-[#FFC600]" />
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFC600] to-[#FFD700] tracking-tight font-serif">
            Checkout
          </h1>
        </div>

        {/* Customer Information */}
        <div className="bg-[#23272F]/90 rounded-xl shadow-lg p-6 mb-4 border border-[#FFC600]/20">
          <h2 className="text-lg font-semibold text-[#FFC600] mb-4 font-serif">
            Customer Information
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#FFD700] mb-1 font-serif"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#FFC600]/30 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#FFC600]/50 font-serif"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#FFD700] mb-1 font-serif"
              >
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#FFC600]/30 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#FFC600]/50 font-serif"
                placeholder="Your phone number"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#23272F]/90 rounded-xl shadow-lg p-6 mb-4 border border-[#FFC600]/20">
          <h2 className="text-lg font-semibold text-[#FFC600] mb-4 font-serif">
            Order Summary
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between pb-3 border-b border-[#FFC600]/20 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative rounded overflow-hidden bg-[#FFC600]/10">
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
                    <p className="font-medium text-white font-serif">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#FFC600] font-serif">
                      Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                    </p>
                    {item.addOns && item.addOns.length > 0 && (
                      <p className="text-xs text-[#FFD700] italic font-serif">
                        With: {item.addOns.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-[#FFC600] font-serif">
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
          <div className="mt-4 pt-3 border-t border-[#FFC600]/20">
            <div className="flex items-center justify-between font-bold text-[#FFD700] font-serif">
              <span>Total Amount:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-[#23272F]/90 rounded-xl shadow-lg p-6 mb-6 border border-[#FFC600]/20">
          <h2 className="text-lg font-semibold text-[#FFC600] mb-4 font-serif">
            Payment Method
          </h2>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-[#FFC600]/20 rounded-lg cursor-pointer hover:bg-[#FFC600]/10 transition-colors font-serif">
              <input
                type="radio"
                name="payment"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
                className="mr-3 accent-[#FFC600]"
              />
              <FiCreditCard className="mr-2 text-[#FFC600]" />
              <span className="text-white">Pay Online (Razorpay)</span>
            </label>
            <label className="flex items-center p-3 border border-[#FFC600]/20 rounded-lg cursor-pointer hover:bg-[#FFC600]/10 transition-colors font-serif">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="mr-3 accent-[#FFC600]"
              />
              <FiDollarSign className="mr-2 text-[#FFC600]" />
              <span className="text-white">Pay at Counter (Cash)</span>
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg font-serif">
            {error}
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#FFC600] to-[#FFD700] text-[#23272F] font-bold shadow hover:from-[#FFD700] hover:to-[#FFC600] transition-colors border border-[#FFC600]/30 flex items-center justify-center gap-2 font-serif text-lg"
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
