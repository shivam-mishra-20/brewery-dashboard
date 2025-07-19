'use client'

import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// const data = [
//   { month: 'Jan', sales: 120 },
//   { month: 'Feb', sales: 150 },
//   { month: 'Mar', sales: 170 },
//   { month: 'Apr', sales: 140 },
//   { month: 'May', sales: 200 },
//   { month: 'Jun', sales: 220 },
//   { month: 'Jul', sales: 210 },
//   { month: 'Aug', sales: 230 },
//   { month: 'Sep', sales: 190 },
//   { month: 'Oct', sales: 175 },
//   { month: 'Nov', sales: 160 },
//   { month: 'Dec', sales: 185 },
// ]

type DashboardLineChartProps = {
  data: Array<{ month: string; sales: number }>
  color?: string
  label?: string
}

const DashboardLineChart: React.FC<DashboardLineChartProps> = ({
  data,
  color = '#ffc300',
  label = 'Monthly Sales Trend',
}) => (
  <div className="w-full px-5 h-full flex flex-col items-start justify-center">
    <h1 className="text-lg font-inter-semibold text-black mb-2">{label}</h1>
    <ResponsiveContainer width="100%" height="80%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f3f4f6"
        />
        <XAxis
          dataKey="month"
          tick={{ fill: '#6b7280', fontSize: 14, fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
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
            color: color,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
          formatter={(value: number) => {
            // Extract what we're displaying from the label, or default to "Sales"
            const metric = label.includes('Revenue')
              ? 'Revenue'
              : label.includes('Sales')
                ? 'Sales'
                : 'Value'
            return [`${value}`, metric]
          }}
        />
        <Line
          type="monotone"
          dataKey="sales"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 5, fill: '#fff', stroke: color, strokeWidth: 2 }}
          activeDot={{ r: 7, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

export default DashboardLineChart
