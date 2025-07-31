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
      <div className="p-4 bg-[#e6f9f0] rounded-2xl mt-4 border border-[#E0E0E0]">
        <p className="text-[#4D4D4D] text-sm">
          No ingredients defined for this menu item.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#e6f9f0] rounded-2xl mt-4 overflow-hidden border border-[#E0E0E0]">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <MdOutlineInventory2 className="text-[#04B851]" />
            <h3 className="font-inter-semibold text-[#1A1A1A]">
              Inventory Impact
            </h3>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-[#04B851] hover:text-[#039f45] font-inter-semibold"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-[#4D4D4D]">Max Can Make</p>
            <p className="font-inter-semibold text-[#1A1A1A]">
              {impact.maxCanMake === Infinity ? '∞' : impact.maxCanMake}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#4D4D4D]">Cost Per Item</p>
            <p className="font-inter-semibold text-[#1A1A1A]">
              {formatCurrency(impact.totalCost)}
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 border-t border-[#E0E0E0] pt-3">
            <h4 className="font-inter-semibold mb-2 text-sm text-[#1A1A1A]">
              Ingredients Impact
            </h4>
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
                    <span className="text-[#4D4D4D]">
                      {ing.inventoryItemName}: {ing.quantity} {ing.unit}
                    </span>
                    <span
                      className={`font-inter-semibold ${
                        isOutOfStock ? 'text-[#EB5757]' : ''
                      } ${isLowStock ? 'text-[#F2C94C]' : 'text-[#04B851]'}`}
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
              className="block text-sm text-[#4D4D4D] mb-1"
            >
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full p-2 border border-[#E0E0E0] rounded-xl focus:ring-2 focus:ring-[#e6f9f0] focus:border-transparent outline-none text-[#1A1A1A] bg-[#F9FAFB]"
            />
          </div>
          <button
            onClick={handleDeductFromInventory}
            disabled={isDeducting || !impact.canMake}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-inter-semibold text-white transition border ${
              !impact.canMake
                ? 'bg-[#E0E0E0] cursor-not-allowed border-[#E0E0E0] text-[#4D4D4D]'
                : 'bg-[#04B851] hover:bg-[#039f45] border-[#04B851]'
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
          <div className="mt-3 text-sm text-[#EB5757] font-inter-semibold">
            Not enough inventory for {quantity} {menuItem.name}(s).
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryUsage
