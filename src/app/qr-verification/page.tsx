'use client'

import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { decryptTableData } from '@/utils/tableEncryption'

interface TableInfo {
  id: string
  name: string
  number: string
  status: string
}

export default function QrCodeVerification() {
  const searchParams = useSearchParams()
  const encryptedTableDataRaw = searchParams.get('tabledata')
  const encryptedTableData = encryptedTableDataRaw
    ? decodeURIComponent(encryptedTableDataRaw)
    : null
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [redirecting, setRedirecting] = useState(false)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    let isMounted = true
    const processTableData = async () => {
      if (!encryptedTableData) {
        setError(
          'No table data provided. Please scan the QR code on your table.',
        )
        setLoading(false)
        return
      }

      try {
        // Debug: log the encryptedTableData
        console.log('Encrypted tabledata param:', encryptedTableData)
        // Decrypt the table data
        const tableData = decryptTableData(encryptedTableData)
        // Debug: log the decrypted tableData
        console.log('Decrypted tableData:', tableData)

        if (!tableData || !tableData.tableId) {
          setError(
            'Invalid table information. Please try scanning the QR code again.',
          )
          setLoading(false)
          return
        }

        // Verify the table exists in our system
        const response = await axios.get(`/api/tables/${tableData.tableId}`)

        if (response.data && response.data.table) {
          const table = response.data.table

          setTableInfo({
            id: table._id,
            name: table.name,
            number: table.number,
            status: table.status,
          })

          // Store table info in session storage for use across the ordering flow
          sessionStorage.setItem(
            'tableInfo',
            JSON.stringify({
              id: table._id,
              name: table.name,
              number: table.number,
            }),
          )

          // If table is not occupied, mark it as occupied
          if (table.status !== 'occupied') {
            await axios.put(`/api/tables/${tableData.tableId}`, {
              status: 'occupied',
            })
          }

          // Start countdown for automatic redirect
          setRedirecting(true)
          let timeLeft = 5
          countdownRef.current = setInterval(() => {
            timeLeft -= 1
            setCountdown(timeLeft)

            if (timeLeft <= 0) {
              if (countdownRef.current) clearInterval(countdownRef.current)
              if (isMounted) {
                // Preserve the original encrypted table data in the URL
                router.push(
                  `/menu?tabledata=${encodeURIComponent(encryptedTableDataRaw || '')}`,
                )
              }
            }
          }, 1000)
        }
      } catch (err) {
        console.error('Error processing table data:', err)
        setError(
          'Failed to verify table information. Please try again or ask for assistance.',
        )
      } finally {
        setLoading(false)
      }
    }

    processTableData()
    return () => {
      isMounted = false
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [router, encryptedTableData])

  const handleContinue = () => {
    // Preserve the original encrypted table data in the URL
    router.push(
      `/menu?tabledata=${encodeURIComponent(encryptedTableDataRaw || '')}`,
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-t-4 border-yellow-600 border-solid rounded-full animate-spin mb-6"></div>
        <p className="text-gray-600">Verifying table information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Unable to Access Menu
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <span className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium">
              Go to Homepage
            </span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center justify-center p-4">
      <motion.div
        className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <FiCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Table Verified!
        </h1>

        <div className="bg-yellow-50 rounded-lg p-6 mb-8 mt-4">
          <p className="text-gray-600 mb-2">You are seated at:</p>
          <h2 className="text-2xl font-semibold text-yellow-600">
            Table {tableInfo?.number}
          </h2>
          <p className="text-yellow-500 text-sm mt-1">{tableInfo?.name}</p>
        </div>

        <p className="text-gray-600 mb-8">
          Welcome to our café! You can now browse our menu and place your order
          directly from your device.
        </p>

        {redirecting ? (
          <div className="text-gray-600 mb-3">
            Redirecting to menu in {countdown} seconds...
          </div>
        ) : null}

        <motion.button
          className="w-full py-4 bg-yellow-600 text-white rounded-lg font-medium text-lg shadow-md"
          whileHover={{ scale: 1.02, backgroundColor: '#ca8a04 ' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
        >
          Browse Menu
        </motion.button>
      </motion.div>
    </div>
  )
}
