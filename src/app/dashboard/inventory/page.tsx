'use client'

import { message } from 'antd'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { BsPlusCircle, BsSearch } from 'react-icons/bs'
import { TbLoader3 } from 'react-icons/tb'
import AutoReorderSettings from '@/components/AutoReorderSettings'
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
    loadSuppliers,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    restockInventoryItem,
    getLowStockItems,
    setAutoReorder,
  } = useInventory()

  // Local state
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  // Auto Reorder Settings
  const [isAutoReorderModalOpen, setIsAutoReorderModalOpen] = useState(false)
  const [autoReorderItem, setAutoReorderItem] = useState<InventoryItem | null>(
    null,
  )

  // Handle category change
  useEffect(() => {
    loadInventoryItemsByCategory(selectedCategory)
  }, [selectedCategory])

  // Load suppliers for the form
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Get low stock items count
  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const lowStockItems = await getLowStockItems()
        setLowStockCount(lowStockItems.length)
      } catch (error) {
        console.error('Error fetching low stock items:', error)
      }
    }

    fetchLowStockCount()
  }, [])

  // Filter items based on search and low stock filter
  const filteredItems = inventoryItems
    .filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((item) => !showLowStockOnly || item.quantity <= item.reorderPoint)

  // Handle form submit for add/edit
  const handleFormSubmit = async (formData: InventoryItemFormData) => {
    try {
      setIsSubmitting(true)
      if (editingItem) {
        await updateInventoryItem(editingItem.id, formData)
      } else {
        await addInventoryItem(formData)
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
      await deleteInventoryItem(itemToDelete)
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting item:', error)
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

  // Get low stock items count

  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const lowStockItems = await getLowStockItems()
        setLowStockCount(lowStockItems.length)
      } catch (error) {
        console.error('Error fetching low stock items:', error)
      }
    }

    fetchLowStockCount()
  }, [])

  return (
    <div className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#f7f7f7] rounded-2xl shadow-inner custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-black drop-shadow-sm">
            Inventory
          </h1>
          <p className="text-black text-xs md:text-sm mt-1">
            Manage your inventory items, track stock levels, and link items to
            your menu.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              className="w-full py-2 pl-10 pr-4 rounded-xl border border-yellow-300 bg-white text-black text-sm focus:ring-2 focus:ring-yellow-400 outline-none transition"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500">
              <BsSearch className="text-xl" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/inventory/suppliers"
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white text-sm transition"
            >
              Manage Suppliers
            </a>
            <button
              onClick={() => {
                setEditingItem(null)
                setIsFormOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-medium shadow-inner shadow-white/[0.5] border border-yellow-900/[0.1] text-sm hover:scale-105 transition"
            >
              <BsPlusCircle className="text-lg" /> Add Item
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
              className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm backdrop-blur-md ${
                selectedCategory === cat
                  ? 'bg-yellow-400 shadow-inner text-white border-yellow-400 shadow-white/[.4]'
                  : 'bg-white text-black border-yellow-200 hover:bg-yellow-50'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Low stock filter toggle */}
        <button
          className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm backdrop-blur-md flex items-center gap-2 ${
            showLowStockOnly
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-black border-red-200 hover:bg-red-50'
          }`}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          Low Stock {lowStockCount > 0 && `(${lowStockCount})`}
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <TbLoader3 className="animate-spin text-yellow-400" size={40} />
        </div>
      ) : error ? (
        <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
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
              <p className="text-black text-lg font-inter-semibold">
                No inventory items found.
              </p>
              <p className="text-gray-500 text-sm mt-2">
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
    </div>
  )
}
