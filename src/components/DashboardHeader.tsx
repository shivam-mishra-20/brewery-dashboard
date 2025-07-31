import React from 'react'

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

  onExportData,

  exportLabel = 'Export Data',
}) => {
  return (
    <div className="flex bg-transparent pt-2 rounded-2xl flex-col md:flex-row gap-3 md:gap-0 justify-between w-full items-center text-center md:text-left">
      <div className="flex flex-col w-full items-center md:items-start justify-start gap-2">
        <h1 className="md:text-4xl text-2xl font-inter-semibold text-[#1A1A1A]">
          {title}
        </h1>
        <h1 className="md:text-sm text-xs max-w-4xl w-full font-inter-regular text-[#4D4D4D]">
          {subtitle}
        </h1>
      </div>
      <div className="flex flex-row w-full md:w-auto justify-center md:justify-end items-center gap-5">
        {/* <button
          className="text-white flex-nowrap whitespace-nowrap flex items-center justify-center gap-3 text-sm bg-gradient-to-tr from-[#04B851] to-[#039f45] shadow-white/[.4] border border-[#04B851]/[0.1] shadow-inner py-2.5 rounded-2xl px-5 hover:bg-[#039f45] focus:ring-2 focus:ring-[#e6f9f0]"
          onClick={onAddTable}
        >
          <FaPlus /> {addLabel}
        </button> */}
        <button
          className="text-white flex-nowrap whitespace-nowrap flex items-center justify-center gap-3 text-sm bg-gradient-to-tr from-[#04B851] to-[#039f45] shadow-white/[.4] border border-[#04B851]/[0.1] shadow-inner py-2.5 rounded-2xl px-5 hover:bg-[#039f45] focus:ring-2 focus:ring-[#e6f9f0]"
          onClick={onExportData}
        >
          {exportLabel}
        </button>
      </div>
    </div>
  )
}

export default DashboardHeader
