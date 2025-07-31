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
      <div
        className="bg-[#23272F]/90 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-[#FFC600]/30"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-[#FFC600]/80 to-[#FFD700]/60 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#FFC600] shadow-lg">
          <FiCheck className="text-[#10B981] text-4xl" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 font-serif">
          Payment Successful!
        </h1>
        <p className="text-[#FFC600] mb-6 font-serif">
          Your order has been placed successfully.
          {orderId && (
            <span className="block text-sm mt-2 text-[#FFD700]">
              Order ID: {orderId}
            </span>
          )}
        </p>

        <div className="bg-[#23272F]/80 rounded-lg p-4 mb-6 flex items-center border border-[#FFC600]/20">
          <FiClock className="text-[#FFC600] mr-3 text-xl" />
          <div className="text-left">
            <h3 className="font-medium text-white font-serif">Order Status</h3>
            <p className="text-sm text-[#FFD700] font-serif">
              You can check your order status on the next page.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={`/orders?tabledata=${encodeURIComponent(tabledata || '')}`}
            className="px-6 py-3 bg-gradient-to-r from-[#FFC600] to-[#FFD700] text-[#23272F] font-bold rounded-xl shadow hover:from-[#FFD700] hover:to-[#FFC600] transition-all w-full sm:w-auto text-center font-serif"
          >
            View Order Status
          </Link>

          <Link
            href={`/menu?tabledata=${encodeURIComponent(tabledata || '')}`}
            className="px-6 py-3 bg-[#23272F] text-[#FFC600] font-bold border border-[#FFC600]/30 rounded-xl hover:bg-[#FFC600]/10 transition-all w-full sm:w-auto text-center font-serif"
          >
            Back to Menu
          </Link>
        </div>

        <div className="mt-8 text-[#FFD700] text-sm flex items-center justify-center gap-2 font-serif">
          <FiRefreshCw className="animate-spin" />
          Redirecting in {countdown} seconds...
        </div>
      </div>
    </div>
  )
}
