import { motion } from 'framer-motion'
import React from 'react'

interface Table {
  _id: string
  name: string
  number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  location?: string
}

interface TableFloorPlanProps {
  tables: Table[]
  onTableClick: (table: Table) => void
}

const TableFloorPlan: React.FC<TableFloorPlanProps> = ({
  tables,
  onTableClick,
}) => {
  // Group tables by location
  const tablesByLocation: Record<string, Table[]> = tables.reduce(
    (acc, table) => {
      const location = table.location || 'Main Floor'
      if (!acc[location]) {
        acc[location] = []
      }
      acc[location].push(table)
      return acc
    },
    {} as Record<string, Table[]>,
  )

  // Sort locations with "Main Floor" first
  const locations = Object.keys(tablesByLocation).sort((a, b) => {
    if (a === 'Main Floor') return -1
    if (b === 'Main Floor') return 1
    return a.localeCompare(b)
  })

  // Dashboard yellow palette for status
  // available: light yellow, occupied: golden yellow, reserved: deep yellow, maintenance: gray
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-[#fff9c4] text-slate-800 border border-[#ffe082]'
      case 'occupied':
        return 'bg-[#ffc300] text-slate-900 border border-[#ffd54f]'
      case 'reserved':
        return 'bg-[#ffb300] text-slate-900 border border-[#ffeb3b]'
      case 'maintenance':
        return 'bg-gray-200 text-slate-400 border border-gray-300'
      default:
        return 'bg-gray-100 text-slate-400 border border-gray-200'
    }
  }

  // Get shape by capacity
  const getTableShape = (capacity: number) => {
    if (capacity <= 2) {
      return 'rounded-full' // Circle for small tables
    } else if (capacity <= 4) {
      return 'rounded-lg' // Rounded square for medium tables
    } else {
      return 'rounded-xl' // Rounded rectangle for large tables
    }
  }

  // Get size by capacity
  const getTableSize = (capacity: number): string => {
    if (capacity <= 2) {
      return 'w-16 h-16'
    } else if (capacity <= 4) {
      return 'w-20 h-20'
    } else if (capacity <= 6) {
      return 'w-24 h-20'
    } else {
      return 'w-28 h-20'
    }
  }

  return (
    <div
      className="w-full rounded-xl border border-slate-200 bg-white overflow-auto p-4 shadow-sm min-h-[300px]"
      style={{ height: 350 }}
    >
      <h3 className="text-lg font-bold mb-4">Floor Plan</h3>

      <div
        className="flex flex-row gap-8 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {locations.map((location) => (
          <div
            key={location}
            className="min-w-[320px] max-w-[400px] flex-shrink-0 mb-2"
          >
            <h4 className="text-md font-semibold mb-2 text-slate-700 text-center">
              {location}
            </h4>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex flex-row w-full gap-6 p-4 justify-center">
                {tablesByLocation[location].map((table) => (
                  <motion.div
                    key={table._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTableClick(table)}
                    className={`${getTableSize(table.capacity)} ${getTableShape(table.capacity)} ${getStatusColor(table.status)} flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-shadow`}
                  >
                    <div className="text-center text-gray-800">
                      <div className="font-bold">{table.number}</div>
                      <div className="text-xs">{table.capacity}p</div>
                    </div>
                  </motion.div>
                ))}

                {tablesByLocation[location].length === 0 && (
                  <p className="text-slate-500 italic">
                    No tables in this area
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="flex justify-center items-center h-40">
          <p className="text-slate-500">No tables to display</p>
        </div>
      )}

      {/* Legend - using dashboard yellow palette */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#fff9c4', borderColor: '#ffe082' }}
          ></div>
          <span className="text-xs text-slate-800">Available</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#ffc300', borderColor: '#ffd54f' }}
          ></div>
          <span className="text-xs text-slate-900">Occupied</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#ffb300', borderColor: '#ffeb3b' }}
          ></div>
          <span className="text-xs text-slate-900">Reserved</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#e5e7eb', borderColor: '#cbd5e1' }}
          ></div>
          <span className="text-xs text-slate-400">Maintenance</span>
        </div>
      </div>
    </div>
  )
}

export default TableFloorPlan
