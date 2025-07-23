'use client'

import { message } from 'antd'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { BsPlusCircle, BsSearch } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import CategoryManagerModal from '@/components/CategoryManagerModal'
import ConfirmationDialog from '@/components/ConfirmationDialog'
import MenuItemCard from '@/components/MenuItemCard'
import { useMenu } from '@/context/MenuContext'
import { MenuItem } from '@/models/MenuItem'

export default function MenuPage() {
  const router = useRouter()
  const {
    menuItems,
    loading,
    error,
    categories,
    loadMenuItemsByCategory,
    deleteMenuItem,
    toggleAvailability,
    addCategory,
    editCategory,
    removeCategory,
    loadCategories, // <-- Import loadCategories
  } = useMenu()

  // Local state
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)

  // Load menu items when the component mounts
  useEffect(() => {
    loadMenuItemsByCategory(selectedCategory)
    console.log('MenuPage loaded, selected category:', selectedCategory)
  }, []) // Empty dependency array ensures this only runs once on mount

  // Load categories on mount
  useEffect(() => {
    loadCategories()
    loadMenuItemsByCategory('All')
  }, [])

  // Handle category change
  useEffect(() => {
    if (selectedCategory) {
      loadMenuItemsByCategory(selectedCategory)
    }
  }, [selectedCategory, loadMenuItemsByCategory])

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) {
      console.warn('menuItems is not an array:', menuItems)
      return []
    }

    return menuItems.filter((item) => {
      const searchTermLower = search.toLowerCase()
      const nameMatch =
        item.name?.toLowerCase().includes(searchTermLower) || false
      const descMatch =
        item.description?.toLowerCase().includes(searchTermLower) || false
      return nameMatch || descMatch
    })
  }, [menuItems, search])

  // Handle delete action
  const handleDelete = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // Handle edit action - navigate to edit page
  const handleEdit = (item: MenuItem) => {
    router.push(`/dashboard/menu/edit/${item.id || item._id}`)
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
      console.error('Error deleting menu item:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle toggle availability
  const handleToggleAvailability = async (id: string, available: boolean) => {
    try {
      await toggleAvailability(id, available)
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  // CRUD handlers for categories (implement as needed)
  const handleAddCategory = async (name: string) => {
    if (categories.includes(name)) {
      message.error('Category already exists!')
      return
    }
    try {
      await addCategory(name)
      await loadCategories() // <-- Refresh categories after add
      setSelectedCategory(name) // <-- Optionally select the new category
      message.success('Category added!')
    } catch (err: any) {
      if (err.response?.status === 409) {
        message.error('Category already exists!')
        await loadCategories()
      } else {
        message.error('Failed to add category')
      }
    }
  }
  const handleEditCategory = async (oldName: string, newName: string) => {
    await editCategory(oldName, newName)
    await loadCategories() // <-- Refresh categories after edit
    setSelectedCategory(newName) // <-- Optionally select the edited category
  }
  const handleDeleteCategory = async (name: string) => {
    await removeCategory(name)
    await loadCategories() // <-- Refresh categories after delete
    setSelectedCategory('All') // <-- Optionally reset selection
  }

  console.log('Rendering MenuPage with:', {
    filteredItemsCount: filteredItems?.length || 0,
    loading,
    error,
  })

  return (
    <div className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#f7f7f7] rounded-2xl shadow-inner custom-scrollbar">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-black drop-shadow-sm">
            Menu
          </h1>
          <p className="text-black text-xs md:text-sm mt-1">
            Manage your restaurant menu items
          </p>
        </div>
        <div className="flex md:flex-row flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-64">
            <div className="relative w-full">
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
          </div>
          <div className="flex flex-wrap gap-2 items-center w-full">
            <Link href="/dashboard/menu/add" passHref>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-medium shadow-inner shadow-white/[0.5] border border-yellow-900/[0.1] text-sm hover:scale-105 transition"
              >
                <BsPlusCircle className="text-lg" /> Add Item
              </motion.button>
            </Link>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-yellow-400 to-yellow-500 text-white font-medium shadow-inner border border-yellow-900/[0.1] text-sm hover:scale-105 transition w-full md:w-auto md:ml-2"
              onClick={() => setIsCategoryManagerOpen(true)}
              type="button"
            >
              Manage Categories
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedCategory === category
                ? 'bg-yellow-400 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="w-full flex-1 flex items-center justify-center">
          <TbLoader3 className="animate-spin text-yellow-400 mr-3" size={36} />
          <p className="text-lg text-gray-600">Loading menu items...</p>
        </div>
      ) : error ? (
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-red-50 rounded-xl max-w-md">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl"
              onClick={() => loadMenuItemsByCategory(selectedCategory)}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          layout
          className="w-full px-2 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full flex flex-col items-center justify-center py-16"
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                src="/globe.svg"
                alt="No items"
                className="w-20 mb-4"
              />
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-black text-lg font-inter-semibold"
              >
                No menu items found.
              </motion.p>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-gray-500 text-sm mt-2 text-center max-w-md"
              >
                {selectedCategory !== 'All'
                  ? `Try selecting a different category or add new items to ${selectedCategory}.`
                  : search
                    ? `No items match your search for "${search}".`
                    : 'Start by adding some delicious items to your menu!'}
              </motion.p>
            </motion.div>
          ) : (
            <div className="menu-grid custom-scrollbar">
              <AnimatePresence>
                {filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id || item._id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleAvailability={handleToggleAvailability}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Confirmation Dialog */}
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

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={isCategoryManagerOpen}
        categories={categories.filter((cat) => cat !== 'All')}
        onClose={() => setIsCategoryManagerOpen(false)}
        onAdd={handleAddCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  )
}
