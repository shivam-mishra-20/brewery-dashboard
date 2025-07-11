import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import { InventoryItem } from '@/models/InventoryItem'

interface AutoReorderSettingsProps {
  onSubmit: (
    id: string,
    settings: {
      autoReorderNotify: boolean
      autoReorderThreshold?: number
      autoReorderQuantity?: number
    },
  ) => Promise<void>
  onCancel: () => void
  item: InventoryItem
  isSubmitting?: boolean
}

const AutoReorderSettings: React.FC<AutoReorderSettingsProps> = ({
  onSubmit,
  onCancel,
  item,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    autoReorderNotify: false,
    autoReorderThreshold: 0,
    autoReorderQuantity: 0,
  })

  // Populate form data from item
  useEffect(() => {
    setFormData({
      autoReorderNotify: item.autoReorderNotify || false,
      autoReorderThreshold: item.autoReorderThreshold || 0,
      autoReorderQuantity: item.autoReorderQuantity || 0,
    })
  }, [item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (['autoReorderThreshold', 'autoReorderQuantity'].includes(name)) {
      const numValue = parseFloat(value) || 0
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(item.id, formData)
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
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-inter-semibold text-black">
            Auto-Reorder Settings: {item.name}
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
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="autoReorderNotify"
                name="autoReorderNotify"
                checked={formData.autoReorderNotify}
                onChange={handleChange}
                className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
              />
              <label
                htmlFor="autoReorderNotify"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Enable Automatic Reorder Notifications
              </label>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              When enabled, notifications will be generated when stock levels
              fall below the threshold.
              <br />
              Note: WhatsApp integration will be available in the future.
            </p>
          </div>

          <div className="mt-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label
                  htmlFor="autoReorderThreshold"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Threshold Quantity
                </label>
                <input
                  type="number"
                  id="autoReorderThreshold"
                  name="autoReorderThreshold"
                  value={formData.autoReorderThreshold}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  disabled={!formData.autoReorderNotify}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Notification triggered when quantity falls below this value
                </p>
              </div>
              <div>
                <label
                  htmlFor="autoReorderQuantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Suggested Order Qty
                </label>
                <input
                  type="number"
                  id="autoReorderQuantity"
                  name="autoReorderQuantity"
                  value={formData.autoReorderQuantity}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  disabled={!formData.autoReorderNotify}
                />
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4 mb-4">
              <p className="text-sm text-yellow-700">
                Current inventory level:{' '}
                <strong>
                  {item.quantity} {item.unit}
                </strong>
                <br />
                Reorder point:{' '}
                <strong>
                  {item.reorderPoint} {item.unit}
                </strong>
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <TbLoader3 className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Settings</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AutoReorderSettings
