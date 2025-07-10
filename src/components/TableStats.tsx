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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statsItems.map((stat, index) => (
        <div
          key={index}
          className={
            index === 0
              ? 'gap-3 sm:gap-5 bg-gradient-to-bl from-primary to-secondary text-white p-3 sm:p-5 rounded-2xl shadow-inner shadow-white/[.4] flex flex-col items-start justify-center border-2 border-primary/30 overflow-hidden col-span-2 sm:col-span-1'
              : 'gap-3 sm:gap-5 bg-white p-3 sm:p-5 rounded-2xl flex flex-col items-start justify-center'
          }
        >
          <p
            className={`${index === 0 ? 'text-white/90' : 'text-black'} flex items-center justify-between w-full text-sm sm:text-md md:text-lg`}
          >
            <span className="text-xs sm:text-sm md:text-base">{stat.header}</span>
            {index === 0 ? (
              <BsArrowUpRightCircleFill className="text-xl sm:text-2xl md:text-3xl" />
            ) : (
              <BsArrowUpRightCircle className="text-xl sm:text-2xl md:text-3xl" />
            )}
          </p>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold">
            {stat.value}
          </h2>
          <span
            className={
              index === 0 ? 'text-xs sm:text-sm text-white/80' : 'text-xs sm:text-sm text-[#ffc300]'
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
