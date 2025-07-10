import React from 'react'
import { FaPlus } from 'react-icons/fa'

interface DashboardHeaderProps {
  title: string
  subtitle: string
  onAddTable?: () => void
  onExportData?: () => void
  addLabel?: string
  exportLabel?: string
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onAddTable,
  onExportData,
  addLabel = 'Add Table',
  exportLabel = 'Export Data',
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-0 justify-between w-full items-center text-center md:text-left">
      <div className="flex flex-col w-full items-center md:items-start justify-start gap-2">
        <h1 className="md:text-4xl text-2xl font-inter-semibold">{title}</h1>
        <h1 className="md:text-sm text-xs max-w-4xl w-full font-inter-regular text-gray-600">
          {subtitle}
        </h1>
      </div>
      <div className="flex flex-row w-full md:w-auto justify-center md:justify-end items-center gap-5">
        <button
          className="text-white flex-nowrap whitespace-nowrap flex items-center justify-center gap-3 text-sm bg-gradient-to-tr from-secondary to-primary shadow-white/[.4] border border-primary/[0.1] shadow-inner py-2.5 rounded-2xl px-5"
          onClick={onAddTable}
        >
          <FaPlus /> {addLabel}
        </button>
        <button
          className="text-secondary flex-nowrap whitespace-nowrap flex items-center justify-center gap-3 text-sm bg-transparent shadow-white/[.4] border-2 border-secondary shadow-inner py-2.5 rounded-2xl px-5"
          onClick={onExportData}
        >
          {exportLabel}
        </button>
      </div>
    </div>
  )
}

export default DashboardHeader
