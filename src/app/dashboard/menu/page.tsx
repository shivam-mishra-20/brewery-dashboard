/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client'

import { message } from 'antd'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { BsPlusCircle, BsSearch } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import ConfirmationDialog from '@/components/ConfirmationDialog'
import MenuItemCard from '@/components/MenuItemCard'
import MenuItemForm from '@/components/MenuItemForm'
import { useMenu } from '@/hooks/useMenu'
import { MenuItem, MenuItemFormData } from '@/models/MenuItem'

export default function MenuPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // User/plan state
  const [userBlocked, setUserBlocked] = useState(false)
  const [userChecked, setUserChecked] = useState(false)

  useEffect(() => {
    async function checkUserPlan() {
      try {
        // You may need to adjust this endpoint to your actual user/me API
        const token = localStorage.getItem('token')
        const res = await axios.get('/api/auth/user/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const user = res.data.user
        if (!user || !user.subscriptionPlan) return
        // Fetch plan details if not populated
        const plan =
          user.subscriptionPlan.trialPeriodDays !== undefined
            ? user.subscriptionPlan
            : (
                await axios.get(
                  `/api/subscription/plans?id=${user.subscriptionPlan}`,
                )
              ).data.plan
        if (
          plan &&
          plan.name.toLowerCase() === 'free' &&
          plan.trialPeriodDays > 0
        ) {
          const trialStart = new Date(user.trialStart)
          const now = new Date()
          const diffDays = Math.floor(
            (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24),
          )
          if (diffDays >= plan.trialPeriodDays) {
            setUserBlocked(true)
            message.error('Please upgrade')
          }
        }
      } catch {
        // Optionally handle error
      } finally {
        setUserChecked(true)
      }
    }
    checkUserPlan()
  }, [])
  const {
    menuItems,
    loading,
    error,
    categories,
    loadMenuItemsByCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
  } = useMenu()

  // Local state
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)

  // Handle category change
  useEffect(() => {
    loadMenuItemsByCategory(selectedCategory)
  }, [selectedCategory])

  // Filter items based on search
  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()),
  )

  // Handle form submit for add/edit
  const handleFormSubmit = async (formData: MenuItemFormData) => {
    try {
      setIsSubmitting(true)
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData)
      } else {
        await addMenuItem(formData)
      }
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      setIsDeleting(true)
      await deleteMenuItem(itemToDelete)
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle edit button click
  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  // Handle delete button click
  const handleDelete = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  if (!userChecked) return null
  if (userBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <img src="/file.svg" alt="Upgrade" className="w-24 mb-6 opacity-60" />
        <h2 className="text-2xl font-bold text-red-500 mb-2">Trial Expired</h2>
        <p className="text-gray-700 text-lg mb-4">
          Your free trial has ended. Please upgrade your plan to continue using
          the dashboard.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#f7f7f7] rounded-2xl shadow-inner custom-scrollbar"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-black drop-shadow-sm">
            Menu
          </h1>
          <p className="text-black text-xs md:text-sm mt-1">
            Explore, edit, and manage your cafe&apos;s menu. Add new items with
            a click!
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              className="w-full py-2 pl-10 pr-4 rounded-xl border border-yellow-300 bg-white text-black text-sm focus:ring-2 focus:ring-yellow-400 outline-none transition"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500">
              <BsSearch className="text-xl" />
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-medium shadow-inner shadow-white/[0.5] border border-yellow-900/[0.1] text-sm hover:scale-105 transition"
          >
            <BsPlusCircle className="text-lg" /> Add Item
          </motion.button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-2">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm backdrop-blur-md ${
              selectedCategory === cat
                ? 'bg-yellow-400 shadow-inner text-white border-yellow-400 shadow-white/[.4]'
                : 'bg-white text-black border-yellow-200 hover:bg-yellow-50'
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <TbLoader3 className="animate-spin text-yellow-400" size={40} />
        </div>
      ) : error ? (
        <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <p className="font-semibold">Error loading menu items</p>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-16"
            >
              <img
                src="/globe.svg"
                alt="No items"
                className="w-20 mb-4 opacity-60"
              />
              <p className="text-black text-lg font-inter-semibold">
                No menu items found.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {selectedCategory !== 'All'
                  ? `Try selecting a different category or add new items to ${selectedCategory}.`
                  : search
                    ? `No items match your search for "${search}".`
                    : 'Start by adding some delicious items to your menu!'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAvailability={toggleAvailability}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <MenuItemForm
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingItem(null)
            }}
            item={editingItem || undefined}
            categories={categories.filter((cat) => cat !== 'All')}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setItemToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmText="Delete Item"
        cancelText="Cancel"
        isLoading={isDeleting}
        danger
      />
    </motion.div>
  )
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setIsSubmitting(_arg0: boolean) {
  throw new Error('Function not implemented.')
}
