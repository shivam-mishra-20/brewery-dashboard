'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { BsArrowLeft } from 'react-icons/bs'
import MenuItemForm from '@/components/MenuItemForm'
import { useMenu } from '@/context/MenuContext'

export default function AddMenuItemPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { categories, addMenuItem, loading } = useMenu()

  const handleSubmit = async (formData: any) => {
    try {
      await addMenuItem(formData)
      router.push('/dashboard/menu')
    } catch (error) {
      console.error('Error adding menu item:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to add menu item',
      )
    }
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
              Add New Menu Item
            </h1>
            <p className="text-[#4D4D4D] text-xs md:text-sm mt-1">
              Create a delicious new addition to your menu
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-[#e6f9f0] border border-[#EB5757] text-[#EB5757] p-4 rounded-xl"
          >
            <p>{error}</p>
          </motion.div>
        )}

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
