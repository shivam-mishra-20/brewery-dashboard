import { PlusOutlined } from '@ant-design/icons'
import { Select } from 'antd'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { BsImage, BsLightningChargeFill, BsTrash, BsX } from 'react-icons/bs'
import { useInventory } from '@/hooks/useInventory'
import { MenuItem, MenuItemFormData } from '@/models/MenuItem'
import IngredientsManager from './IngredientsManager'

// Update the props interface to include isPage
interface MenuItemFormProps {
  onSubmit: (formData: MenuItemFormData) => Promise<void>
  onCancel: () => void
  item?: MenuItem
  categories?: string[]
  isSubmitting?: boolean
  isPage?: boolean // Add this prop
}

// Then in your component, check for isPage
const MenuItemForm: React.FC<MenuItemFormProps> = ({
  onSubmit,
  onCancel,
  item,
  categories = [],
  isSubmitting: isSubmittingProp = false,
  isPage = false, // Default to false (modal mode)
}) => {
  // Get inventory items for ingredients
  const { inventoryItems, loading: loadingInventory } = useInventory()

  // When initializing form state, ensure all existing values are included
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || (categories.length > 0 ? categories[0] : ''),
    available: item?.available !== undefined ? item?.available : true,
    // Initialize with empty arrays for file uploads
    images: [],
    // Preserve existing images/media URLs
    imageURLs: item?.imageURLs || [],
    videoFile: null,
    videoUrl: item?.videoUrl || '',
    videoThumbnailUrl: item?.videoThumbnailUrl || '',
    ingredients: item?.ingredients || [],
    addOns: item?.addOns || [],
  })

  const [previewURLs, setPreviewURLs] = useState<string[]>([])
  const [videoPreview, setVideoPreview] = useState<string>('')
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(isSubmittingProp)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newAddOn, setNewAddOn] = useState({
    name: '',
    price: '',
    available: true,
    quantity: '',
    unit: '',
    inventoryItemId: '',
  })
  const [addOnError, setAddOnError] = useState<string | null>(null)

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
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        category: item.category || (categories.length > 0 ? categories[0] : ''),
        images: [], // Start with empty images array since we're using URLs for existing images
        imageURLs: urls,
        videoFile: null,
        videoUrl: item.videoUrl || '',
        videoThumbnailUrl: item.videoThumbnailUrl || '',
        ingredients: item.ingredients || [],
        available: item.available !== undefined ? item.available : true,
        addOns: item.addOns || [],
      })
      setPreviewURLs(urls)
      if (item.videoUrl) {
        setVideoPreview(item.videoUrl)
      }
    }
  }, [item, categories])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target

    // Clear any error messages when user makes changes
    if (errorMessage) {
      setErrorMessage(null)
    }

    // Handle form input changes with proper formatting for price
    if (name === 'price') {
      // Allow only numbers and decimal point for price
      const sanitizedValue = value.replace(/[^0-9.]/g, '')

      // Prevent multiple decimal points
      const decimalCount = (sanitizedValue.match(/\./g) || []).length
      const finalValue =
        decimalCount > 1
          ? sanitizedValue.substring(0, sanitizedValue.lastIndexOf('.'))
          : sanitizedValue

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
    } else {
      // For non-price fields, update normally
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check how many slots we have left for images (max 3 total)
    const existingImageCount = formData.imageURLs?.length || 0
    const slotsRemaining = 3 - existingImageCount

    if (slotsRemaining <= 0) {
      setErrorMessage(
        'You already have 3 images. Remove some before adding more.',
      )
      return
    }

    // Take only as many new files as we have slots for
    const files = e.target.files
      ? Array.from(e.target.files).slice(0, slotsRemaining)
      : []

    setFormData((prev) => ({
      ...prev,
      images: files,
    }))

    // Create preview URLs for new files
    const readers: Promise<string>[] = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }),
    )

    // Append new previews to existing ones
    Promise.all(readers).then((newUrls) => {
      setPreviewURLs([
        ...(formData.imageURLs || []), // Keep existing URL previews
        ...newUrls, // Add new file previews
      ])
    })
  }

  const removeImage = (idx: number) => {
    // Check if the image is from an existing URL or a newly uploaded file
    if (idx < (formData.imageURLs?.length || 0)) {
      // Remove from imageURLs (existing images)
      setFormData((prev) => ({
        ...prev,
        imageURLs: prev.imageURLs?.filter((_, i) => i !== idx) || [],
      }))
    } else {
      // Remove from newly uploaded images
      const adjustedIdx = idx - (formData.imageURLs?.length || 0)
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== adjustedIdx),
      }))
    }

    // Remove from preview URLs regardless of source
    setPreviewURLs((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, videoFile: file }))

      // Create preview URL
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }

  const removeVideo = () => {
    setFormData((prev) => ({
      ...prev,
      videoFile: null,
      videoUrl: undefined,
    }))
    setVideoPreview('')
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

      // Check if we have actual file uploads
      const hasImageUploads = formData.images && formData.images.length > 0
      const hasVideoUpload =
        formData.videoFile !== null && formData.videoFile !== undefined

      console.log('Form data before submission:', {
        hasImageUploads,
        imageCount: formData.images?.length || 0,
        hasVideoUpload,
        imageURLs: formData.imageURLs?.length || 0,
      })

      // Properly merge data for submission
      const submissionData = {
        // Keep IDs if editing
        ...(item ? { id: item.id, _id: item._id } : {}),

        // Include core form data
        name: formData.name,
        description: formData.description,
        category: formData.category,
        available: formData.available,

        // Existing image URLs (strings) - important for MongoDB schema
        imageURLs: formData.imageURLs || [],

        // Video URLs if not uploading a new video
        videoUrl: formData.videoUrl || '',
        videoThumbnailUrl: formData.videoThumbnailUrl || '',

        // Include files for upload if they exist
        images: hasImageUploads ? formData.images : [],
        videoFile: hasVideoUpload ? formData.videoFile : null,

        // Properly handle ingredients - important to always pass full array
        ingredients: formData.ingredients || [],
        addOns:
          formData.addOns?.map((addon) => ({
            ...addon,
            price:
              typeof addon.price === 'string'
                ? parseFloat(addon.price as string)
                : addon.price,
            quantity:
              typeof addon.quantity === 'string'
                ? parseFloat(addon.quantity as string)
                : addon.quantity,
          })) || [],

        // Ensure proper type conversion for price
        price:
          typeof formData.price === 'string'
            ? parseFloat(formData.price)
            : formData.price,
      }

      console.log('Submitting form data:', submissionData)
      await onSubmit(submissionData)
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

  // Add a new add-on item
  const handleAddAddOn = () => {
    setAddOnError(null)

    // Validation
    if (!newAddOn.name.trim()) {
      setAddOnError('Add-on name is required')
      return
    }
    if (
      !newAddOn.price ||
      isNaN(Number(newAddOn.price)) ||
      Number(newAddOn.price) < 0
    ) {
      setAddOnError('Add-on price must be a valid number')
      return
    }
    if (
      !newAddOn.quantity ||
      isNaN(Number(newAddOn.quantity)) ||
      Number(newAddOn.quantity) <= 0
    ) {
      setAddOnError('Add-on quantity must be a positive number')
      return
    }
    if (!newAddOn.unit) {
      setAddOnError('Unit is required')
      return
    }
    if (!newAddOn.inventoryItemId) {
      setAddOnError('Inventory item is required')
      return
    }
    // Add the new add-on to the list
    setFormData((prev) => ({
      ...prev,
      addOns: [
        ...(prev.addOns || []),
        {
          name: newAddOn.name.trim(),
          price: Number(newAddOn.price),
          available: newAddOn.available,
          quantity: Number(newAddOn.quantity),
          unit: newAddOn.unit,
          inventoryItemId: newAddOn.inventoryItemId,
        },
      ],
    }))
    // Reset the form
    setNewAddOn({
      name: '',
      price: '',
      available: true,
      quantity: '',
      unit: '',
      inventoryItemId: '',
    })
  }

  // Remove an add-on
  const handleRemoveAddOn = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addOns: (prev.addOns || []).filter((_, i) => i !== index),
    }))
  }

  // When inventory item is selected for add-on, auto-fill unit and inventoryItemId
  const handleAddOnInventorySelect = (value: string) => {
    const selectedItem = inventoryItems.find((item) => item.name === value)
    setNewAddOn((prev) => ({
      ...prev,
      name: value,
      unit: selectedItem?.unit || '',
      inventoryItemId: selectedItem?.id || '',
    }))
  }

  // Update the render function to handle the page mode
  if (isPage) {
    return (
      <div className="p-6 sm:p-8 overflow-y-auto">
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
                placeholder="Select category"
                showSearch
                allowClear={false}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
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
                className="w-full p-2 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#1A1A1A] focus:ring-2 focus:ring-[#e6f9f0] outline-none"
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
                Recipe Video (optional)
              </label>
              <div className="mt-1">
                {videoPreview ? (
                  <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-contain"
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <BsX size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                    <BsImage size={32} className="text-gray-400 mb-2" />
                    <p className="text-gray-500 text-center">
                      Click to upload recipe video
                    </p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      MP4, WebM or MOV (max 100MB)
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                )}
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

          {/* Ingredients Manager */}
          <div className="col-span-full mt-4">
            <h3 className="text-lg font-medium mb-2">Recipe Ingredients</h3>
            {loadingInventory ? (
              <div className="p-4 text-center text-gray-500">
                Loading inventory items...
              </div>
            ) : (
              <IngredientsManager
                inventoryItems={inventoryItems}
                ingredients={formData.ingredients || []}
                onChange={(ingredients) =>
                  setFormData((prev) => ({ ...prev, ingredients }))
                }
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              Add ingredients from your inventory to keep track of stock usage.
            </p>
          </div>

          {/* Add-ons Manager */}
          <div className="col-span-full mt-6">
            <h3 className="text-lg font-medium mb-2">Add-on Options</h3>
            <div className="border border-gray-200 rounded-xl p-4">
              {/* Display existing add-ons */}
              {formData.addOns && formData.addOns.length > 0 ? (
                <div className="mb-4">
                  <div className="grid grid-cols-12 gap-2 font-medium text-gray-600 mb-2 text-sm">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">Available</div>
                    <div className="col-span-1"></div>
                  </div>
                  {formData.addOns.map((addon, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center mb-2"
                    >
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={addon.name}
                          onChange={(e) => {
                            const newAddOns = [...formData.addOns!]
                            newAddOns[index] = {
                              ...addon,
                              name: e.target.value,
                            }
                            setFormData((prev) => ({
                              ...prev,
                              addOns: newAddOns,
                            }))
                          }}
                          className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={addon.price}
                          onChange={(e) => {
                            const price = e.target.value.replace(/[^0-9.]/g, '')
                            const newAddOns = [...formData.addOns!]
                            newAddOns[index] = {
                              ...addon,
                              price: Number(price),
                            }
                            setFormData((prev) => ({
                              ...prev,
                              addOns: newAddOns,
                            }))
                          }}
                          className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={addon.quantity}
                          onChange={(e) => {
                            const quantity = e.target.value.replace(
                              /[^0-9.]/g,
                              '',
                            )
                            const newAddOns = [...formData.addOns!]
                            newAddOns[index] = {
                              ...addon,
                              quantity: Number(quantity),
                            }
                            setFormData((prev) => ({
                              ...prev,
                              addOns: newAddOns,
                            }))
                          }}
                          className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={addon.unit}
                          onChange={(e) => {
                            const newAddOns = [...formData.addOns!]
                            newAddOns[index] = {
                              ...addon,
                              unit: e.target.value,
                            }
                            setFormData((prev) => ({
                              ...prev,
                              addOns: newAddOns,
                            }))
                          }}
                          className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={addon.available ? 'true' : 'false'}
                          onChange={(value) => {
                            const available = value === 'true'
                            const newAddOns = [...formData.addOns!]
                            newAddOns[index] = { ...addon, available }
                            setFormData((prev) => ({
                              ...prev,
                              addOns: newAddOns,
                            }))
                          }}
                          options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' },
                          ]}
                          className="w-full rounded-xl"
                          size="small"
                          style={{ borderRadius: 12 }}
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveAddOn(index)}
                          className="w-full p-2 flex justify-center items-center bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-colors"
                        >
                          <BsTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-4 text-sm">
                  No add-ons defined yet. Add options like &quot;Extra
                  cheese&quot; or &quot;Large size&quot; below.
                </p>
              )}

              {/* Add new add-on form */}
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-sm font-medium mb-2">Add New Add-on</h4>
                {inventoryItems.length === 0 ? (
                  <div className="text-red-500 text-sm mb-2">
                    No inventory items found. Please add items to inventory
                    before creating add-ons.
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        Inventory Item
                      </label>
                      <Select
                        showSearch
                        value={newAddOn.name || undefined}
                        onChange={handleAddOnInventorySelect}
                        options={inventoryItems.map((item) => ({
                          value: item.name,
                          label: item.name,
                        }))}
                        placeholder="Select inventory item"
                        className="w-full rounded-xl"
                        size="small"
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="text"
                        value={newAddOn.price}
                        onChange={(e) =>
                          setNewAddOn({
                            ...newAddOn,
                            price: e.target.value.replace(/[^0-9.]/g, ''),
                          })
                        }
                        placeholder="0.00"
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Quantity
                      </label>
                      <input
                        type="text"
                        value={newAddOn.quantity}
                        onChange={(e) =>
                          setNewAddOn({
                            ...newAddOn,
                            quantity: e.target.value.replace(/[^0-9.]/g, ''),
                          })
                        }
                        placeholder="e.g. 1"
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={newAddOn.unit}
                        onChange={(e) =>
                          setNewAddOn({
                            ...newAddOn,
                            unit: e.target.value,
                          })
                        }
                        placeholder="e.g. ml, slice"
                        className="w-full p-2 rounded-xl border border-gray-200 bg-white text-black focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Available
                      </label>
                      <Select
                        value={newAddOn.available ? 'true' : 'false'}
                        onChange={(value) =>
                          setNewAddOn({
                            ...newAddOn,
                            available: value === 'true',
                          })
                        }
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                        className="w-full rounded-xl"
                        size="small"
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={handleAddAddOn}
                        className="w-full p-2 bg-gradient-to-tr from-primary to-secondary text-white rounded-xl hover:bg-green-700 text-sm flex items-center justify-center shadow-inner shadow-white/[0.1]"
                        disabled={!newAddOn.name}
                      >
                        <PlusOutlined />
                      </button>
                    </div>
                  </div>
                )}
                {addOnError && (
                  <p className="text-red-500 text-xs mt-1">{addOnError}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Add-ons are optional items customers can select when ordering
                this menu item.
              </p>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mt-4">
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="flex justify-end mt-8 space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : item
                  ? 'Update Item'
                  : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Original modal version
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      {/* Modal content */}
      {/* ... */}
    </motion.div>
  )
}

export default MenuItemForm
