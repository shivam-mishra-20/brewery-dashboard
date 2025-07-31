import React from 'react'
import { BsArrowUpRightCircle, BsArrowUpRightCircleFill } from 'react-icons/bs'

interface TableStatsProps {
  tables: {
    _id: string
    status: 'available' | 'occupied' | 'reserved' | 'maintenance'
    capacity: number
  }[]
}

const TableStats: React.FC<TableStatsProps> = ({ tables }) => {
  // Calculate stats
  const totalTables = tables.length
  const availableTables = tables.filter((t) => t.status === 'available').length
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length
  const reservedTables = tables.filter((t) => t.status === 'reserved').length
  const maintenanceTables = tables.filter(
    (t) => t.status === 'maintenance',
  ).length

  // Calculate total capacity
  const totalCapacity = tables.reduce((acc, table) => acc + table.capacity, 0)
  const availableCapacity = tables
    .filter((t) => t.status === 'available')
    .reduce((acc, table) => acc + table.capacity, 0)

  // Calculate occupancy rate
  //   const occupancyRate =
  //     totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

  // We'll use occupancyRate in a tooltip

  // Stats array for easier mapping
  const statsItems = [
    {
      header: 'Total Tables',
      value: totalTables,
      description: `${totalTables} seats available`,
    },
    {
      header: 'Available Tables',
      value: availableTables,
      description: `${availableCapacity} seats available`,
    },
    {
      header: 'Occupied Tables',
      value: occupiedTables,
      description: `${occupiedTables} tables currently in use`,
    },
    {
      header: 'Reserved Tables',
      value: reservedTables,
      description: `${reservedTables} tables reserved for later`,
    },
    {
      header: 'In Maintenance',
      value: maintenanceTables,
      description: `${maintenanceTables} tables currently unavailable`,
    },
    {
      header: 'Total Capacity',
      value: totalCapacity,
      description: `${totalCapacity} total seats in the café`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
      {statsItems.map((stat, index) => (
        <div
          key={index}
          className={
            index === 0
              ? 'gap-5 bg-gradient-to-bl from-[#04B851] to-[#039f45] text-white p-5 rounded-2xl shadow-inner shadow-[#e6f9f0]/[.4] flex flex-col items-start justify-center border-2 border-[#04B851]/30 overflow-hidden'
              : 'gap-5 bg-[#FFFFFF] p-5 rounded-2xl flex flex-col items-start justify-center border border-[#E0E0E0]'
          }
        >
          <p
            className={`${index === 0 ? 'text-white/90' : 'text-[#1A1A1A]'} flex items-center justify-between w-full text-md md:text-lg font-inter-semibold`}
          >
            {stat.header}
            {index === 0 ? (
              <BsArrowUpRightCircleFill className="text-3xl text-[#e6f9f0]" />
            ) : (
              <BsArrowUpRightCircle className="text-3xl text-[#04B851]" />
            )}
          </p>
          <h2
            className={`lg:text-5xl text-2xl md:text-4xl font-bold ${index === 0 ? 'text-white' : 'text-[#04B851]'}`}
          >
            {stat.value}
          </h2>
          <span
            className={
              index === 0 ? 'text-sm text-white/80' : 'text-sm text-[#4D4D4D]'
            }
          >
            {stat.description}
          </span>
        </div>
      ))}
    </div>
  )
}

export default TableStats
