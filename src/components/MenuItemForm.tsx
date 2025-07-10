import { Select } from 'antd'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { BsImage, BsLightningChargeFill, BsX } from 'react-icons/bs'
import {
  DEFAULT_CATEGORIES,
  MenuItem,
  MenuItemFormData,
} from '@/models/MenuItem'

interface MenuItemFormProps {
  onSubmit: (formData: MenuItemFormData) => Promise<void>
  onCancel: () => void
  item?: MenuItem
  categories?: string[]
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  onSubmit,
  onCancel,
  item,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: '',
    category: categories[0],
    images: [], // Array of File
    imageURLs: [], // Array of string (for preview)
    available: true,
  })

  const [previewURLs, setPreviewURLs] = useState<string[]>([])
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialize form if editing an item
  useEffect(() => {
    if (item) {
      // Use imageURLs array if available, otherwise fall back to legacy imageURL
      const urls =
        item.imageURLs && item.imageURLs.length > 0
          ? item.imageURLs
          : item.imageURL
            ? [item.imageURL]
            : []

      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        images: [],
        imageURLs: urls,
        available: item.available,
      })
      setPreviewURLs(urls)
    }
  }, [item])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? value.replace(/[^0-9.]/g, '') : value,
    }))
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 3) : []
    setFormData((prev) => ({ ...prev, images: files }))

    // Create preview URLs
    const readers: Promise<string>[] = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }),
    )
    Promise.all(readers).then((urls) => setPreviewURLs(urls))
  }

  const removeImage = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }))
    setPreviewURLs((prev) => prev.filter((_, i) => i !== idx))
  }

  const generateDescription = async () => {
    if (!formData.name || !formData.category) {
      alert('Please enter a name and category before generating a description')
      return
    }

    try {
      setIsGeneratingDescription(true)

      const response = await fetch('/api/menu/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: formData.name,
          category: formData.category,
          additionalInfo,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate description')
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, description: data.description }))
    } catch (error) {
      console.error('Error generating description:', error)
      alert(
        'Failed to generate description. Please try again or enter one manually.',
      )
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validate form
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.category
    ) {
      setErrorMessage('Please fill in all required fields')
      return
    }
    if (formData.images && formData.images.length > 3) {
      setErrorMessage('You can upload up to 3 images only')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to save menu item. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <Select
                  value={formData.category}
                  onChange={(value) => {
                    if (typeof value === 'string') {
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  }}
                  options={[
                    { value: 'Coffee', label: 'Coffee' },
                    { value: 'Tea', label: 'Tea' },
                    { value: 'Bakery', label: 'Bakery' },
                    { value: 'Snacks', label: 'Snacks' },
                    { value: 'Desserts', label: 'Desserts' },
                    { value: 'Breakfast', label: 'Breakfast' },
                    { value: 'Lunch', label: 'Lunch' },
                    { value: 'Beverages', label: 'Beverages' },
                    ...categories
                      .filter(
                        (cat) =>
                          ![
                            'Coffee',
                            'Tea',
                            'Bakery',
                            'Snacks',
                            'Desserts',
                            'Breakfast',
                            'Lunch',
                            'Beverages',
                          ].includes(cat),
                      )
                      .map((cat) => ({ value: cat, label: cat })),
                  ]}
                  className="w-full rounded-xl shadow-sm !h-10"
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
                  onInputKeyDown={(e) => {
                    // Allow user to type and press Enter to set as category
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setFormData((prev) => ({
                        ...prev,
                        category: e.currentTarget.value,
                      }))
                    }
                  }}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <div className="px-3 py-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          Type to add a new category
                        </span>
                      </div>
                    </>
                  )}
                  notFoundContent={
                    <span className="text-gray-400">
                      Type to add new category
                    </span>
                  }
                  // Let user type a new category and select it
                  // This enables free text entry
                  open={undefined}
                  // This disables tokenSeparators to avoid value array
                  mode={undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price* (₹)
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="available"
                      checked={formData.available}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, available: true }))
                      }
                      className="mr-2"
                    />
                    <span>Available</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="available"
                      checked={!formData.available}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, available: false }))
                      }
                      className="mr-2"
                    />
                    <span>Unavailable</span>
                  </label>
                </div>
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Images (up to 3)
                </label>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-4">
                      {previewURLs.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center"
                        >
                          <Image
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="object-cover w-full h-full"
                            fill
                            sizes="(max-width: 768px) 100vw, 112px"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <BsX size={16} />
                          </button>
                        </div>
                      ))}
                      {previewURLs.length < 3 && (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                          <BsImage size={32} className="text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500 text-center">
                            Click to upload
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFilesChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none"
                  ></textarea>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={isGeneratingDescription}
                    className="absolute right-2 top-2 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-yellow-500 disabled:opacity-50"
                  >
                    <BsLightningChargeFill />
                    {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Additional info for AI (optional)
                  </label>
                  <input
                    type="text"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="e.g., made with organic ingredients, vegan, spicy"
                    className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mt-4">
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end mt-8 space-x-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-medium shadow-inner shadow-white/[0.5] border border-yellow-900/[0.1] hover:scale-105 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MenuItemForm
