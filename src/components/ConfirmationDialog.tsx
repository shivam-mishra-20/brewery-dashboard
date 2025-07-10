import { motion } from 'framer-motion'
import React from 'react'
import { BsExclamationTriangle, BsX } from 'react-icons/bs'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  cancelText?: string
  isLoading?: boolean
  danger?: boolean
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  isLoading = false,
  danger = false,
}) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {danger && <BsExclamationTriangle className="text-red-500" />}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700">{message}</p>

          <div className="flex justify-end mt-8 space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {cancelText}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl font-medium shadow-inner border ${
                danger
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-700/[0.1] shadow-white/[0.2]'
                  : 'bg-gradient-to-tr from-primary to-secondary text-white border-yellow-900/[0.1] shadow-white/[0.5]'
              } hover:scale-105 transition disabled:opacity-50`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ConfirmationDialog
