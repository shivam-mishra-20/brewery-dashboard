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

  // Green palette for status
  // available: brand green, occupied: green hover, reserved: warning, maintenance: error
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-[#e6f9f0] text-[#04B851] border border-[#04B851]'
      case 'occupied':
        return 'bg-[#04B851] text-white border border-[#039f45]'
      case 'reserved':
        return 'bg-[#F2C94C] text-[#1A1A1A] border border-[#E0E0E0]'
      case 'maintenance':
        return 'bg-[#EB5757] text-white border border-[#E0E0E0]'
      default:
        return 'bg-[#F9FAFB] text-[#4D4D4D] border border-[#E0E0E0]'
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
      className="w-full rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] overflow-auto p-4 shadow-sm min-h-[300px]"
      style={{ height: 350 }}
    >
      <h3 className="text-lg font-bold mb-4 text-[#04B851]">Floor Plan</h3>

      <div
        className="flex flex-row gap-8 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {locations.map((location) => (
          <div
            key={location}
            className="min-w-[320px] max-w-[400px] flex-shrink-0 mb-2"
          >
            <h4 className="text-md font-semibold mb-2 text-[#4D4D4D] text-center">
              {location}
            </h4>
            <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E0E0E0]">
              <div className="flex flex-row w-full gap-6 p-4 justify-center">
                {tablesByLocation[location].map((table) => (
                  <motion.div
                    key={table._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTableClick(table)}
                    className={`${getTableSize(table.capacity)} ${getTableShape(table.capacity)} ${getStatusColor(table.status)} flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-shadow`}
                  >
                    <div className="text-center">
                      <div className="font-bold text-[#1A1A1A]">
                        {table.number}
                      </div>
                      <div className="text-xs text-[#4D4D4D]">
                        {table.capacity}p
                      </div>
                    </div>
                  </motion.div>
                ))}

                {tablesByLocation[location].length === 0 && (
                  <p className="text-[#4D4D4D] italic">
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
          <p className="text-[#4D4D4D]">No tables to display</p>
        </div>
      )}

      {/* Legend - using green palette */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#e6f9f0', borderColor: '#04B851' }}
          ></div>
          <span className="text-xs text-[#04B851]">Available</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#04B851', borderColor: '#039f45' }}
          ></div>
          <span className="text-xs text-white bg-[#04B851] px-2 py-0.5 rounded">
            Occupied
          </span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#F2C94C', borderColor: '#E0E0E0' }}
          ></div>
          <span className="text-xs text-[#1A1A1A]">Reserved</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2 border"
            style={{ background: '#EB5757', borderColor: '#E0E0E0' }}
          ></div>
          <span className="text-xs text-white bg-[#EB5757] px-2 py-0.5 rounded">
            Maintenance
          </span>
        </div>
      </div>
    </div>
  )
}

export default TableFloorPlan
