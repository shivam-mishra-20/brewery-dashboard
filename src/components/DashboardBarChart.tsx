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
  '#e6f9f0', // primary light
  '#b2f2d7', // lighter green
  '#04B851', // brand green
  '#039f45', // primary hover
  '#2ECC71', // success
  '#A7E9C3', // soft green
  '#4D4D4D', // text light
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
      <h1 className="text-lg font-inter-semibold text-[#04B851]">
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
                <rect x="0" y="0" width="6" height="6" fill="#e6f9f0" />
                <line
                  x1="0"
                  y1="6"
                  x2="6"
                  y2="0"
                  stroke="#04B851"
                  strokeWidth="1.5"
                />
              </pattern>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#04B851',
                fontSize: 14,
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(4,184,81,0.08)' }}
              contentStyle={{
                borderRadius: 12,
                background: '#e6f9f0',
                border: '1px solid #04B851',
                color: '#1A1A1A',
                fontFamily: 'inherit',
                fontSize: 14,
                boxShadow: '0 2px 8px 0 rgba(4,184,81,0.08)',
              }}
              labelStyle={{
                color: '#04B851',
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
