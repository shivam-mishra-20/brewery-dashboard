'use client'

import { message } from 'antd'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { BsPlusCircle, BsSearch } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import AutoReorderSettings from '@/components/AutoReorderSettings'
import CategoryManagerModal from '@/components/CategoryManagerModal'
import ConfirmationDialog from '@/components/ConfirmationDialog'
import InventoryItemCard from '@/components/InventoryItemCard'
import InventoryItemForm from '@/components/InventoryItemForm'
import { useInventory } from '@/hooks/useInventory'
import { InventoryItem, InventoryItemFormData } from '@/models/InventoryItem'

export default function InventoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch inventory data and functions
  const {
    inventoryItems,
    suppliers,
    loading,
    error,
    categories,
    loadInventoryItemsByCategory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    restockInventoryItem,
    getLowStockItems,
    setAutoReorder,
    addCategory,
    editCategory,
    removeCategory,
    loadCategories,
  } = useInventory()

  // Local state
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  // Auto Reorder Settings
  const [isAutoReorderModalOpen, setIsAutoReorderModalOpen] = useState(false)
  const [autoReorderItem, setAutoReorderItem] = useState<InventoryItem | null>(
    null,
  )

  // Handle category change - use a ref to track if initial load has happened
  const initialLoadDone = useRef(false)

  useEffect(() => {
    // Skip initial load as it will be handled by useInventory hook
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      return
    }

    // Only load on category change after initial load
    loadInventoryItemsByCategory(selectedCategory)
  }, [selectedCategory, loadInventoryItemsByCategory])

  // Get low stock items count - using a debounced approach
  useEffect(() => {
    const fetchLowStockCount = async () => {
      // Skip if we're already loading
      if (loading) return

      try {
        const lowStockItems = await getLowStockItems()
        setLowStockCount(lowStockItems.length)
      } catch (error) {
        console.error('Error fetching low stock items:', error)
      }
    }

    // Initial fetch
    fetchLowStockCount()

    // Set up refresh interval, but less frequently (5 minutes)
    const intervalId = setInterval(fetchLowStockCount, 5 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [getLowStockItems, loading])

  // Filter items based on search and low stock filter
  const filteredItems = inventoryItems
    .filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((item) => !showLowStockOnly || item.quantity <= item.reorderPoint)

  // Handle form submit for add/edit with force bypass cache approach
  const handleFormSubmit = async (formData: InventoryItemFormData) => {
    try {
      setIsSubmitting(true)

      if (editingItem) {
        // For edits
        await updateInventoryItem(editingItem.id, formData)
        // Force a complete refresh to get updated data
        await loadInventoryItemsByCategory(selectedCategory, true)
      } else {
        // For new items
        const newItem = await addInventoryItem(formData)
        console.log('New item added successfully:', newItem)

        // Refresh categories in case a new one was added
        await loadCategories()

        message.success('Item added successfully! Refreshing data...')

        // Force a complete refresh with cache bypass to ensure we get the latest data
        if (selectedCategory === 'All') {
          // When adding to "All" category, force reload with cache bypass
          await loadInventoryItemsByCategory('All', true)
        } else {
          // For specific category, refresh both the category and All
          await loadInventoryItemsByCategory(selectedCategory, true)

          // No need for a timeout since we're using a different approach
          loadInventoryItemsByCategory('All', true)
        }
      }

      setIsFormOpen(false)
      setEditingItem(null)

      // Show additional success message for edit operations
      if (editingItem) {
        message.success('Item updated successfully!')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      message.error('Failed to save item. Please try again.')

      // Even on error, try to refresh the data to maintain consistency
      try {
        await loadInventoryItemsByCategory(selectedCategory, true)
      } catch {
        // Ignore any secondary errors
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      setIsDeleting(true)
      await deleteInventoryItem(itemToDelete)

      // Refresh inventory data after deletion with cache bypass
      await loadInventoryItemsByCategory(selectedCategory, true)

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      message.success('Item deleted successfully!')
    } catch (error) {
      console.error('Error deleting item:', error)
      message.error('Failed to delete item. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle edit button click
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  // Handle delete button click
  const handleDelete = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // Handle restock
  const handleRestock = async (id: string, quantity: number) => {
    try {
      await restockInventoryItem(id, quantity)

      // Refresh inventory data after restocking with cache bypass
      await loadInventoryItemsByCategory(selectedCategory, true)

      message.success(`Successfully restocked ${quantity} units`)
    } catch (error) {
      console.error('Error restocking item:', error)
      message.error('Failed to restock item')
    }
  }

  // Handle auto-reorder settings
  const handleAutoReorderSettings = (item: InventoryItem) => {
    setAutoReorderItem(item)
    setIsAutoReorderModalOpen(true)
  }

  // Handle auto-reorder form submit
  const handleAutoReorderSubmit = async (
    id: string,
    settings: {
      autoReorderNotify: boolean
      autoReorderThreshold?: number
      autoReorderQuantity?: number
    },
  ) => {
    setIsSubmitting(true)

    try {
      await setAutoReorder(id, settings)

      // Refresh inventory data after updating auto-reorder settings with cache bypass
      await loadInventoryItemsByCategory(selectedCategory, true)

      setIsAutoReorderModalOpen(false)
      setAutoReorderItem(null)
      message.success('Auto-reorder settings updated successfully')
    } catch (error) {
      console.error('Error updating auto-reorder settings:', error)
      message.error('Failed to update auto-reorder settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get low stock items count for UI display
  // Count of low stock items
  const [lowStockCount, setLowStockCount] = useState(0)

  // CRUD handlers for categories
  const handleAddCategory = async (name: string) => {
    await addCategory(name)
    await loadCategories()
  }
  const handleEditCategory = async (oldName: string, newName: string) => {
    await editCategory(oldName, newName)
    await loadCategories()
  }
  const handleDeleteCategory = async (name: string) => {
    await removeCategory(name)
    await loadCategories()
  }

  return (
    <div className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#F9FAFB] rounded-2xl shadow-inner custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-[#04B851] drop-shadow-sm">
            Inventory
          </h1>
          <p className="text-[#4D4D4D] text-xs md:text-sm mt-1">
            Manage your inventory items, track stock levels, and link items to
            your menu.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-64">
            <div className="relative w-full">
              <input
                className="w-full py-2 pl-10 pr-4 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#1A1A1A] text-sm focus:ring-2 focus:ring-[#04B851] outline-none transition"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#04B851]">
                <BsSearch className="text-xl" />
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center w-full">
            <a
              href="/dashboard/inventory/suppliers"
              className="flex items-center gap-1 px-4 py-2 rounded-xl whitespace-nowrap border border-[#04B851] text-[#04B851] hover:bg-[#04B851] hover:text-white text-sm transition font-inter-semibold"
            >
              Manage Suppliers
            </a>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-[#04B851] to-[#039f45] text-white font-medium shadow-inner shadow-[#e6f9f0]/[0.5] border border-[#04B851] text-sm hover:scale-105 transition font-inter-semibold"
              onClick={() => {
                setEditingItem(null)
                setIsFormOpen(true)
              }}
            >
              <BsPlusCircle className="text-lg" /> Add Item
            </button>
            {/* Show Manage Categories inline on desktop, below on mobile */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#04B851] text-white font-medium shadow-inner border border-[#04B851] text-sm hover:scale-105 transition w-full md:w-auto md:ml-2 font-inter-semibold"
              onClick={() => setIsCategoryManagerOpen(true)}
              type="button"
            >
              Manage Categories
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm backdrop-blur-md font-inter-semibold ${
                selectedCategory === cat
                  ? 'bg-[#04B851] shadow-inner text-white border-[#04B851] shadow-[#e6f9f0]/[.4]'
                  : 'bg-[#FFFFFF] text-[#1A1A1A] border-[#E0E0E0] hover:bg-[#e6f9f0] hover:text-[#04B851] hover:border-[#04B851]'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Low stock filter toggle */}
        <button
          className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm backdrop-blur-md flex items-center gap-2 font-inter-semibold ${
            showLowStockOnly
              ? 'bg-[#EB5757] text-white border-[#EB5757]'
              : 'bg-[#FFFFFF] text-[#1A1A1A] border-[#E0E0E0] hover:bg-[#e6f9f0] hover:text-[#04B851] hover:border-[#04B851]'
          }`}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          Low Stock {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <TbLoader3 className="animate-spin text-[#04B851]" size={40} />
        </div>
      ) : error ? (
        <div className="col-span-full bg-[#e6f9f0] border border-[#EB5757] text-[#EB5757] p-4 rounded-xl">
          <p className="font-semibold">Error loading inventory items</p>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Image
                src="/globe.svg"
                alt="No items"
                className="w-20 mb-4 opacity-60"
                width={80}
                height={80}
              />
              <p className="text-[#1A1A1A] text-lg font-inter-semibold">
                No inventory items found.
              </p>
              <p className="text-[#4D4D4D] text-sm mt-2">
                {selectedCategory !== 'All'
                  ? `Try selecting a different category or add new items to ${selectedCategory}.`
                  : search
                    ? `No items match your search for "${search}".`
                    : showLowStockOnly
                      ? 'No items are currently below their reorder point.'
                      : 'Start by adding some inventory items!'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestock={handleRestock}
                onAutoReorder={handleAutoReorderSettings}
              />
            ))
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <InventoryItemForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingItem(null)
          }}
          item={editingItem || undefined}
          categories={categories.filter((cat) => cat !== 'All')}
          suppliers={suppliers}
          isSubmitting={isSubmitting}
          onAddCategory={addCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setItemToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item? This action cannot be undone."
        confirmText="Delete Item"
        cancelText="Cancel"
        isLoading={isDeleting}
        danger
      />

      {/* Auto Reorder Settings Modal */}
      {isAutoReorderModalOpen && autoReorderItem && (
        <AutoReorderSettings
          item={autoReorderItem}
          onSubmit={handleAutoReorderSubmit}
          onCancel={() => {
            setIsAutoReorderModalOpen(false)
            setAutoReorderItem(null)
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={isCategoryManagerOpen}
        categories={categories}
        onClose={() => setIsCategoryManagerOpen(false)}
        onAdd={handleAddCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  )
}
