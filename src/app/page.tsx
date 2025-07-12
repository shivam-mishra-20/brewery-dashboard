'use client'

import CryptoJS from 'crypto-js'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

interface TableData {
  name: string
  number: number
  capacity: number
  status: string
  location?: string
  _id?: string
  timestamp?: number
  [key: string]: any // For any other properties
}
const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'your-very-secret-key'

function MenuContent() {
  const searchParams = useSearchParams()
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get table data from URL
    const tableDataParam = searchParams.get('tabledata')

    if (tableDataParam) {
      try {
        // Decrypt and parse the table data
        const decrypted = CryptoJS.AES.decrypt(
          decodeURIComponent(tableDataParam),
          QR_SECRET,
        ).toString(CryptoJS.enc.Utf8)
        const decodedData = JSON.parse(decrypted)
        setTableData(decodedData)
      } catch (err) {
        console.error('Error parsing table data:', err)
        setError('Invalid table data in QR code')
      }
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-500">Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>
      <div className="bg-yellow-100 p-4 rounded-lg mb-6">
        <p className="font-semibold">You are at:</p>
        <p className="text-lg">
          {tableData.name} - Table #{tableData.number}
        </p>
        {tableData.location && (
          <p className="text-sm text-gray-600">
            Location: {tableData.location}
          </p>
        )}
        <p className="text-sm">Capacity: {tableData.capacity} people</p>
      </div>

      {/* Your menu items will go here */}
      <div>{/* Menu content */}</div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <h1 className="text-xl font-bold">Loading...</h1>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  )
}
