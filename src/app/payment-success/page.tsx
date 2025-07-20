'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiCheck, FiClock, FiRefreshCw } from 'react-icons/fi'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  // Get orderId and tabledata from URL params
  const orderId = searchParams.get('orderId')
  const tabledata = searchParams.get('tabledata') || ''

  // Redirect to orders page after countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push(`/orders?tabledata=${encodeURIComponent(tabledata || '')}`)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router, tabledata])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck className="text-green-600 text-4xl" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your order has been placed successfully.
          {orderId && (
            <span className="block text-sm mt-2">Order ID: {orderId}</span>
          )}
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-6 flex items-center">
          <FiClock className="text-amber-500 mr-3 text-xl" />
          <div className="text-left">
            <h3 className="font-medium text-gray-800">Order Status</h3>
            <p className="text-sm text-gray-600">
              You can check your order status on the next page.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={`/orders?tabledata=${encodeURIComponent(tabledata || '')}`}
            className="px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white font-bold rounded-xl shadow hover:shadow-lg transition-all w-full sm:w-auto text-center"
          >
            View Order Status
          </Link>

          <Link
            href={`/menu?tabledata=${encodeURIComponent(tabledata || '')}`}
            className="px-6 py-3 bg-white text-primary font-bold border border-primary/30 rounded-xl hover:bg-primary/10 transition-all w-full sm:w-auto text-center"
          >
            Back to Menu
          </Link>
        </div>

        <div className="mt-8 text-gray-500 text-sm flex items-center justify-center gap-2">
          <FiRefreshCw className="animate-spin" />
          Redirecting in {countdown} seconds...
        </div>
      </div>
    </div>
  )
}
