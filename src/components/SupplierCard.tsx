import { useState } from 'react'
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai'
import { MdEmail, MdPhone } from 'react-icons/md'
import { TbLoader3 } from 'react-icons/tb'
import { Supplier } from '@/services/inventoryService'

interface SupplierCardProps {
  supplier: Supplier
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative ${
        !supplier.isActive ? 'opacity-70' : ''
      }`}
    >
      {!supplier.isActive && (
        <div className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-md">
          Inactive
        </div>
      )}

      <h3 className="text-lg font-inter-semibold text-gray-800 mb-2">
        {supplier.name}
      </h3>

      <div className="text-sm text-gray-600 mb-1">
        Contact: {supplier.contactPerson}
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-1">
        <MdEmail className="mr-1" /> {supplier.email}
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-2">
        <MdPhone className="mr-1" /> {supplier.phone}
      </div>

      <div className="text-xs text-gray-500 mb-4 line-clamp-2">
        {supplier.address}
      </div>

      {supplier.notes && (
        <div className="text-xs text-gray-500 italic mb-4 line-clamp-2">
          {supplier.notes}
        </div>
      )}

      <div className="flex justify-end mt-2">
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Delete supplier?</span>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center gap-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <TbLoader3 className="animate-spin" size={12} /> Deleting...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-700 mr-3"
              title="Edit supplier"
            >
              <AiOutlineEdit size={18} />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-500 hover:text-red-700"
              title="Delete supplier"
            >
              <AiOutlineDelete size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SupplierCard
