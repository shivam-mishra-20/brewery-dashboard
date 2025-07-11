import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import {
  BsArrowUpCircleFill,
  BsBellFill,
  BsPencilSquare,
  BsTrash,
} from 'react-icons/bs'
import { TbRefresh } from 'react-icons/tb'
import { InventoryItem } from '@/models/InventoryItem'

interface InventoryItemCardProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (id: string) => void
  onRestock: (id: string, quantity: number) => void
  onAutoReorder?: (item: InventoryItem) => void
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onRestock,
  onAutoReorder,
}) => {
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [restockAmount, setRestockAmount] = useState('0')

  const isLowStock = item.quantity <= item.reorderPoint

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(restockAmount)
    if (amount > 0) {
      onRestock(item.id, amount)
      setIsRestockModalOpen(false)
      setRestockAmount('0')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-inter-semibold text-lg text-black">
            {item.name}
          </h3>
          {isLowStock && (
            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
              Low Stock
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-500">Quantity</p>
            <p
              className={`font-medium ${isLowStock ? 'text-red-600' : 'text-black'}`}
            >
              {item.quantity} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Cost Per Unit</p>
            <p className="font-medium text-black">
              ${item.costPerUnit.toFixed(2)}/{item.unit}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium text-black">{item.category}</p>
          </div>
          <div>
            <p className="text-gray-500">Reorder Point</p>
            <p className="font-medium text-black">
              {item.reorderPoint} {item.unit}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-4">
          Last Restocked: {formatDate(item.lastRestocked)}
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            <TbRefresh className="text-base" /> Restock
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-gray-600 hover:text-yellow-500 transition"
            >
              <BsPencilSquare />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-gray-600 hover:text-red-500 transition"
            >
              <BsTrash />
            </button>
            {onAutoReorder && (
              <button
                onClick={() => onAutoReorder(item)}
                className={`p-1.5 transition ${
                  item.autoReorderNotify
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-600 hover:text-yellow-500'
                }`}
                title={
                  item.autoReorderNotify
                    ? 'Edit auto-reorder settings'
                    : 'Set up auto-reorder'
                }
              >
                <BsBellFill />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestockModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-5 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-inter-semibold mb-4">
                Restock {item.name}
              </h3>

              <form onSubmit={handleRestockSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Add Quantity ({item.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setIsRestockModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <BsArrowUpCircleFill /> Restock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default InventoryItemCard
