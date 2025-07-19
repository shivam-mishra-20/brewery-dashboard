'use client'

import React from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

// const data = [
//   { day: 'S', value: 12, full: 'Sunday' },
//   { day: 'M', value: 10, full: 'Monday' },
//   { day: 'T', value: 8, full: 'Tuesday' },
//   { day: 'W', value: 15, full: 'Wednesday' },
//   { day: 'T', value: 7, full: 'Thursday' },
//   { day: 'F', value: 14, full: 'Friday' },
//   { day: 'S', value: 9, full: 'Saturday' },
// ]

const barFills = [
  '#fff9c4', // light yellow
  '#ffe082', // pale yellow
  '#ffd54f', // soft yellow
  '#ffeb3b', // bright yellow
  '#ffc300', // golden yellow
  '#ffb300', // deep yellow
  '#ffa000', // darker yellow
]

interface DashboardBarChartProps {
  data: Array<{ day: string; value: number; full: string }>
}

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({ data }) => (
  <div
    className="w-full h-full flex items-center justify-center"
    tabIndex={-1}
    style={{ outline: 'none' }}
    onMouseDown={(e) => e.preventDefault()}
  >
    <div className="flex flex-col justify-start w-full h-full">
      <h1 className="text-lg font-inter-semibold text-black">
        Weekly Sales Analytics
      </h1>
      <div className="w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="85%" height="100%">
          <BarChart data={data} barSize={48}>
            <defs>
              <pattern
                id="singleLine"
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
              >
                <rect x="0" y="0" width="6" height="6" fill="#ffc300" />
                <line
                  x1="0"
                  y1="6"
                  x2="6"
                  y2="0"
                  stroke="#fffde7"
                  strokeWidth="1.5"
                />
              </pattern>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 14, fontFamily: 'inherit' }} // Tailwind's text-gray-500
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{
                borderRadius: 12,
                background: '#fff',
                border: '1px solid #eee',
                color: '#333',
                fontFamily: 'inherit',
                fontSize: 14,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
              }}
              labelStyle={{
                color: '#ffc300',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
              formatter={(value) => {
                // Find the full day name for the hovered bar
                const entry = data.find((d) => d.value === value)
                return [`${value}`, entry ? entry.full : 'Visitors']
              }}
            />
            <Bar dataKey="value" radius={[25, 25, 25, 25]}>
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={
                    idx === 2 || idx === 3 || idx === 4
                      ? 'url(#singleLine)'
                      : barFills[idx % barFills.length]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)

export default DashboardBarChart
