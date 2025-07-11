import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import { Supplier, SupplierFormData } from '@/services/inventoryService'

interface SupplierFormProps {
  onSubmit: (data: SupplierFormData) => Promise<void>
  onCancel: () => void
  supplier?: Supplier
  isSubmitting?: boolean
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  onSubmit,
  onCancel,
  supplier,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    isActive: true,
  })

  // If supplier is provided, populate the form (for editing)
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes || '',
        isActive: supplier.isActive,
      })
    }
  }, [supplier])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target

    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-inter-semibold text-black">
            {supplier ? 'Edit' : 'Add'} Supplier
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <BsXLg size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {/* Name */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Supplier Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
              placeholder="e.g., Bean Suppliers Inc."
              required
            />
          </div>

          {/* Contact Person */}
          <div className="mb-4">
            <label
              htmlFor="contactPerson"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contact Person
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
              placeholder="e.g., John Smith"
              required
            />
          </div>

          {/* Email and Phone Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
              placeholder="123 Main St, City, State, ZIP"
              required
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
              placeholder="Additional information about the supplier..."
              rows={3}
            />
          </div>

          {/* Active Status - only show for editing */}
          {supplier && (
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Active Supplier
                </label>
              </div>{' '}
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Inactive suppliers won&apos;t appear in dropdown selections
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl font-inter hover:bg-gray-200 transition border border-gray-300 shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-inter shadow-white/[0.5] shadow-inner hover:opacity-90 transition flex items-center gap-2  border border-primary/[0.1]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <TbLoader3 className="animate-spin" />
                  {supplier ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>{supplier ? 'Update Supplier' : 'Add Supplier'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default SupplierForm
