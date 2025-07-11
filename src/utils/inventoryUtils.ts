import { InventoryItem, MenuItemIngredient } from '@/models/InventoryItem'
import { MenuItem } from '@/models/MenuItem'

/**
 * Calculates the potential impact of a menu item on inventory
 * @param menuItem The menu item with ingredients
 * @param inventoryItems Current inventory items
 * @param quantity Number of menu items to calculate for (default: 1)
 * @returns Analysis of inventory impact
 */
export const calculateInventoryImpact = (
  menuItem: MenuItem,
  inventoryItems: InventoryItem[],
  quantity: number = 1,
) => {
  if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
    return {
      canMake: true,
      maxCanMake: Infinity,
      lowStockIngredients: [],
      outOfStockIngredients: [],
      totalCost: 0,
    }
  }

  let totalCost = 0
  let maxCanMake = Infinity
  const lowStockIngredients: Array<{
    ingredient: MenuItemIngredient
    inventoryItem: InventoryItem
    remainingAfter: number
  }> = []
  const outOfStockIngredients: Array<{
    ingredient: MenuItemIngredient
    inventoryItem: InventoryItem
    needed: number
    available: number
  }> = []

  // Check each ingredient
  for (const ingredient of menuItem.ingredients) {
    const inventoryItem = inventoryItems.find(
      (item) => item.id === ingredient.inventoryItemId,
    )

    if (!inventoryItem) continue

    // Calculate how many we can make with this ingredient
    const canMakeWithThisIngredient = Math.floor(
      inventoryItem.quantity / ingredient.quantity,
    )

    // Update the maximum we can make based on the most limiting ingredient
    maxCanMake = Math.min(maxCanMake, canMakeWithThisIngredient)

    // Calculate the cost of this ingredient for the menu item
    const ingredientCost = ingredient.quantity * inventoryItem.costPerUnit
    totalCost += ingredientCost

    // Calculate remaining after making requested quantity
    const remainingAfter =
      inventoryItem.quantity - ingredient.quantity * quantity

    // Check if we have enough to make the requested quantity
    if (remainingAfter < 0) {
      outOfStockIngredients.push({
        ingredient,
        inventoryItem,
        needed: ingredient.quantity * quantity,
        available: inventoryItem.quantity,
      })
    }
    // Check if we'll go below reorder point after making the requested quantity
    else if (remainingAfter <= inventoryItem.reorderPoint) {
      lowStockIngredients.push({
        ingredient,
        inventoryItem,
        remainingAfter,
      })
    }
  }

  return {
    canMake: outOfStockIngredients.length === 0,
    maxCanMake,
    lowStockIngredients,
    outOfStockIngredients,
    totalCost,
  }
}

/**
 * Updates inventory quantities based on menu item ingredients
 * @param menuItem The menu item with ingredients
 * @param inventoryItems Current inventory items
 * @param quantity Number of menu items made (default: 1)
 * @returns Updated inventory items
 */
export const updateInventoryFromMenuUsage = (
  menuItem: MenuItem,
  inventoryItems: InventoryItem[],
  quantity: number = 1,
): InventoryItem[] => {
  if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
    return inventoryItems
  }

  const updatedInventory = [...inventoryItems]

  for (const ingredient of menuItem.ingredients) {
    const itemIndex = updatedInventory.findIndex(
      (item) => item.id === ingredient.inventoryItemId,
    )

    if (itemIndex !== -1) {
      const currentItem = updatedInventory[itemIndex]
      const newQuantity = Math.max(
        0,
        currentItem.quantity - ingredient.quantity * quantity,
      )

      updatedInventory[itemIndex] = {
        ...currentItem,
        quantity: newQuantity,
        updatedAt: new Date().toISOString(),
      }
    }
  }

  return updatedInventory
}
