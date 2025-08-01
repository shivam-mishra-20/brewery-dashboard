'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function TableRedirect() {
  const searchParams = useSearchParams()
  const tabledata = searchParams?.get('tabledata')
  const router = useRouter()

  useEffect(() => {
    if (tabledata) {
      // Redirect to the QR verification page with the table data
      router.push(`/qr-verification?tabledata=${tabledata}`)
    } else {
      // If no table data is provided, redirect to the home page or customer landing page
      router.push('/customer')
    }
  }, [router, tabledata])

  // Loading state while redirect happens
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin mb-6"></div>
      <p className="text-gray-600">Redirecting to menu...</p>
    </div>
  )
}
