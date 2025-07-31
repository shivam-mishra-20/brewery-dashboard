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
  }, [params.id]) // Add params.id to dependency array

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
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center bg-[#F9FAFB] rounded-2xl shadow-inner">
        <TbLoader3 className="animate-spin text-[#04B851] mb-4" size={48} />
        <p className="text-lg text-[#4D4D4D]">Loading menu item...</p>
      </div>
    )
  }

  if (error || !selectedMenuItem) {
    return (
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center bg-[#F9FAFB] rounded-2xl shadow-inner p-4">
        <div className="bg-[#FFFFFF] rounded-2xl shadow-lg p-8 max-w-lg w-full border border-[#E0E0E0]">
          <h2 className="text-2xl font-bold text-[#EB5757] mb-4">Error</h2>
          <p className="text-[#4D4D4D] mb-6">
            {error || `Menu item with ID ${itemId} not found`}
          </p>
          <button
            onClick={() => router.push('/dashboard/menu')}
            className="px-4 py-2 bg-gradient-to-r from-[#04B851] to-[#039f45] text-white rounded-xl font-medium flex items-center gap-2 border border-[#04B851] hover:bg-[#039f45]"
          >
            <BsArrowLeft /> Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[85vh] bg-[#F9FAFB] rounded-2xl shadow-inner p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        {/* Header section */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/dashboard/menu')}
            className="mr-4 p-2 rounded-full bg-[#FFFFFF] text-[#04B851] border border-[#E0E0E0] hover:bg-[#e6f9f0] transition"
            aria-label="Back to menu"
          >
            <BsArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-inter-semibold text-[#04B851] drop-shadow-sm">
              Edit Menu Item
            </h1>
            <p className="text-[#4D4D4D] text-xs md:text-sm mt-1">
              Update the details for &quot;{selectedMenuItem.name}&quot;
            </p>
          </div>
        </div>

        {/* Form section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#FFFFFF] rounded-2xl shadow-lg overflow-hidden border border-[#E0E0E0]"
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
