import { Select } from 'antd'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { BsXLg } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import { InventoryItem, InventoryItemFormData } from '@/models/InventoryItem'
import { Supplier } from '@/services/inventoryService'

interface InventoryItemFormProps {
  onSubmit: (data: InventoryItemFormData) => Promise<void>
  onCancel: () => void
  item?: InventoryItem
  categories: string[]
  suppliers: Supplier[]
  isSubmitting?: boolean
  onAddCategory?: (category: string) => Promise<boolean>
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  onSubmit,
  onCancel,
  item,
  categories,
  suppliers,
  isSubmitting = false,
  onAddCategory,
}) => {
  const [formData, setFormData] = useState<InventoryItemFormData>({
    name: '',
    quantity: 0,
    unit: 'units',
    costPerUnit: 0,
    category: categories[0] || 'Other',
    reorderPoint: 0,
    supplier: null,
    autoReorderNotify: false,
    autoReorderThreshold: 0,
    autoReorderQuantity: 0,
  })

  const [showAutoReorder, setShowAutoReorder] = useState(false)

  // If item is provided, populate the form (for editing)
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        category: item.category,
        reorderPoint: item.reorderPoint,
        supplier: item.supplier || null,
        autoReorderNotify: item.autoReorderNotify || false,
        autoReorderThreshold: item.autoReorderThreshold || 0,
        autoReorderQuantity: item.autoReorderQuantity || 0,
      })

      setShowAutoReorder(item.autoReorderNotify || false)
    }
  }, [item])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target

    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))

      // Toggle auto reorder settings visibility
      if (name === 'autoReorderNotify') {
        setShowAutoReorder(checked)
      }
      return
    }

    // Handle numeric fields
    if (
      [
        'quantity',
        'costPerUnit',
        'reorderPoint',
        'autoReorderThreshold',
        'autoReorderQuantity',
      ].includes(name)
    ) {
      const numValue = parseFloat(value) || 0
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Ensure supplier is null if not selected
    const submitData = {
      ...formData,
      supplier: formData.supplier || null,
    }
    await onSubmit(submitData)
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
            {item ? 'Edit' : 'Add'} Inventory Item
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
              Item Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
              placeholder="e.g., Coffee Beans, Milk"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <Select
              value={formData.category}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              }}
              options={categories
                .filter((cat) => cat !== 'All')
                .map((category) => ({ value: category, label: category }))}
              className="w-full rounded-xl shadow-sm !h-10 font-inter"
              size="large"
              style={{ borderRadius: 12 }}
              placeholder="Select or type category"
              showSearch
              allowClear={false}
              filterOption={(input, option) =>
                (option?.label as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              showAction={['focus', 'click']}
              onInputKeyDown={async (e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  // On Enter, set the category to the typed value
                  const newCategory = e.currentTarget.value

                  // If onAddCategory is provided, try to add the category
                  if (onAddCategory) {
                    try {
                      const success = await onAddCategory(newCategory)
                      if (success) {
                        setFormData((prev) => ({
                          ...prev,
                          category: newCategory,
                        }))
                      }
                    } catch (error) {
                      console.error('Failed to add category', error)
                    }
                  } else {
                    // Default behavior if no onAddCategory
                    setFormData((prev) => ({
                      ...prev,
                      category: newCategory,
                    }))
                  }

                  // Prevent form submission
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div className="px-3 py-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Type and press Enter to add a new category
                    </span>
                  </div>
                </>
              )}
              notFoundContent={
                <div className="px-3 py-2 text-center">
                  <span className="text-gray-600 text-sm">
                    Type a new category name and press Enter
                  </span>
                </div>
              }
            />
          </div>

          {/* Supplier */}
          <div className="mb-4">
            <label
              htmlFor="supplier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Supplier
            </label>
            <Select
              value={formData.supplier || undefined}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, supplier: value || null }))
              }}
              options={suppliers.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              }))}
              className="w-full rounded-xl shadow-sm !h-10 font-inter"
              size="large"
              style={{ borderRadius: 12 }}
              placeholder="Select supplier (optional)"
              showSearch
              allowClear={true}
              filterOption={(input, option) =>
                (option?.label as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              notFoundContent={
                <span className="text-gray-400">No suppliers found</span>
              }
            />
          </div>

          {/* Quantity and Unit Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                required
              />
            </div>
            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Unit
              </label>
              <Select
                value={formData.unit}
                onChange={(value) => {
                  if (typeof value === 'string') {
                    setFormData((prev) => ({ ...prev, unit: value }))
                  }
                }}
                options={[
                  { value: 'units', label: 'Units' },
                  { value: 'kg', label: 'Kilograms (kg)' },
                  { value: 'g', label: 'Grams (g)' },
                  { value: 'l', label: 'Liters (l)' },
                  { value: 'ml', label: 'Milliliters (ml)' },
                  { value: 'oz', label: 'Ounces (oz)' },
                  { value: 'lb', label: 'Pounds (lb)' },
                  { value: 'packets', label: 'Packets' },
                  { value: 'pieces', label: 'Pieces' },
                  { value: 'boxes', label: 'Boxes' },
                ]}
                className="w-full rounded-xl shadow-sm !h-10 font-inter"
                size="large"
                style={{ borderRadius: 12 }}
                placeholder="Select unit"
              />
            </div>
          </div>

          {/* Cost and Reorder Point Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="costPerUnit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cost per Unit (₹)
              </label>
              <input
                type="number"
                id="costPerUnit"
                name="costPerUnit"
                value={formData.costPerUnit}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reorderPoint"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reorder Point
              </label>
              <input
                type="number"
                id="reorderPoint"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                required
              />
            </div>
          </div>

          {/* Auto Reorder Section */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
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

            {showAutoReorder && (
              <div className="mt-3 pl-6 border-l-2 border-yellow-200">
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
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                      required={formData.autoReorderNotify}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Notification will be sent when quantity falls below this
                      value
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
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none font-inter"
                      required={formData.autoReorderNotify}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Note: WhatsApp notifications will be integrated in the future.
                </p>
              </div>
            )}
          </div>

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
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-inter hover:opacity-90 shadow-white/[0.5] shadow-inner transition flex items-center gap-2 border border-primary/[0.1] "
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <TbLoader3 className="animate-spin" />
                  {item ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>{item ? 'Update Item' : 'Add Item'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default InventoryItemForm
