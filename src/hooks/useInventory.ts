import { message } from 'antd'
import { useEffect, useState } from 'react'
import { InventoryItem, InventoryItemFormData } from '@/models/InventoryItem'
import {
  addInventoryItem as addInventoryItemService,
  addSupplier as addSupplierService,
  BatchInventoryUpdate,
  createBatchInventoryUpdate,
  deleteInventoryItem as deleteInventoryItemService,
  deleteSupplier as deleteSupplierService,
  getAllSuppliers,
  getBatchInventoryUpdates,
  getInventoryAnalytics,
  getInventoryCategories,
  getInventoryItemsByCategory,
  getInventoryTransactions,
  getLowStockItems as getLowStockItemsService,
  getReorderNotifications,
  InventoryAnalytics,
  InventoryTransaction,
  ReorderNotification,
  restockInventoryItem as restockInventoryItemService,
  Supplier,
  toggleAutoReorder,
  updateBatchStatus,
  updateInventoryItem as updateInventoryItemService,
  updateReorderNotificationStatus,
  updateSupplier as updateSupplierService,
  validateCategory,
  addInventoryCategory,
  editInventoryCategory,
  deleteInventoryCategory,
} from '@/services/inventoryService'
import axios from 'axios'

export const useInventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [batches, setBatches] = useState<BatchInventoryUpdate[]>([])
  const [reorderNotifications, setReorderNotifications] = useState<
    ReorderNotification[]
  >([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>(['All'])

  const loadInventoryItemsByCategory = async (
    category: string,
    bypassCache: boolean = false,
  ) => {
    setLoading(true)
    setError(null)

    try {
      // Add a timestamp parameter to bypass potential API caching issues
      const timestamp = bypassCache ? Date.now() : undefined
      console.log(
        `Loading inventory items for category: ${category}${bypassCache ? ' (bypassing cache)' : ''}`,
      )

      // Get items with optional cache bypass
      const items = await getInventoryItemsByCategory(category, timestamp)

      console.log(`Loaded ${items.length} items for category ${category}`)
      setInventoryItems(items)
    } catch (err) {
      console.error('Error loading inventory:', err)
      setError('Failed to load inventory items')
    } finally {
      setLoading(false)
    }
  }

  // Load suppliers
  const loadSuppliers = async (activeOnly = true) => {
    setLoading(true)

    try {
      const supplierList = await getAllSuppliers(activeOnly)
      setSuppliers(supplierList)
    } catch (err) {
      console.error('Error loading suppliers:', err)
      message.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  // Load all categories from the API
  const loadCategories = async () => {
    try {
      const res = await axios.get('/api/categories?type=inventory')
      // Make sure to extract just the names:
      setCategories(res.data.categories.map((cat: any) => cat.name))
      return res.data.categories
    } catch (err) {
      console.error('Error loading categories:', err)
      message.error('Failed to load categories')
      // Fallback to basic categories
      const fallbackCategories = ['All', 'Beverages', 'Dairy', 'Other']
      setCategories(fallbackCategories)
      return fallbackCategories
    }
  }

  const addInventoryItem = async (
    formData: InventoryItemFormData,
  ): Promise<InventoryItem> => {
    try {
      const newItem = await addInventoryItemService(formData)

      // Update state
      setInventoryItems((prevItems) => [...prevItems, newItem])
      message.success('Inventory item added successfully')
      return newItem
    } catch (err) {
      console.error('Error adding inventory item:', err)
      message.error('Failed to add inventory item')
      throw err
    }
  }

  const updateInventoryItem = async (
    id: string,
    formData: InventoryItemFormData,
  ): Promise<void> => {
    try {
      const updatedItem = await updateInventoryItemService(id, formData)

      // Update state
      setInventoryItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? updatedItem : item)),
      )

      message.success('Inventory item updated successfully')
    } catch (err) {
      console.error('Error updating inventory item:', err)
      message.error('Failed to update inventory item')
      throw err
    }
  }

  const deleteInventoryItem = async (id: string): Promise<void> => {
    try {
      await deleteInventoryItemService(id)

      // Update state
      setInventoryItems((prevItems) =>
        prevItems.filter((item) => item.id !== id),
      )

      message.success('Inventory item deleted successfully')
    } catch (err) {
      console.error('Error deleting inventory item:', err)
      message.error('Failed to delete inventory item')
      throw err
    }
  }

  // Restock functionality
  const restockInventoryItem = async (
    id: string,
    quantity: number,
  ): Promise<void> => {
    try {
      const updatedItem = await restockInventoryItemService(id, quantity)

      // Update state
      setInventoryItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? updatedItem : item)),
      )

      message.success(
        `Restocked ${quantity} ${updatedItem.unit} of ${updatedItem.name}`,
      )
    } catch (err) {
      console.error('Error restocking item:', err)
      message.error('Failed to restock item')
      throw err
    }
  }

  // Low stock and auto reorder functions
  const getLowStockItems = async (): Promise<InventoryItem[]> => {
    try {
      const items = await getLowStockItemsService()
      return items
    } catch (err) {
      console.error('Error fetching low stock items:', err)
      message.error('Failed to fetch low stock items')
      throw err
    }
  }

  const setAutoReorder = async (
    id: string,
    settings: {
      autoReorderNotify: boolean
      autoReorderThreshold?: number
      autoReorderQuantity?: number
    },
  ): Promise<void> => {
    try {
      const updatedItem = await toggleAutoReorder(id, settings)

      // Update state
      setInventoryItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? updatedItem : item)),
      )

      message.success('Auto-reorder settings updated successfully')
    } catch (err) {
      console.error('Error updating auto-reorder settings:', err)
      message.error('Failed to update auto-reorder settings')
      throw err
    }
  }

  // Supplier management functions
  const addSupplier = async (formData: any): Promise<Supplier> => {
    try {
      const newSupplier = await addSupplierService(formData)

      // Update state
      setSuppliers((prevSuppliers) => [...prevSuppliers, newSupplier])
      message.success('Supplier added successfully')
      return newSupplier
    } catch (err) {
      console.error('Error adding supplier:', err)
      message.error('Failed to add supplier')
      throw err
    }
  }

  const updateSupplier = async (id: string, formData: any): Promise<void> => {
    try {
      const updatedSupplier = await updateSupplierService(id, formData)

      // Update state
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((supplier) =>
          supplier.id === id ? updatedSupplier : supplier,
        ),
      )

      message.success('Supplier updated successfully')
    } catch (err) {
      console.error('Error updating supplier:', err)
      message.error('Failed to update supplier')
      throw err
    }
  }

  const deleteSupplier = async (id: string): Promise<void> => {
    try {
      await deleteSupplierService(id)

      // Update state
      setSuppliers((prevSuppliers) =>
        prevSuppliers.filter((supplier) => supplier.id !== id),
      )

      message.success('Supplier deleted successfully')
    } catch (err) {
      console.error('Error deleting supplier:', err)
      message.error('Failed to delete supplier')
      throw err
    }
  }

  // Batch inventory updates functions
  const loadBatches = async (
    status?: 'pending' | 'completed' | 'cancelled',
    page: number = 1,
    limit: number = 20,
  ) => {
    setLoading(true)

    try {
      const response = await getBatchInventoryUpdates(status, page, limit)
      setBatches(response.batches)
      return response
    } catch (err) {
      console.error('Error loading batch updates:', err)
      message.error('Failed to load batch updates')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createBatch = async (formData: any) => {
    try {
      const newBatch = await createBatchInventoryUpdate(formData)

      // Update state
      setBatches((prevBatches) => [newBatch, ...prevBatches])

      message.success('Batch update created successfully')
      return newBatch
    } catch (err) {
      console.error('Error creating batch update:', err)
      message.error('Failed to create batch update')
      throw err
    }
  }

  const updateBatch = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      const updatedBatch = await updateBatchStatus(id, status)

      // Update state
      setBatches((prevBatches) =>
        prevBatches.map((batch) => (batch.id === id ? updatedBatch : batch)),
      )

      // If completed, we need to refresh inventory items
      if (status === 'completed') {
        loadInventoryItemsByCategory('All')
      }

      message.success(`Batch ${status} successfully`)
      return updatedBatch
    } catch (err) {
      console.error('Error updating batch:', err)
      message.error('Failed to update batch')
      throw err
    }
  }

  // Reorder notification functions
  const loadReorderNotifications = async (
    status?: 'pending' | 'ordered' | 'received' | 'cancelled',
  ) => {
    setLoading(true)

    try {
      const notifications = await getReorderNotifications(status)
      setReorderNotifications(notifications)
      return notifications
    } catch (err) {
      console.error('Error loading reorder notifications:', err)
      message.error('Failed to load reorder notifications')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateReorderStatus = async (
    id: string,
    status: 'ordered' | 'received' | 'cancelled',
    data?: { orderReference?: string; notes?: string },
  ) => {
    try {
      const updatedNotification = await updateReorderNotificationStatus(
        id,
        status,
        data,
      )

      // Update state
      setReorderNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? updatedNotification : notification,
        ),
      )

      // If received, we need to refresh inventory items
      if (status === 'received') {
        loadInventoryItemsByCategory('All')
      }

      message.success(`Notification marked as ${status} successfully`)
      return updatedNotification
    } catch (err) {
      console.error('Error updating reorder notification:', err)
      message.error('Failed to update reorder notification')
      throw err
    }
  }

  // Inventory analytics functions
  const loadInventoryAnalytics = async (
    startDate?: string,
    endDate?: string,
  ) => {
    setLoading(true)

    try {
      const data = await getInventoryAnalytics(startDate, endDate)
      setAnalytics(data)
      return data
    } catch (err) {
      console.error('Error loading inventory analytics:', err)
      message.error('Failed to load analytics')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (
    itemId?: string,
    type?: 'restock' | 'usage' | 'adjustment' | 'waste',
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
  ) => {
    setLoading(true)

    try {
      const result = await getInventoryTransactions(
        itemId,
        type,
        startDate,
        endDate,
        page,
        limit,
      )
      setTransactions(result.transactions)
      return result
    } catch (err) {
      console.error('Error loading transactions:', err)
      message.error('Failed to load transactions')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Add a new category
  const addCategory = async (name: string): Promise<boolean> => {
    try {
      await addInventoryCategory(name)
      await loadCategories()
      return true
    } catch (err) {
      console.error('Error adding category:', err)
      message.error('Failed to add category')
      return false
    }
  }

  const editCategory = async (
    oldName: string,
    newName: string,
  ): Promise<boolean> => {
    try {
      await editInventoryCategory(oldName, newName)
      await loadCategories()
      return true
    } catch (err) {
      console.error('Error editing category:', err)
      message.error('Failed to edit category')
      return false
    }
  }

  const removeCategory = async (name: string): Promise<boolean> => {
    try {
      await deleteInventoryCategory(name)
      await loadCategories()
      return true
    } catch (err) {
      console.error('Error removing category:', err)
      message.error('Failed to remove category')
      return false
    }
  }

  // Initialize - combine both useEffects into a single one
  useEffect(() => {
    // Add a flag to prevent multiple initializations
    let isInitialized = false

    const initInventory = async () => {
      if (isInitialized) return
      isInitialized = true

      try {
        setLoading(true)
        // Load data in sequence to prevent race conditions
        await loadCategories()
        await loadInventoryItemsByCategory('All')
        await loadSuppliers()
      } catch (err) {
        console.error('Error initializing inventory data:', err)
        setError('Failed to load inventory data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    initInventory()
  }, [])

  return {
    inventoryItems,
    suppliers,
    batches,
    reorderNotifications,
    transactions,
    analytics,
    loading,
    error,
    categories,
    loadInventoryItemsByCategory,
    loadSuppliers,
    loadCategories,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    restockInventoryItem,
    getLowStockItems,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    loadBatches,
    createBatch,
    updateBatch,
    loadReorderNotifications,
    updateReorderStatus,
    loadInventoryAnalytics,
    loadTransactions,
    setAutoReorder,
    addCategory,
    editCategory,
    removeCategory,
  }
}
