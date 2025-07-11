import axios from 'axios'
import {
  InventoryItem,
  InventoryItemFormData,
  MenuItemIngredient,
} from '@/models/InventoryItem'

// API-based functions to interact with the MongoDB backend

export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const response = await axios.get('/api/inventory/items')
    return response.data.items.map((item: any) => ({
      id: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      category: item.category,
      reorderPoint: item.reorderPoint,
      lastRestocked: item.lastRestocked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier ? item.supplier._id : null,
      supplierName: item.supplier ? item.supplier.name : null,
      autoReorderThreshold: item.autoReorderThreshold || 0,
      autoReorderNotify: item.autoReorderNotify || false,
      autoReorderQuantity: item.autoReorderQuantity || 0,
    }))
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    throw error
  }
}

export const getInventoryItemsByCategory = async (
  category: string,
): Promise<InventoryItem[]> => {
  try {
    const response = await axios.get(
      `/api/inventory/items?category=${encodeURIComponent(category)}`,
    )
    return response.data.items.map((item: any) => ({
      id: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      category: item.category,
      reorderPoint: item.reorderPoint,
      lastRestocked: item.lastRestocked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier ? item.supplier._id : null,
      supplierName: item.supplier ? item.supplier.name : null,
      autoReorderThreshold: item.autoReorderThreshold || 0,
      autoReorderNotify: item.autoReorderNotify || false,
      autoReorderQuantity: item.autoReorderQuantity || 0,
    }))
  } catch (error) {
    console.error('Error fetching inventory items by category:', error)
    throw error
  }
}

export const addInventoryItem = async (
  formData: InventoryItemFormData,
): Promise<InventoryItem> => {
  try {
    const response = await axios.post('/api/inventory/items', formData)
    const newItem = response.data.item

    return {
      id: newItem._id,
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      costPerUnit: newItem.costPerUnit,
      category: newItem.category,
      reorderPoint: newItem.reorderPoint,
      lastRestocked: newItem.lastRestocked,
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt,
      supplier: newItem.supplier,
      supplierName: newItem.supplier ? newItem.supplier.name : null,
      autoReorderThreshold: newItem.autoReorderThreshold || 0,
      autoReorderNotify: newItem.autoReorderNotify || false,
      autoReorderQuantity: newItem.autoReorderQuantity || 0,
    }
  } catch (error) {
    console.error('Error adding inventory item:', error)
    throw error
  }
}

export const updateInventoryItem = async (
  id: string,
  formData: InventoryItemFormData,
): Promise<InventoryItem> => {
  try {
    const response = await axios.put(`/api/inventory/items`, {
      id,
      ...formData,
    })

    const updatedItem = response.data.item

    return {
      id: updatedItem._id,
      name: updatedItem.name,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      costPerUnit: updatedItem.costPerUnit,
      category: updatedItem.category,
      reorderPoint: updatedItem.reorderPoint,
      lastRestocked: updatedItem.lastRestocked,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
      supplier: updatedItem.supplier,
      supplierName: updatedItem.supplier ? updatedItem.supplier.name : null,
      autoReorderThreshold: updatedItem.autoReorderThreshold || 0,
      autoReorderNotify: updatedItem.autoReorderNotify || false,
      autoReorderQuantity: updatedItem.autoReorderQuantity || 0,
      sku: updatedItem.sku,
      location: updatedItem.location,
    }
  } catch (error) {
    console.error('Error updating inventory item:', error)
    throw error
  }
}

