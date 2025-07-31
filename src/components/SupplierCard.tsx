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
      className={`bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E0E0E0] p-4 relative ${
        !supplier.isActive ? 'opacity-70' : ''
      }`}
    >
      {!supplier.isActive && (
        <div className="absolute top-3 right-3 bg-[#F9FAFB] text-[#EB5757] text-xs font-inter-semibold px-2 py-1 rounded-md border border-[#EB5757]">
          Inactive
        </div>
      )}

      <h3 className="text-lg font-inter-semibold text-[#1A1A1A] mb-2">
        {supplier.name}
      </h3>

      <div className="text-sm text-[#4D4D4D] mb-1">
        Contact: {supplier.contactPerson}
      </div>

      <div className="flex items-center text-sm text-[#4D4D4D] mb-1">
        <MdEmail className="mr-1 text-[#04B851]" /> {supplier.email}
      </div>

      <div className="flex items-center text-sm text-[#4D4D4D] mb-2">
        <MdPhone className="mr-1 text-[#04B851]" /> {supplier.phone}
      </div>

      <div className="text-xs text-[#4D4D4D] mb-4 line-clamp-2">
        {supplier.address}
      </div>

      {supplier.notes && (
        <div className="text-xs text-[#4D4D4D] italic mb-4 line-clamp-2">
          {supplier.notes}
        </div>
      )}

      <div className="flex justify-end mt-2">
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4D4D4D]">Delete supplier?</span>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs bg-[#e6f9f0] text-[#04B851] px-2 py-1 rounded-xl hover:bg-[#04B851] hover:text-white font-inter-semibold border border-[#04B851]"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="text-xs bg-[#EB5757] text-white px-2 py-1 rounded-xl hover:bg-[#B71C1C] flex items-center gap-1 font-inter-semibold border border-[#EB5757]"
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
              className="text-[#04B851] hover:text-[#039f45] mr-3 font-inter-semibold"
              title="Edit supplier"
            >
              <AiOutlineEdit size={18} />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-[#EB5757] hover:text-[#B71C1C] font-inter-semibold"
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
