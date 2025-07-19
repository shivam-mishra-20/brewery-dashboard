import CryptoJS from 'crypto-js'
import { useSearchParams } from 'next/navigation'
import React from 'react'

const JWT_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'your-very-secret-key'

function decodeTableData(tabledata: string) {
  try {
    const decoded = decodeURIComponent(tabledata)
    const bytes = CryptoJS.AES.decrypt(decoded, JWT_SECRET)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

export default function StatusBar({
  onSortClick,
}: {
  onSortClick?: () => void
}) {
  const searchParams = useSearchParams()
  const tabledata = searchParams.get('tabledata')
  const tableInfo = tabledata ? decodeTableData(tabledata) : null

  return (
    <div className="relative min-w-[320px] pt-6 px-5 shadow-[0_4px_16px_rgba(0,0,0,0.07)] bg-gradient-to-b from-[#454545] to-[#888888] font-inter text-white">
      {/* Location and Table Number */}
      <div className="flex justify-between mb-8">
        <div>
          <div className="text-xs text-[#d3d3d3]">Location</div>
          <div className="font-bold text-lg text-white">
            {tableInfo?.location || 'Work Brew'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#d3d3d3]">Table Number:</div>
          <div className="font-bold text-lg text-white">
            {tableInfo?.number || '002'}
          </div>
        </div>
      </div>
      {/* Search Bar with Sort Button - styled and logic from status-bar-menu */}
      <div className="relative left-0 right-0 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.10)] flex items-center px-4 py-4 h-14 font-inter mt-10 mb-4 z-10">
        {/* Search Icon (SVG) */}
        <span className="text-2xl text-[#222] flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="14" cy="14" r="9" stroke="#222" strokeWidth="2" />
            <line
              x1="21.5"
              y1="21.5"
              x2="24"
              y2="24"
              stroke="#111"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search"
          className="border-none outline-none flex-1 text-lg bg-transparent text-[#888888] font-inter placeholder:text-[#bdbdbd] text-start"
          style={{ fontFamily: 'inherit' }}
        />
        <button
          className="bg-[#FFE066] border-none rounded-xl w-12 h-12 -ml-4 flex items-center justify-center p-2 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.10)]"
          onClick={onSortClick}
          aria-label="Sort"
        >
          {/* Sort icon (SVG) */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <g>
              <rect x="8" y="11" width="16" height="2" rx="1" fill="#fff" />
              <rect x="8" y="19" width="16" height="2" rx="1" fill="#fff" />
              <circle
                cx="12"
                cy="12"
                r="2"
                fill="#fff"
                stroke="#fff"
                strokeWidth="1"
              />
              <circle
                cx="20"
                cy="20"
                r="2"
                fill="#fff"
                stroke="#fff"
                strokeWidth="1"
              />
            </g>
          </svg>
        </button>
      </div>
    </div>
  )
}