export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/inventory/items?id=${id}`)
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    throw error
  }
}

export const restockInventoryItem = async (
  id: string,
  quantity: number,
): Promise<InventoryItem> => {
  try {
    const response = await axios.post(`/api/inventory/transactions`, {
      inventoryItemId: id,
      type: 'restock',
      quantity: quantity,
      notes: 'Manual restock',
      performedBy: 'User', // In a real app, this would be the authenticated user
    })

    const updatedItem = response.data.updatedItem

    return {
      id: updatedItem._id,
      name: updatedItem.name,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      costPerUnit: updatedItem.costPerUnit,
      category: updatedItem.category,
      reorderPoint: updatedItem.reorderPoint,
      lastRestocked: updatedItem.lastRestocked,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
      supplier: updatedItem.supplier,
      supplierName: updatedItem.supplier ? updatedItem.supplier.name : null,
      autoReorderThreshold: updatedItem.autoReorderThreshold || 0,
      autoReorderNotify: updatedItem.autoReorderNotify || false,
      autoReorderQuantity: updatedItem.autoReorderQuantity || 0,
      sku: updatedItem.sku,
      location: updatedItem.location,
    }
  } catch (error) {
    console.error('Error restocking inventory item:', error)
    throw error
  }
}

export const updateInventoryFromOrder = async (
  ingredients: MenuItemIngredient[],
): Promise<void> => {
  try {
    // We'll call the batch transactions API for more efficiency
    await axios.post('/api/inventory/transactions/batch', {
      items: ingredients.map((ingredient) => ({
        inventoryItemId: ingredient.inventoryItemId,
        type: 'usage',
        quantity: ingredient.quantity,
        notes: 'Order consumption',
        performedBy: 'User', // In a real app, this would be the authenticated user
      })),
    })
  } catch (error) {
    console.error('Error updating inventory from order:', error)
    throw error
  }
}

// Supplier Management Functions
export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierFormData {
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  notes?: string
  isActive?: boolean
}

export const getAllSuppliers = async (
  activeOnly: boolean = false,
): Promise<Supplier[]> => {
  try {
    const response = await axios.get(
      `/api/inventory/suppliers${activeOnly ? '?activeOnly=true' : ''}`,
    )
    return response.data.suppliers.map((supplier: any) => ({
      id: supplier._id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }))
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    throw error
  }
}

export const addSupplier = async (
  formData: SupplierFormData,
): Promise<Supplier> => {
  try {
    const response = await axios.post('/api/inventory/suppliers', formData)
    const supplier = response.data.supplier

    return {
      id: supplier._id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }
  } catch (error) {
    console.error('Error adding supplier:', error)
    throw error
  }
}

export const updateSupplier = async (
  id: string,
  formData: SupplierFormData,
): Promise<Supplier> => {
  try {
    const response = await axios.put('/api/inventory/suppliers', {
      id,
      ...formData,
    })

    const supplier = response.data.supplier

    return {
      id: supplier._id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }
  } catch (error) {
    console.error('Error updating supplier:', error)
    throw error
  }
}

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/inventory/suppliers?id=${id}`)
  } catch (error) {
    console.error('Error deleting supplier:', error)
    throw error
  }
}

// Batch Inventory Update Functions
export interface BatchInventoryItem {
  inventoryItemId: string
  inventoryItemName?: string
  quantity: number
  costPerUnit: number
}

export interface BatchInventoryUpdate {
  id: string
  name: string
  items: BatchInventoryItem[]
  notes?: string
  performedBy: string
  status: 'pending' | 'completed' | 'cancelled'
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface BatchInventoryFormData {
  name: string
  items: BatchInventoryItem[]
  notes?: string
  performedBy?: string
}

export const getBatchInventoryUpdates = async (
  status?: 'pending' | 'completed' | 'cancelled',
  page: number = 1,
  limit: number = 20,
): Promise<{
  batches: BatchInventoryUpdate[]
  pagination: { total: number; page: number; limit: number; pages: number }
}> => {
  try {
    const statusParam = status ? `&status=${status}` : ''
    const response = await axios.get(
      `/api/inventory/batches?page=${page}&limit=${limit}${statusParam}`,
    )

    const batches = response.data.batches.map((batch: any) => ({
      id: batch._id,
      name: batch.name,
      items: batch.items.map((item: any) => ({
        inventoryItemId: item.inventoryItemId._id || item.inventoryItemId,
        inventoryItemName: item.inventoryItemId.name || 'Unknown Item',
        quantity: item.quantity,
        costPerUnit: item.costPerUnit,
      })),
      notes: batch.notes,
      performedBy: batch.performedBy,
      status: batch.status,
      completedAt: batch.completedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    }))

    return {
      batches,
      pagination: response.data.pagination,
    }
  } catch (error) {
    console.error('Error fetching batch updates:', error)
    throw error
  }
}

export const createBatchInventoryUpdate = async (
  formData: BatchInventoryFormData,
): Promise<BatchInventoryUpdate> => {
  try {
    const response = await axios.post('/api/inventory/batches', {
      ...formData,
      performedBy: formData.performedBy || 'User', // In a real app, use authenticated user
    })

    const batch = response.data.batch

    return {
      id: batch._id,
      name: batch.name,
      items: batch.items.map((item: any) => ({
        inventoryItemId: item.inventoryItemId._id || item.inventoryItemId,
        inventoryItemName: item.inventoryItemId.name || 'Unknown Item',
        quantity: item.quantity,
        costPerUnit: item.costPerUnit,
      })),
      notes: batch.notes,
      performedBy: batch.performedBy,
      status: batch.status,
      completedAt: batch.completedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    }
  } catch (error) {
    console.error('Error creating batch update:', error)
    throw error
  }
}

export const updateBatchStatus = async (
  id: string,
  status: 'completed' | 'cancelled',
): Promise<BatchInventoryUpdate> => {
  try {
    const response = await axios.put(`/api/inventory/batches`, {
      id,
      status,
    })

    const batch = response.data.batch

    return {
      id: batch._id,
      name: batch.name,
      items: batch.items.map((item: any) => ({
        inventoryItemId: item.inventoryItemId._id || item.inventoryItemId,
        inventoryItemName: item.inventoryItemId.name || 'Unknown Item',
        quantity: item.quantity,
        costPerUnit: item.costPerUnit,
      })),
      notes: batch.notes,
      performedBy: batch.performedBy,
      status: batch.status,
      completedAt: batch.completedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    }
  } catch (error) {
    console.error('Error updating batch status:', error)
    throw error
  }
}

// Reorder Notifications Functions
export interface ReorderNotification {
  id: string
  inventoryItem: string
  inventoryItemName?: string
  quantityNeeded: number
  currentQuantity: number
  reorderPoint: number
  autoReorderThreshold: number
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  supplier: string
  supplierName?: string
  notifiedAt: string
  orderedAt?: string
  receivedAt?: string
  orderReference?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export const getReorderNotifications = async (
  status?: 'pending' | 'ordered' | 'received' | 'cancelled',
): Promise<ReorderNotification[]> => {
  try {
    const statusParam = status ? `?status=${status}` : ''
    const response = await axios.get(
      `/api/inventory/notifications${statusParam}`,
    )

    return response.data.notifications.map((notification: any) => ({
      id: notification._id,
      inventoryItem:
        notification.inventoryItem._id || notification.inventoryItem,
      inventoryItemName: notification.inventoryItem.name || 'Unknown Item',
      quantityNeeded: notification.quantityNeeded,
      currentQuantity: notification.currentQuantity,
      reorderPoint: notification.reorderPoint,
      autoReorderThreshold: notification.autoReorderThreshold,
      status: notification.status,
      supplier: notification.supplier._id || notification.supplier,
      supplierName: notification.supplier.name || 'Unknown Supplier',
      notifiedAt: notification.notifiedAt,
      orderedAt: notification.orderedAt,
      receivedAt: notification.receivedAt,
      orderReference: notification.orderReference,
      notes: notification.notes,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }))
  } catch (error) {
    console.error('Error fetching reorder notifications:', error)
    throw error
  }
}

export const updateReorderNotificationStatus = async (
  id: string,
  status: 'ordered' | 'received' | 'cancelled',
  data?: { orderReference?: string; notes?: string },
): Promise<ReorderNotification> => {
  try {
    const response = await axios.put(`/api/inventory/notifications`, {
      id,
      status,
      ...data,
    })

    const notification = response.data.notification

    return {
      id: notification._id,
      inventoryItem:
        notification.inventoryItem._id || notification.inventoryItem,
      inventoryItemName: notification.inventoryItem.name || 'Unknown Item',
      quantityNeeded: notification.quantityNeeded,
      currentQuantity: notification.currentQuantity,
      reorderPoint: notification.reorderPoint,
      autoReorderThreshold: notification.autoReorderThreshold,
      status: notification.status,
      supplier: notification.supplier._id || notification.supplier,
      supplierName: notification.supplier.name || 'Unknown Supplier',
      notifiedAt: notification.notifiedAt,
      orderedAt: notification.orderedAt,
      receivedAt: notification.receivedAt,
      orderReference: notification.orderReference,
      notes: notification.notes,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }
  } catch (error) {
    console.error('Error updating reorder notification status:', error)
    throw error
  }
}

// Inventory Analytics Functions
export interface InventoryTransaction {
  id: string
  inventoryItem: string
  inventoryItemName?: string
  type: 'restock' | 'usage' | 'adjustment' | 'waste'
  quantity: number
  previousQuantity: number
  newQuantity: number
  unitCost: number
  totalCost: number
  notes?: string
  performedBy: string
  batchId?: string
  menuItemId?: string
  menuItemName?: string
  createdAt: string
}

export interface InventoryAnalytics {
  totalItems: number
  lowStockItems: number
  totalValue: number
  mostUsedItems: Array<{
    id: string
    name: string
    usageCount: number
    usageQuantity: number
  }>
  recentTransactions: InventoryTransaction[]
  costTrend: Array<{
    date: string
    cost: number
  }>
  usageByCategory: Array<{
    category: string
    usage: number
  }>
}

export const getInventoryAnalytics = async (
  startDate?: string,
  endDate?: string,
): Promise<InventoryAnalytics> => {
  try {
    const dateParams =
      startDate && endDate
        ? `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
        : ''

    const response = await axios.get(`/api/inventory/analytics${dateParams}`)
    return response.data
  } catch (error) {
    console.error('Error fetching inventory analytics:', error)
    throw error
  }
}

export const getInventoryTransactions = async (
  itemId?: string,
  type?: 'restock' | 'usage' | 'adjustment' | 'waste',
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  transactions: InventoryTransaction[]
  pagination: { total: number; page: number; limit: number; pages: number }
}> => {
  try {
    const params = new URLSearchParams()
    if (itemId) params.append('itemId', itemId)
    if (type) params.append('type', type)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await axios.get(
      `/api/inventory/transactions?${params.toString()}`,
    )

    const transactions = response.data.transactions.map((tx: any) => ({
      id: tx._id,
      inventoryItem: tx.inventoryItem._id || tx.inventoryItem,
      inventoryItemName: tx.inventoryItem.name || 'Unknown Item',
      type: tx.type,
      quantity: tx.quantity,
      previousQuantity: tx.previousQuantity,
      newQuantity: tx.newQuantity,
      unitCost: tx.unitCost,
      totalCost: tx.totalCost,
      notes: tx.notes,
      performedBy: tx.performedBy,
      batchId: tx.batchId,
      menuItemId: tx.menuItemId?._id || tx.menuItemId,
      menuItemName: tx.menuItemId?.name,
      createdAt: tx.createdAt,
    }))

    return {
      transactions,
      pagination: response.data.pagination,
    }
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)
    throw error
  }
}

// Low Stock and Reorder Management
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const response = await axios.get('/api/inventory/items?lowStock=true')

    return response.data.items.map((item: any) => ({
      id: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      category: item.category,
      reorderPoint: item.reorderPoint,
      lastRestocked: item.lastRestocked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      supplier: item.supplier ? item.supplier._id : null,
      supplierName: item.supplier ? item.supplier.name : null,
      autoReorderThreshold: item.autoReorderThreshold || 0,
      autoReorderNotify: item.autoReorderNotify || false,
      autoReorderQuantity: item.autoReorderQuantity || 0,
      sku: item.sku,
      location: item.location,
    }))
  } catch (error) {
    console.error('Error fetching low stock items:', error)
    throw error
  }
}

export const toggleAutoReorder = async (
  id: string,
  autoReorderSettings: {
    autoReorderNotify: boolean
    autoReorderThreshold?: number
    autoReorderQuantity?: number
  },
): Promise<InventoryItem> => {
  try {
    const response = await axios.put(`/api/inventory/items/auto-reorder`, {
      id,
      ...autoReorderSettings,
    })

    const updatedItem = response.data.item

    return {
      id: updatedItem._id,
      name: updatedItem.name,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      costPerUnit: updatedItem.costPerUnit,
      category: updatedItem.category,
      reorderPoint: updatedItem.reorderPoint,
      lastRestocked: updatedItem.lastRestocked,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
      supplier: updatedItem.supplier,
      supplierName: updatedItem.supplier ? updatedItem.supplier.name : null,
      autoReorderThreshold: updatedItem.autoReorderThreshold || 0,
      autoReorderNotify: updatedItem.autoReorderNotify || false,
      autoReorderQuantity: updatedItem.autoReorderQuantity || 0,
      sku: updatedItem.sku,
      location: updatedItem.location,
    }
  } catch (error) {
    console.error('Error toggling auto reorder:', error)
    throw error
  }
}
