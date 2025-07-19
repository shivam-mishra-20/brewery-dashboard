'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useRef } from 'react'
import { BsArrowLeft } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import MenuItemForm from '@/components/MenuItemForm'
import { useMenu } from '@/context/MenuContext'

export default function EditMenuItemPage() {
  const router = useRouter()
  const params = useParams()
  // Extract the ID safely
  const itemId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : ''

  // Use a ref to track if we've already attempted to load this item
  const loadAttemptedRef = useRef(false)

  const {
    selectedMenuItem,
    loading,
    error,
    loadMenuItemById,
    updateMenuItem,
    categories,
  } = useMenu()

  // Modify the useEffect to avoid the Next.js params warning

  // Create a stable reference to itemId
  const stableItemId = React.useMemo(() => {
    return params?.id
      ? Array.isArray(params.id)
        ? params.id[0]
        : params.id
      : ''
  }, []) // Empty dependency array to create stable reference

  // Use the menu context to load the menu item by ID
  useEffect(() => {
    if (stableItemId && !loadAttemptedRef.current) {
      console.log('Loading menu item with ID:', stableItemId)
      loadAttemptedRef.current = true
      loadMenuItemById(stableItemId)
    }
  }, [stableItemId, loadMenuItemById]) // Use stableItemId instead of params.id

  const handleSubmit = async (formData: any) => {
    try {
      if (!stableItemId) {
        console.error('No item ID available for update')
        return
      }
      console.log('Submitting update for item:', stableItemId, formData)

      // The form component now handles proper merging of data
      // We just need to ensure the ID is included
      const updateData = {
        ...formData,
        id: stableItemId,
        _id: selectedMenuItem?._id,
      }

      await updateMenuItem(stableItemId, updateData)
      router.push('/dashboard/menu')
    } catch (error) {
      console.error('Error updating menu item:', error)
    }
  }

  console.log('Edit page rendering state:', {
    itemId,
    loading,
    error,
    hasSelectedItem: !!selectedMenuItem,
    selectedItemName: selectedMenuItem?.name,
  })

  if (loading) {
    return (
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center bg-[#f7f7f7] rounded-2xl shadow-inner">
        <TbLoader3 className="animate-spin text-yellow-400 mb-4" size={48} />
        <p className="text-lg text-gray-600">Loading menu item...</p>
      </div>
    )
  }

  if (error || !selectedMenuItem) {
    return (
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center bg-[#f7f7f7] rounded-2xl shadow-inner p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">
            {error || `Menu item with ID ${itemId} not found`}
          </p>
          <button
            onClick={() => router.push('/dashboard/menu')}
            className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl font-medium flex items-center gap-2"
          >
            <BsArrowLeft /> Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[85vh] bg-[#f7f7f7] rounded-2xl shadow-inner p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        {/* Header section */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/dashboard/menu')}
            className="mr-4 p-2 rounded-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
            aria-label="Back to menu"
          >
            <BsArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-inter-semibold text-black drop-shadow-sm">
              Edit Menu Item
            </h1>
            <p className="text-black text-xs md:text-sm mt-1">
              Update the details for &quot;{selectedMenuItem.name}&quot;
            </p>
          </div>
        </div>

        {/* Form section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <AnimatePresence>
            <MenuItemForm
              onSubmit={handleSubmit}
              onCancel={() => router.push('/dashboard/menu')}
              item={selectedMenuItem}
              categories={categories.filter((cat) => cat !== 'All')}
              isPage={true}
              isSubmitting={loading}
            />
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
