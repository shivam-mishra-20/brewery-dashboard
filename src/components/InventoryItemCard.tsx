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
      className="bg-[#FFFFFF] rounded-2xl overflow-hidden shadow-md border border-[#E0E0E0]"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-inter-semibold text-lg text-[#1A1A1A]">
            {item.name}
          </h3>
          {isLowStock && (
            <span className="px-2 py-1 text-xs font-semibold bg-[#e6f9f0] text-[#04B851] rounded-full border border-[#04B851]">
              Low Stock
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-[#4D4D4D]">Quantity</p>
            <p
              className={`font-medium ${isLowStock ? 'text-[#EB5757]' : 'text-[#1A1A1A]'}`}
            >
              {item.quantity} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-[#4D4D4D]">Cost Per Unit</p>
            <p className="font-medium text-[#1A1A1A]">
              ₹{item.costPerUnit.toFixed(2)}/{item.unit}
            </p>
          </div>
          <div>
            <p className="text-[#4D4D4D]">Category</p>
            <p className="font-medium text-[#1A1A1A]">{item.category}</p>
          </div>
          <div>
            <p className="text-[#4D4D4D]">Reorder Point</p>
            <p className="font-medium text-[#1A1A1A]">
              {item.reorderPoint} {item.unit}
            </p>
          </div>
        </div>

        <div className="text-xs text-[#4D4D4D] mb-4">
          Last Restocked: {formatDate(item.lastRestocked)}
        </div>

        <div className="flex justify-between items-center border-t border-[#E0E0E0] pt-4">
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#e6f9f0] text-[#04B851] rounded-lg hover:bg-[#04B851] hover:text-white transition border border-[#04B851]"
          >
            <TbRefresh className="text-base" /> Restock
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-[#04B851] hover:text-[#039f45] transition"
            >
              <BsPencilSquare />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-[#EB5757] hover:text-[#B71C1C] transition"
            >
              <BsTrash />
            </button>
            {onAutoReorder && (
              <button
                onClick={() => onAutoReorder(item)}
                className={`p-1.5 transition ${
                  item.autoReorderNotify
                    ? 'text-[#F2C94C] hover:text-[#F2C94C]'
                    : 'text-[#04B851] hover:text-[#039f45]'
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
              className="bg-[#FFFFFF] rounded-2xl p-5 max-w-md w-full mx-4 border border-[#E0E0E0]"
            >
              <h3 className="text-xl font-inter-semibold mb-4 text-[#1A1A1A]">
                Restock {item.name}
              </h3>

              <form onSubmit={handleRestockSubmit}>
                <div className="mb-4">
                  <label className="block text-[#4D4D4D] text-sm font-medium mb-2">
                    Add Quantity ({item.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="w-full p-2 border border-[#E0E0E0] rounded-xl focus:ring-2 focus:ring-[#e6f9f0] focus:border-transparent outline-none text-[#1A1A1A] bg-[#F9FAFB]"
                    required
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setIsRestockModalOpen(false)}
                    className="px-4 py-2 text-[#4D4D4D] hover:text-[#1A1A1A] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#04B851] text-white rounded-lg hover:bg-[#039f45] transition flex items-center gap-2 font-inter-semibold"
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
