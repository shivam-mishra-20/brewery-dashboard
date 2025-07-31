import { motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import { BsXLg } from 'react-icons/bs'
import { InventoryItem } from '@/models/InventoryItem'
import { MenuItem } from '@/models/MenuItem'

interface MenuItemDetailViewProps {
  item: MenuItem
  onClose: () => void
  inventoryItems: InventoryItem[]
}

const MenuItemDetailView: React.FC<MenuItemDetailViewProps> = ({
  item,
  onClose,
  inventoryItems,
}) => {
  // Format price
  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get ingredient details from inventory
  const getIngredientDetails = (ingredientId: string) => {
    return inventoryItems.find((item) => item.id === ingredientId)
  }

  // Calculate if any ingredients are low in stock
  const hasLowStockIngredients = item.ingredients?.some((ing) => {
    const inventoryItem = getIngredientDetails(ing.inventoryItemId)
    return inventoryItem && inventoryItem.quantity <= inventoryItem.reorderPoint
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-inter-semibold text-black">
            Menu Item Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <BsXLg size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Item image */}
          {item.imageURL && (
            <div className="mb-5">
              <Image
                src={item.imageURL}
                alt={item.name}
                width={800}
                height={300}
                className="w-full h-48 object-cover rounded-lg"
                style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                priority
              />
            </div>
          )}

          {/* Basic details */}
          <div className="mb-6">
            <h3 className="text-2xl font-inter-semibold mb-2 text-[#1A1A1A]">
              {item.name}
            </h3>
            <div className="flex justify-between items-center mb-3">
              <span className="bg-[#e6f9f0] text-[#04B851] px-3 py-1 rounded-full text-sm font-inter-semibold border border-[#04B851]">
                {item.category}
              </span>
              <span className="font-inter-semibold text-lg text-[#04B851]">
                ₹{formatPrice(item.price)}
              </span>
            </div>
            <p className="text-[#4D4D4D]">{item.description}</p>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <div className="flex items-center">
              <span className="mr-2 font-medium text-[#4D4D4D]">Status:</span>
              {item.available ? (
                <span className="bg-[#e6f9f0] text-[#04B851] px-2 py-0.5 rounded-full text-sm font-inter-semibold border border-[#04B851]">
                  Available
                </span>
              ) : (
                <span className="bg-[#F9FAFB] text-[#EB5757] px-2 py-0.5 rounded-full text-sm font-inter-semibold border border-[#EB5757]">
                  Unavailable
                </span>
              )}
            </div>
          </div>

          {/* Ingredients section */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-inter-semibold text-[#1A1A1A]">
                Ingredients
              </h4>

              {hasLowStockIngredients && (
                <span className="bg-[#F9FAFB] text-[#EB5757] px-2 py-0.5 rounded-full text-xs font-inter-semibold border border-[#EB5757]">
                  Low Stock Ingredients
                </span>
              )}
            </div>

            {!item.ingredients || item.ingredients.length === 0 ? (
              <p className="text-[#4D4D4D] text-sm italic">
                No ingredients data
              </p>
            ) : (
              <div className="bg-[#e6f9f0] p-3 rounded-xl border border-[#E0E0E0]">
                <ul className="divide-y divide-[#E0E0E0]">
                  {item.ingredients.map((ing) => {
                    const inventoryItem = getIngredientDetails(
                      ing.inventoryItemId,
                    )
                    const isLowStock =
                      inventoryItem &&
                      inventoryItem.quantity <= inventoryItem.reorderPoint

                    return (
                      <li
                        key={ing.inventoryItemId}
                        className="py-2 flex justify-between items-center"
                      >
                        <div>
                          <span className="font-inter-semibold text-[#1A1A1A]">
                            {ing.inventoryItemName}
                          </span>
                          <p className="text-sm text-[#4D4D4D]">
                            {ing.quantity} {ing.unit} per serving
                          </p>
                        </div>

                        {inventoryItem && (
                          <div className="text-right">
                            <div
                              className={`text-sm font-inter-semibold ${isLowStock ? 'text-[#EB5757]' : 'text-[#04B851]'}`}
                            >
                              Stock: {inventoryItem.quantity}{' '}
                              {inventoryItem.unit}
                            </div>
                            {isLowStock && (
                              <div className="text-xs text-[#EB5757] font-inter-semibold">
                                Below reorder point (
                                {inventoryItem.reorderPoint})
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Additional info */}
          <div className="text-sm text-[#4D4D4D] pt-4 border-t border-[#E0E0E0]">
            <p>Added: {formatDate(item.createdAt)}</p>
            <p>Last Updated: {formatDate(item.updatedAt)}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MenuItemDetailView
