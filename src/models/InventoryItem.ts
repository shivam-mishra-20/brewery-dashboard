export interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  costPerUnit: number
  category: string
  reorderPoint: number
  lastRestocked: string
  createdAt: string
  updatedAt: string
  supplier?: string
  supplierName?: string
  autoReorderThreshold?: number
  autoReorderNotify?: boolean
  autoReorderQuantity?: number
  sku?: string
  location?: string
}

export interface InventoryItemFormData {
  name: string
  quantity: number
  unit: string
  costPerUnit: number
  category: string
  reorderPoint: number
  supplier?: string | null
  autoReorderThreshold?: number
  autoReorderNotify?: boolean
  autoReorderQuantity?: number
  sku?: string
  location?: string
}

// For linking inventory items with menu items
export interface MenuItemIngredient {
  inventoryItemId: string
  inventoryItemName: string // For display purposes
  quantity: number
  unit: string
}
