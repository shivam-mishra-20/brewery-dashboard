'use client'

import { ConfigProvider, Select } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FaEdit, FaPlus, FaQrcode, FaTrash } from 'react-icons/fa'
import { MdTableRestaurant } from 'react-icons/md'
import { TbLoader3 } from 'react-icons/tb'
import TableFloorPlan from '@/components/TableFloorPlan'
import TableOccupancy from '@/components/TableOccupancy'
import TableStats from '@/components/TableStats'

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

export default function TablesPage() {
  // ...existing code...

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
    available: 'bg-[#fede31] text-yellow-900',
    occupied: 'bg-red-400 text-white',
    reserved: 'bg-blue-400 text-white',
    maintenance: 'bg-gray-300 text-gray-700',
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
      const tableData = {
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
        // Create new table
        res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tableData),
        })
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
  const saveQRCode = async () => {
    if (!qrTable) return

    try {
      // Generate a unique identifier for this table's QR code
      const qrData = JSON.stringify({
        tableId: qrTable._id,
        tableNumber: qrTable.number,
        timestamp: new Date().getTime(),
      })

      const res = await fetch(`/api/tables/${qrTable._id}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrData }),
      })

      if (!res.ok) throw new Error('Failed to save QR code')

      // Refresh tables list
      fetchTables()
      setIsQRModalOpen(false)
    } catch (err) {
      console.error('Error saving QR code:', err)
      setError('Failed to save QR code')
    }
  }

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
    'uniform-btn text-white  flex-nowrap whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm bg-gradient-to-tr from-secondary to-primary shadow-white/[.4] border border-primary/[0.1] shadow-inner py-2 rounded-2xl px-3 sm:px-5'
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ffc300',
          colorPrimaryHover: '#fede31',
          colorBorder: '#e5e7eb',
          colorBgContainer: '#fff',
          borderRadius: 12,
          controlHeight: 40,
          fontFamily: 'Inter, inter, sans-serif',
        },
        components: {
          Select: {
            borderRadius: 12,
            controlHeight: 40,
            fontSize: 15,
            colorPrimary: '#ffc300',
            colorPrimaryHover: '#fede31',
            colorBgContainer: '#fff',
            colorBorder: '#e5e7eb',
            colorText: '#1e293b',
            colorTextPlaceholder: '#bdbdbd',
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
      <div className="flex flex-col gap-6 h-[85vh] w-full justify-start items-start px-2 sm:px-4 md:px-6 lg:px-8 pb-3 md:pb-5 rounded-2xl bg-[#f7f7f7] overflow-y-auto custom-scrollbar relative">
        {/* Header - bento style */}
        <div
          className="sticky top-0 left-0 z-20 w-full bg-[#f7f7f7] py-4"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold flex items-center tracking-tight">
                <MdTableRestaurant className="mr-2 text-[#ffc300] text-3xl" />
                Tables Management
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your café tables, QR codes, and table status
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 pl-8 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 ring-[#ffc300] w-full shadow-sm"
                />
                <div className="absolute left-2.5 top-2.5 text-gray-400">
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
                className="rounded-xl shadow-sm !h-10"
              />
              <button onClick={openCreateModal} className={uniformButtonClass}>
                <FaPlus size={14} />
                <span>Add Table</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl font-medium shadow-sm">
              {error}
            </div>
          )}

          {/* Table Stats */}
          {!loading && <TableStats tables={tables} />}

          {/* View Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Floor Plan (Left side) */}
            <div className="w-full">
              {!loading && (
                <TableFloorPlan
                  tables={tables}
                  onTableClick={(table) => openEditModal(table)}
                />
              )}
            </div>
            {/* Occupancy Chart (Right side) */}
            <div className="w-full">
              <TableOccupancy timeRange="weekly" />
            </div>
          </div>

          {/* Tables Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <TbLoader3 className="animate-spin text-[#ffc300]" size={40} />
            </div>
          ) : filteredTables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredTables.map((table) => (
                  <motion.div
                    key={table._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="border border-gray-200 bg-white rounded-2xl p-5 shadow-inner hover:shadow-lg transition-shadow duration-200 relative overflow-hidden flex flex-col gap-2"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div
                        className={`${statusColors[table.status]} rotate-45 transform origin-bottom-right w-[141%] h-16 flex items-center justify-center shadow-md`}
                      >
                        <span className="text-xs font-bold rotate-45 transform origin-center translate-x-4 translate-y-2">
                          {table.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">
                        {table.name}
                        <span className="text-gray-400 ml-1 font-normal">
                          #{table.number}
                        </span>
                      </h3>
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-400 w-24">Capacity:</span>
                        <span>{table.capacity} people</span>
                      </div>
                      {table.location && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-400 w-24">Location:</span>
                          <span>{table.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <span className="text-gray-400 w-24">QR Code:</span>
                        <span>
                          {table.qrCode ? 'Generated' : 'Not generated'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(table)}
                          className="p-2 bg-[#f7f7f7] hover:bg-[#fede31] rounded-xl transition-colors duration-200 border border-gray-200"
                          title="Edit Table"
                        >
                          <FaEdit className="text-gray-600" size={16} />
                        </button>
                        <button
                          onClick={() => openQRModal(table)}
                          className="p-2 bg-[#f7f7f7] hover:bg-[#fede31] rounded-xl transition-colors duration-200 border border-gray-200"
                          title="Show QR Code"
                        >
                          <FaQrcode className="text-gray-600" size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(table._id)}
                          className="p-2 bg-[#f7f7f7] hover:shadow-white/[0.5]  hover:shadow-inner hover:bg-red-100 rounded-xl transition-colors duration-200 border border-gray-200"
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
                        className="rounded-xl shadow-sm !h-10"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-inner">
              <div className="flex flex-col items-center gap-3">
                <MdTableRestaurant className="text-[#ffc300]" size={48} />
                <h3 className="text-xl font-semibold">No tables found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {filterStatus === 'all'
                    ? "You haven't added any tables yet. Click the 'Add Table' button to create your first table."
                    : `No tables with status '${filterStatus}' found. Try changing the filter or add a new table.`}
                </p>
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="mt-2 text-[#ffc300] hover:text-yellow-600 font-semibold transition-colors duration-200"
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
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
              <div className="p-7 space-y-5">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <MdTableRestaurant className="text-[#ffc300] text-2xl" />
                  {editingTable ? 'Edit Table' : 'Add New Table'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
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
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:ring-2 ring-[#ffc300] shadow-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="number"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
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
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:ring-2 ring-[#ffc300] shadow-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="capacity"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
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
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:ring-2 ring-[#ffc300] shadow-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label
                        htmlFor="location"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Near Window, First Floor"
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:ring-2 ring-[#ffc300] shadow-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label
                        htmlFor="status"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
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
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-2 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button type="submit" className={uniformButtonClass}>
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
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
              <div className="p-7 space-y-5">
                <h2 className="text-2xl font-extrabold text-red-500 flex items-center gap-2">
                  <FaTrash />
                  Delete Table
                </h2>
                <p className="text-gray-700">
                  Are you sure you want to delete this table? This action cannot
                  be undone.
                </p>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="py-2 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200 font-semibold"
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
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
            >
              <div className="p-7 space-y-5">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <FaQrcode className="text-[#ffc300] text-2xl" />
                  Table QR Code
                </h2>
                <div className="flex flex-col items-center justify-center bg-[#f7f7f7] p-6 rounded-xl">
                  {/* Simple QR code placeholder - in a real app, you'd use qrcode.react */}
                  <div className="w-[200px] h-[200px] border-2 border-gray-200 rounded-xl flex items-center justify-center bg-white">
                    <div className="text-center">
                      <FaQrcode
                        size={80}
                        className="mx-auto mb-3 text-gray-400"
                      />
                      <p className="text-sm text-gray-400">
                        QR Code for
                        <br />
                        Table #{qrTable.number}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 font-semibold text-gray-700">
                    {qrTable.name} - Table #{qrTable.number}
                  </p>
                </div>
                <div className="flex justify-between gap-3 pt-4">
                  <button
                    onClick={() => {
                      alert('QR code would be downloaded here')
                    }}
                    className="py-2 px-4 border border-gray-200 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 flex items-center gap-2 font-semibold"
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
                    Download QR
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsQRModalOpen(false)}
                      className="py-2 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200 font-semibold"
                    >
                      Close
                    </button>
                    <button
                      onClick={saveQRCode}
                      className="py-2 px-4 bg-[#ffc300] hover:bg-[#fede31] text-yellow-900 font-semibold rounded-xl transition-colors duration-200 shadow-sm"
                    >
                      Save QR Code
                    </button>
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
