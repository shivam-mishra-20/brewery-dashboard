import { message } from 'antd'
import React, { useState } from 'react'
import { BsCheck2Circle } from 'react-icons/bs'
import { MdOutlineInventory2 } from 'react-icons/md'
import { TbLoader3 } from 'react-icons/tb'
import { InventoryItem } from '@/models/InventoryItem'
import { MenuItem } from '@/models/MenuItem'
import {
  calculateInventoryImpact,
  updateInventoryFromMenuUsage,
} from '@/utils/inventoryUtils'

interface InventoryUsageProps {
  menuItem: MenuItem
  inventoryItems: InventoryItem[]
  onInventoryUpdate: (updatedItems: InventoryItem[]) => void
}

const InventoryUsage: React.FC<InventoryUsageProps> = ({
  menuItem,
  inventoryItems,
  onInventoryUpdate,
}) => {
  const [quantity, setQuantity] = useState(1)
  const [isDeducting, setIsDeducting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Calculate inventory impact
  const impact = calculateInventoryImpact(menuItem, inventoryItems, quantity)

  // Handle deduct from inventory
  const handleDeductFromInventory = async () => {
    if (!impact.canMake) {
      message.error('Not enough inventory to make this item!')
      return
    }

    try {
      setIsDeducting(true)

      // In a real app, you'd call an API here
      const updatedInventory = updateInventoryFromMenuUsage(
        menuItem,
        inventoryItems,
        quantity,
      )

      // Update local state and localStorage
      localStorage.setItem('inventoryItems', JSON.stringify(updatedInventory))
      onInventoryUpdate(updatedInventory)

      message.success(`Deducted inventory for ${quantity} ${menuItem.name}(s)`)
      setQuantity(1) // Reset quantity
    } catch (error) {
      console.error('Error deducting inventory:', error)
      message.error('Failed to update inventory')
    } finally {
      setIsDeducting(false)
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg mt-4">
        <p className="text-gray-500 text-sm">
          No ingredients defined for this menu item.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg mt-4 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <MdOutlineInventory2 className="text-yellow-600" />
            <h3 className="font-medium">Inventory Impact</h3>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Max Can Make</p>
            <p className="font-medium">
              {impact.maxCanMake === Infinity ? '∞' : impact.maxCanMake}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cost Per Item</p>
            <p className="font-medium">{formatCurrency(impact.totalCost)}</p>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <h4 className="font-medium mb-2 text-sm">Ingredients Impact</h4>
            <ul className="space-y-2">
              {menuItem.ingredients.map((ing) => {
                const inventoryItem = inventoryItems.find(
                  (item) => item.id === ing.inventoryItemId,
                )

                if (!inventoryItem) return null

                const remainingAfter =
                  inventoryItem.quantity - ing.quantity * quantity
                const isOutOfStock = remainingAfter < 0
                const isLowStock =
                  remainingAfter <= inventoryItem.reorderPoint &&
                  remainingAfter >= 0

                return (
                  <li
                    key={ing.inventoryItemId}
                    className="text-sm flex justify-between"
                  >
                    <span>
                      {ing.inventoryItemName}: {ing.quantity} {ing.unit}
                    </span>
                    <span
                      className={`
                        ${isOutOfStock ? 'text-red-600 font-medium' : ''}
                        ${isLowStock ? 'text-orange-500 font-medium' : ''}
                      `}
                    >
                      {inventoryItem.quantity} →{' '}
                      {remainingAfter < 0 ? 0 : remainingAfter}{' '}
                      {inventoryItem.unit}
                      {isOutOfStock && ' (Not enough!)'}
                      {isLowStock && ' (Low stock)'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1">
            <label
              htmlFor="quantity"
              className="block text-sm text-gray-500 mb-1"
            >
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleDeductFromInventory}
            disabled={isDeducting || !impact.canMake}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
              !impact.canMake
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isDeducting ? (
              <TbLoader3 className="animate-spin" />
            ) : (
              <BsCheck2Circle />
            )}
            {isDeducting ? 'Processing...' : 'Deduct from Inventory'}
          </button>
        </div>

        {impact.outOfStockIngredients.length > 0 && (
          <div className="mt-3 text-sm text-red-600">
            Not enough inventory for {quantity} {menuItem.name}(s).
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryUsage
