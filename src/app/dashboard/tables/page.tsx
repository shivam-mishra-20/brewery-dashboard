'use client'

import { ConfigProvider, Select } from 'antd'
import CryptoJS from 'crypto-js'
import {
  getDownloadURL,
  ref as storageRef,
  uploadString,
} from 'firebase/storage'
import { AnimatePresence, motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import Image from 'next/image'
import QRCode from 'qrcode'
import React, { useEffect, useState } from 'react'
import { FaEdit, FaPlus, FaQrcode, FaTrash } from 'react-icons/fa'
import { MdTableRestaurant } from 'react-icons/md'
import { TbLoader3 } from 'react-icons/tb'
import TableOccupancy from '@/components/TableOccupancy'
import TableStats from '@/components/TableStats'
import { storage } from '@/lib/firebase'

// Types
interface Table {
  _id: string
  name: string
  number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  qrCode?: string
  location?: string
  createdAt?: Date
  updatedAt?: Date
}

interface FormData {
  name: string
  number: string
  capacity: string
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  location: string
}

const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'your-very-secret-key'
export default function TablesPage() {
  // Reference for fancy QR code rendering - not directly used in this implementation

  // No theme context, always light mode
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null)
  const [qrTable, setQrTable] = useState<Table | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    number: '',
    capacity: '',
    status: 'available',
    location: '',
  })

  const statusColors = {
    available: 'bg-[#04B851] text-white', // brand green
    occupied: 'bg-[#EB5757] text-white', // error
    reserved: 'bg-[#2ECC71] text-white', // success
    maintenance: 'bg-[#e6f9f0] text-[#039f45]', // primary light
  }

  // Fetch tables
  const fetchTables = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tables')
      if (!res.ok) throw new Error('Failed to fetch tables')

      const data = await res.json()
      setTables(data.tables || [])
      setError('')
    } catch (err) {
      console.error('Error fetching tables:', err)
      setError('Failed to load tables. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Open modal for creating a new table
  const openCreateModal = () => {
    setFormData({
      name: '',
      number: '',
      capacity: '',
      status: 'available',
      location: '',
    })
    setEditingTable(null)
    setIsModalOpen(true)
  }

  // Open modal for editing a table
  const openEditModal = (table: Table) => {
    setFormData({
      name: table.name,
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      status: table.status,
      location: table.location || '',
    })
    setEditingTable(table)
    setIsModalOpen(true)
  }

  // Open modal for deleting a table
  const openDeleteModal = (tableId: string) => {
    setDeleteTableId(tableId)
    setIsDeleteModalOpen(true)
  }

  // Open QR code modal
  const openQRModal = (table: Table) => {
    setQrTable(table)
    setIsQRModalOpen(true)
  }

  // Submit form for creating/editing a table
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const tableData: any = {
        name: formData.name,
        number: parseInt(formData.number),
        capacity: parseInt(formData.capacity),
        status: formData.status,
        location: formData.location || undefined,
      }

      let res

      if (editingTable) {
        // Edit existing table
        res = await fetch(`/api/tables/${editingTable._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tableData),
        })
      } else {
        // Create new table with QR code
        setLoading(true)

        try {
          // First create the table to get a valid ID
          res = await fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tableData),
          })

          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Failed to save table')
          }

          // Get the created table with its ID
          const savedTableData = await res.json()
          const tableId = savedTableData.table._id

          if (!tableId) {
            throw new Error('Failed to get table ID after creation')
          }

          // Now prepare QR code with the valid table ID
          const qrPayload = {
            tableId: tableId,
            tableName: tableData.name,
            tableNumber: tableData.number.toString(),
            timestamp: new Date().getTime(),
          }

          const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(qrPayload),
            QR_SECRET,
          ).toString()
          const qrString = encodeURIComponent(encrypted)
          // Direct to qr-verification instead of menu to ensure proper verification
          const qrLink = `${window.location.origin}/qr-verification?tabledata=${qrString}`

          // Create a hidden QR code element with fancy styling
          const qrElement = document.createElement('div')
          qrElement.style.padding = '24px'
          qrElement.style.background = '#ffffff'
          qrElement.style.width = '400px'
          qrElement.style.borderRadius = '16px'
          qrElement.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.1)'
          qrElement.style.textAlign = 'center'
          qrElement.style.fontFamily = 'Inter, sans-serif'

          // Create header with cafe name
          const header = document.createElement('div')
          header.style.marginBottom = '12px'
          header.innerHTML = `
          <div style="font-weight: 700; font-size: 22px; color: #000; margin-bottom: 4px;">Work Brew Cafe</div>
          <div style="font-weight: 600; font-size: 16px; color: #4b5563;">${tableData.name}</div>
        `
          qrElement.appendChild(header)

          // Create QR container with styling
          const qrContainer = document.createElement('div')
          qrContainer.style.padding = '12px'
          qrContainer.style.backgroundColor = 'white'
          qrContainer.style.borderRadius = '12px'
          qrContainer.style.margin = '0 auto'
          qrContainer.style.width = '240px'
          qrContainer.style.height = '240px'
          qrContainer.style.display = 'flex'
          qrContainer.style.alignItems = 'center'
          qrContainer.style.justifyContent = 'center'
          qrContainer.style.border = '1px solid #ffc30033'
          qrContainer.style.boxShadow = '0 4px 12px #ffc30022'

          // Add QR code element to container
          const qrCode = document.createElement('div')
          qrContainer.appendChild(qrCode)
          qrElement.appendChild(qrContainer)

          // Add table info
          const tableInfo = document.createElement('div')
          tableInfo.style.marginTop = '12px'
          tableInfo.innerHTML = `
          <div style="font-weight: 600; font-size: 15px; color: #1f2937; margin-bottom: 4px;">Table #${tableData.number}</div>
          <div style="font-size: 13px; color: #6b7280;">Capacity: ${tableData.capacity} people</div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 12px;">Scan to view menu</div>
        `
          qrElement.appendChild(tableInfo)

          document.body.appendChild(qrElement)

          // Render QR code in the container
          const qrRendered = document.createElement('div')
          // Use qrcode library to generate SVG markup
          const qrSvgMarkup = await QRCode.toString(qrLink, {
            type: 'svg',
            width: 220,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#1e293b',
              light: '#ffffff',
            },
          })
          qrRendered.innerHTML = qrSvgMarkup
          qrCode.appendChild(qrRendered.firstChild!)

          // Capture the QR element as an image
          try {
            const canvas = await html2canvas(qrElement, {
              backgroundColor: '#ffffff',
              scale: 2, // Higher resolution
            })
            document.body.removeChild(qrElement)

            // Get the PNG data URL
            const qrDataUrl = canvas.toDataURL('image/png')

            // Upload QR image to Firebase Storage
            const fileName = `table-qr-${tableData.number}-${Date.now()}.png`
            const firebaseRef = storageRef(storage, `tableQRCodes/${fileName}`)
            await uploadString(firebaseRef, qrDataUrl, 'data_url')
            const qrImageUrl = await getDownloadURL(firebaseRef)

            // Update the table with the QR code URL
            const updateRes = await fetch(`/api/tables/${tableId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrCode: qrImageUrl }),
            })

            if (!updateRes.ok) {
              throw new Error('Failed to update table with QR code')
            }

            // Return the update response as our final result
            res = updateRes
          } catch (err) {
            console.error('Error generating fancy QR:', err)
            // Fallback to simple QR code if fancy one fails
            try {
              const qrDataUrl = await QRCode.toDataURL(qrLink, { width: 400 })

              // Upload QR image to Firebase Storage
              const fileName = `table-qr-${tableData.number}-${Date.now()}.png`
              const firebaseRef = storageRef(
                storage,
                `tableQRCodes/${fileName}`,
              )
              await uploadString(firebaseRef, qrDataUrl, 'data_url')
              const qrImageUrl = await getDownloadURL(firebaseRef)

              // Update the table with the QR code URL
              const updateRes = await fetch(`/api/tables/${tableId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrCode: qrImageUrl }),
              })

              if (!updateRes.ok) {
                throw new Error('Failed to update table with QR code')
              }

              // Return the update response as our final result
              res = updateRes
            } catch (innerErr) {
              console.error('Fallback QR generation failed:', innerErr)
              throw new Error(
                'Failed to generate QR code after multiple attempts',
              )
            }
          } finally {
            setLoading(false)
          }
        } catch (err) {
          console.error('Error in table creation process:', err)
          throw err
        }
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save table')
      }

      // Refresh tables list
      fetchTables()
      setIsModalOpen(false)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save table'
      setError(errorMessage)
      console.error('Error saving table:', err)
    }
  }

  // Delete a table
  const handleDelete = async () => {
    if (!deleteTableId) return

    try {
      const res = await fetch(`/api/tables/${deleteTableId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete table')

      // Refresh tables list
      fetchTables()
      setIsDeleteModalOpen(false)
    } catch (err) {
      console.error('Error deleting table:', err)
      setError('Failed to delete table')
    }
  }

  // Save QR code data
  // const saveQRCode = async () => {
  //   if (!qrTable) return

  //   try {
  //     // Generate a unique identifier for this table's QR code
  //     const qrData = JSON.stringify({
  //       tableId: qrTable._id,
  //       tableNumber: qrTable.number,
  //       timestamp: new Date().getTime(),
  //     })

  //     const res = await fetch(`/api/tables/${qrTable._id}/qr`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ qrCode: qrData }),
  //     })

  //     if (!res.ok) throw new Error('Failed to save QR code')

  //     // Refresh tables list
  //     fetchTables()
  //     setIsQRModalOpen(false)
  //   } catch (err) {
  //     console.error('Error saving QR code:', err)
  //     setError('Failed to save QR code')
  //   }
  // }

  // Update table status
  const updateTableStatus = async (tableId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update table status')

      // Refresh tables list
      fetchTables()
    } catch (err) {
      console.error('Error updating table status:', err)
      setError('Failed to update table status')
    }
  }

  // Filter tables by status and search query
  const filteredTables = tables.filter((table) => {
    // Filter by status
    const matchesStatus =
      filterStatus === 'all' || table.status === filterStatus

    // Filter by search query
    const matchesSearch =
      searchQuery === '' ||
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.number.toString().includes(searchQuery) ||
      (table.location &&
        table.location.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesStatus && matchesSearch
  })

  // Uniform button class for all buttons
  const uniformButtonClass =
    'uniform-btn text-white flex-nowrap whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm bg-gradient-to-tr from-[#04B851] to-[#039f45] shadow-[#e6f9f0]/[.4] border border-[#04B851]/[0.1] shadow-inner py-2 rounded-2xl px-3 sm:px-5'
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#04B851',
          colorPrimaryHover: '#039f45',
          colorBorder: '#E0E0E0',
          colorBgContainer: '#FFFFFF',
          borderRadius: 12,
          controlHeight: 40,
          fontFamily: 'Inter, inter, sans-serif',
        },
        components: {
          Select: {
            borderRadius: 12,
            controlHeight: 40,
            fontSize: 15,
            colorPrimary: '#04B851',
            colorPrimaryHover: '#039f45',
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E0E0E0',
            colorText: '#1A1A1A',
            colorTextPlaceholder: '#4D4D4D',
            fontFamily: 'Inter, inter, sans-serif',
          },
        },
      }}
    >
      <style>{`
        .ant-select,
        .ant-select-selector,
        .ant-select-selection-item,
        .ant-select-dropdown,
        .ant-select-item-option-content {
          font-family: 'Inter', inter, sans-serif !important;
        }
      `}</style>
      <div className="flex flex-col gap-6 h-[85vh] w-full justify-start items-start px-2 sm:px-4 md:px-6 lg:px-8 pb-3 md:pb-5 rounded-2xl bg-[#F9FAFB] overflow-y-auto custom-scrollbar relative">
        {/* Header - bento style */}
        <div className="z-20 w-full bg-[#F9FAFB] py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center tracking-tight text-[#04B851]">
                <MdTableRestaurant className="mr-2 text-[#04B851] text-2xl sm:text-3xl" />
                <span className="hidden sm:inline">Tables Management</span>
                <span className="sm:hidden">Tables</span>
              </h1>
              <p className="text-[#4D4D4D] mt-1 text-sm sm:text-base hidden sm:block">
                Manage your café tables, QR codes, and table status
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 pl-8 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-sm focus:ring-2 ring-[#04B851] w-full sm:w-auto shadow-sm"
                  />
                  <div className="absolute left-2.5 top-2.5 text-[#04B851]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                    </svg>
                  </div>
                </div>
                <Select
                  value={filterStatus}
                  onChange={(value) => setFilterStatus(value)}
                  style={{ minWidth: 140, borderRadius: 12 }}
                  options={[
                    { value: 'all', label: 'All Tables' },
                    { value: 'available', label: 'Available' },
                    { value: 'occupied', label: 'Occupied' },
                    { value: 'reserved', label: 'Reserved' },
                    { value: 'maintenance', label: 'Maintenance' },
                  ]}
                  size="large"
                  className="rounded-xl shadow-sm !h-10 w-full sm:w-auto border-[#E0E0E0] bg-[#FFFFFF] text-[#1A1A1A]"
                />
              </div>
              <button
                onClick={openCreateModal}
                className={`${uniformButtonClass} w-full sm:w-auto justify-center`}
              >
                <FaPlus size={14} />
                <span>Add Table</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {/* Error Message */}
          {error && (
            <div className="bg-[#e6f9f0] border border-[#EB5757] text-[#EB5757] p-3 rounded-xl font-medium shadow-sm">
              {error}
            </div>
          )}

          {/* Table Stats */}
          {!loading && <TableStats tables={tables} />}

          {/* View Options */}
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
            {/* Floor Plan (Left side) */}
            {/* <div className="w-full order-2 xl:order-1">
              {!loading && (
                <TableFloorPlan
                  tables={tables}
                  onTableClick={(table) => openEditModal(table)}
                />
              )}
            </div> */}
            {/* Occupancy Chart (Right side) */}
            <div className="w-full ">
              <TableOccupancy timeRange="weekly" />
            </div>
          </div>

          {/* Tables Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <TbLoader3 className="animate-spin text-[#04B851]" size={40} />
            </div>
          ) : filteredTables.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence>
                {filteredTables.map((table) => (
                  <motion.div
                    key={table._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="border border-[#E0E0E0] bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 shadow-inner hover:shadow-lg transition-shadow duration-200 relative overflow-hidden flex flex-col gap-2"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 overflow-hidden">
                      <div
                        className={`${statusColors[table.status]} rotate-45 transform origin-bottom-right w-[141%] h-12 sm:h-16 flex items-center justify-center shadow-md`}
                      >
                        <span className="text-xs font-bold rotate-45 transform origin-center translate-x-3 sm:translate-x-4 translate-y-1.5 sm:translate-y-2">
                          {table.status.substring(0, 4)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start mb-2 pr-8 sm:pr-12">
                      <h3 className="font-bold text-base sm:text-lg text-[#1A1A1A]">
                        {table.name}-
                        <span className="text-[#4D4D4D] ml-1 font-normal text-sm sm:text-base">
                          #{table.number}
                        </span>
                      </h3>
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex items-center text-sm">
                        <span className="text-[#4D4D4D] w-20 sm:w-24">
                          Capacity:
                        </span>
                        <span>{table.capacity} people</span>
                      </div>
                      {table.location && (
                        <div className="flex items-center text-sm">
                          <span className="text-[#4D4D4D] w-20 sm:w-24">
                            Location:
                          </span>
                          <span className="truncate">{table.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <span className="text-[#4D4D4D] w-20 sm:w-24">
                          QR Code:
                        </span>
                        <span>
                          {table.qrCode ? 'Generated' : 'Not generated'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-3 sm:gap-2">
                      <div className="flex gap-2 justify-center sm:justify-start">
                        <button
                          onClick={() => openEditModal(table)}
                          className="p-2 bg-[#e6f9f0] hover:bg-[#039f45] rounded-xl transition-colors duration-200 border border-[#E0E0E0]"
                          title="Edit Table"
                        >
                          <FaEdit className="text-gray-600" size={16} />
                        </button>
                        <button
                          onClick={() => openQRModal(table)}
                          className="p-2 bg-[#e6f9f0] hover:bg-[#039f45] rounded-xl transition-colors duration-200 border border-[#E0E0E0]"
                          title="Show QR Code"
                        >
                          <FaQrcode className="text-gray-600" size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(table._id)}
                          className="p-2 bg-[#e6f9f0] hover:shadow-[#e6f9f0]/[0.5] hover:shadow-inner hover:bg-[#EB5757]/[0.1] rounded-xl transition-colors duration-200 border border-[#E0E0E0]"
                          title="Delete Table"
                        >
                          <FaTrash className="text-red-500" size={16} />
                        </button>
                      </div>
                      {/* Status Update Dropdown */}
                      <Select
                        value={table.status}
                        onChange={(value) =>
                          updateTableStatus(table._id, value)
                        }
                        style={{ minWidth: 120, borderRadius: 12 }}
                        options={[
                          { value: 'available', label: 'Available' },
                          { value: 'occupied', label: 'Occupied' },
                          { value: 'reserved', label: 'Reserved' },
                          { value: 'maintenance', label: 'Maintenance' },
                        ]}
                        size="large"
                        className="rounded-xl shadow-sm !h-10 w-full sm:w-auto border-[#E0E0E0] bg-[#FFFFFF] text-[#1A1A1A]"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-2xl p-10 text-center shadow-inner">
              <div className="flex flex-col items-center gap-3">
                <MdTableRestaurant className="text-[#04B851]" size={48} />
                <h3 className="text-xl font-semibold text-[#1A1A1A]">
                  No tables found
                </h3>
                <p className="text-[#4D4D4D] max-w-md mx-auto">
                  {filterStatus === 'all'
                    ? "You haven't added any tables yet. Click the 'Add Table' button to create your first table."
                    : `No tables with status '${filterStatus}' found. Try changing the filter or add a new table.`}
                </p>
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="mt-2 text-[#04B851] hover:text-[#039f45] font-semibold transition-colors duration-200"
                  >
                    Show all tables
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-5 sm:p-7 space-y-5">
                <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 text-[#04B851]">
                  <MdTableRestaurant className="text-[#04B851] text-xl sm:text-2xl" />
                  <span className="hidden sm:inline">
                    {editingTable ? 'Edit Table' : 'Add New Table'}
                  </span>
                  <span className="sm:hidden">
                    {editingTable ? 'Edit' : 'Add'}
                  </span>
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                        Table Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Window Table"
                        required
                        className="w-full p-2 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] focus:ring-2 ring-[#04B851] shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                        Table Number
                      </label>
                      <input
                        type="number"
                        id="number"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        placeholder="e.g. 1"
                        required
                        className="w-full p-2 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] focus:ring-2 ring-[#04B851] shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        placeholder="e.g. 4"
                        required
                        className="w-full p-2 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] focus:ring-2 ring-[#04B851] shadow-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Near Window, First Floor"
                        className="w-full p-2 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] focus:ring-2 ring-[#04B851] shadow-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">
                        Status
                      </label>
                      <Select
                        id="status"
                        value={formData.status}
                        onChange={(value) =>
                          handleChange({
                            target: { name: 'status', value },
                          } as React.ChangeEvent<HTMLSelectElement>)
                        }
                        options={[
                          { value: 'available', label: 'Available' },
                          { value: 'occupied', label: 'Occupied' },
                          { value: 'reserved', label: 'Reserved' },
                          { value: 'maintenance', label: 'Maintenance' },
                        ]}
                        size="large"
                        className="w-full rounded-xl shadow-sm !h-10"
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-2 px-4 border border-[#E0E0E0] text-[#1A1A1A] rounded-xl hover:bg-[#e6f9f0] transition-colors duration-200 font-semibold w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${uniformButtonClass} w-full sm:w-auto justify-center`}
                    >
                      {editingTable ? 'Save Changes' : 'Create Table'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-5 sm:p-7 space-y-5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#EB5757] flex items-center gap-2">
                  <FaTrash />
                  Delete Table
                </h2>
                <p className="text-[#4D4D4D] text-sm sm:text-base">
                  Are you sure you want to delete this table? This action cannot
                  be undone.
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="py-2 px-4 border border-[#E0E0E0] text-[#1A1A1A] rounded-xl hover:bg-[#e6f9f0] transition-colors duration-200 font-semibold w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="py-2 px-4 bg-[#EB5757] hover:bg-[#d9534f] text-white rounded-xl transition-colors duration-200 font-semibold w-full sm:w-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* QR Code Modal */}
        {isQRModalOpen && qrTable && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-5 sm:p-7 space-y-5">
                <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 text-[#04B851]">
                  <FaQrcode className="text-[#04B851] text-xl sm:text-2xl" />
                  <span className="hidden sm:inline">Table QR Code</span>
                  <span className="sm:hidden">QR Code</span>
                </h2>
                <div className="flex flex-col items-center justify-center bg-[#e6f9f0] p-4 sm:p-6 rounded-xl">
                  {/* Show fancy QR image if available, else fallback icon */}
                  {qrTable.qrCode ? (
                    <div className="flex flex-col items-center">
                      <div className="border-4 border-[#04B851]/20 rounded-2xl shadow-lg overflow-hidden">
                        <Image
                          src={qrTable.qrCode}
                          alt={`QR Code for Table ${qrTable.number}`}
                          width={280}
                          height={280}
                          style={{
                            objectFit: 'contain',
                            backgroundColor: 'white',
                          }}
                          className="w-[200px] sm:w-[280px]"
                          unoptimized
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm text-[#4D4D4D]">
                        <FaQrcode className="text-[#04B851]" />
                        <span>Scan to access the menu</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[200px] sm:w-[280px] h-[200px] sm:h-[280px] border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center bg-white">
                      <div className="text-center">
                        <FaQrcode
                          size={60}
                          className="mx-auto mb-3 text-[#04B851] sm:w-20 sm:h-20"
                        />
                        <p className="text-sm sm:text-base text-[#4D4D4D]">
                          QR Code not generated yet
                        </p>
                        <div className="mt-4 text-xs text-[#4D4D4D]">
                          Save to generate QR code
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] shadow-sm w-full">
                    <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                      <MdTableRestaurant className="text-[#04B851]" />
                      {qrTable.name}
                    </h3>
                    <div className="mt-1 space-y-1 text-sm">
                      <p className="text-[#4D4D4D]">Table #{qrTable.number}</p>
                      <p className="text-[#4D4D4D]">
                        Capacity: {qrTable.capacity} people
                      </p>
                      {qrTable.location && (
                        <p className="text-[#4D4D4D]">
                          Location: {qrTable.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (qrTable.qrCode) {
                        const link = document.createElement('a')
                        link.href = qrTable.qrCode
                        link.download = `table-${qrTable.number}-qr.png`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      } else {
                        alert('QR code not available yet.')
                      }
                    }}
                    className="py-2 whitespace-nowrap px-4 border border-[#E0E0E0] bg-[#e6f9f0] text-[#04B851] rounded-xl hover:bg-[#039f45]/10 transition-colors duration-200 flex items-center justify-center gap-2 font-semibold w-full sm:w-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                    </svg>
                    <span className="hidden sm:inline">Download QR</span>
                    <span className="sm:hidden">Download</span>
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsQRModalOpen(false)}
                      className="py-2 px-4 whitespace-nowrap border border-[#E0E0E0] text-[#1A1A1A] rounded-xl hover:bg-[#e6f9f0] transition-colors duration-200 font-semibold w-full sm:w-auto"
                    >
                      Close
                    </button>
                    {/* <button
                      onClick={saveQRCode}
                      className="py-2 px-4  whitespace-nowrap bg-[#ffc300] hover:bg-[#fede31] text-yellow-900 font-semibold rounded-xl transition-colors duration-200 shadow-sm w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">Save QR Code</span>
                      <span className="sm:hidden">Save</span>
                    </button> */}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f3f4f6;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #f3f4f6 transparent;
          }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
