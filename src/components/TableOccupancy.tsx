import React, { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
// Custom Tooltip for a modern, dashboard look (white background)
import type { TooltipProps } from 'recharts'
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent'

const CustomTooltip = (props: TooltipProps<ValueType, NameType>) => {
  // recharts types are wrong, payload and label are not in TooltipProps, but are passed at runtime
  const { active } = props
  type PayloadItem = { dataKey: string; value: number }
  // @ts-expect-error: recharts types are incomplete, payload and label exist at runtime
  const payload = (props.payload ?? []) as PayloadItem[]
  // @ts-expect-error: recharts types are incomplete, payload and label exist at runtime
  const label = props.label as string
  if (!active || !payload || !payload.length) return null
  const [occupied, available, reserved] = [
    payload.find((p) => p.dataKey === 'occupied'),
    payload.find((p) => p.dataKey === 'available'),
    payload.find((p) => p.dataKey === 'reserved'),
  ]
  return (
    <div
      style={{
        background: '#fff',

        borderRadius: 12,
        boxShadow: '0 2px 12px 0 rgba(255, 215, 64, 0.10)',
        padding: '16px 20px',
        minWidth: 140,
        color: '#1e293b',
        fontFamily: 'inherit',
        transition: 'box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 2,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {occupied && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: 3,
                background: barFills[0],
                display: 'inline-block',
                border: '1.5px solid #ffe082',
                marginRight: 2,
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 14 }}>Occupied</span>
            <span style={{ fontWeight: 700, fontSize: 15, marginLeft: 'auto' }}>
              {occupied.value}
            </span>
          </span>
        )}
        {available && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: 3,
                background: barFills[2],
                display: 'inline-block',
                border: '1.5px solid #ffd54f',
                marginRight: 2,
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 14 }}>Available</span>
            <span style={{ fontWeight: 700, fontSize: 15, marginLeft: 'auto' }}>
              {available.value}
            </span>
          </span>
        )}
        {reserved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: 3,
                background: barFills[4],
                display: 'inline-block',
                border: '1.5px solid #ffc300',
                marginRight: 2,
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 14 }}>Reserved</span>
            <span style={{ fontWeight: 700, fontSize: 15, marginLeft: 'auto' }}>
              {reserved.value}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

// Dashboard yellow palette
const barFills = [
  '#fff9c4', // light yellow
  '#ffe082', // pale yellow
  '#ffd54f', // soft yellow
  '#ffeb3b', // bright yellow
  '#ffc300', // golden yellow
  '#ffb300', // deep yellow
  '#ffa000', // darker yellow
]

interface TableOccupancyProps {
  timeRange: 'daily' | 'weekly' | 'monthly'
}

const TableOccupancy: React.FC<TableOccupancyProps> = ({ timeRange }) => {
  interface OccupancyData {
    name: string
    occupied: number
    available: number
    reserved: number
  }

  const [data, setData] = useState<OccupancyData[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    setLoading(true)
    fetch(`/api/tables/occupancy?range=${timeRange}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch occupancy data')
        const result = await res.json()
        // Expecting result.data: [{ name, occupied, available, reserved }]
        setData(result.data || [])
      })
      .catch((err) => {
        setData([])
        console.error('Error fetching occupancy data:', err)
      })
      .finally(() => setLoading(false))
  }, [timeRange])
  return (
    <div className="w-full h-full min-h-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold mb-4">
        Table Occupancy{' '}
        {timeRange === 'daily'
          ? 'Today'
          : timeRange === 'weekly'
            ? 'This Week'
            : 'This Month'}
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-[250px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: 250 }}>
          {/* Custom Legend with colored squares, absolutely positioned above chart */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              display: 'flex',
              gap: 24,
              marginBottom: 8,
              marginTop: 0,
              alignItems: 'center',
              paddingLeft: 24,
              zIndex: 2,
              background: 'white',
              height: 32,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: barFills[0],
                  display: 'inline-block',
                  border: '1px solid #e2e8f0',
                }}
              />
              <span style={{ fontWeight: 500, color: '#1e293b' }}>
                Occupied
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: barFills[2],
                  display: 'inline-block',
                  border: '1px solid #e2e8f0',
                }}
              />
              <span style={{ fontWeight: 500, color: '#1e293b' }}>
                Available
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: barFills[4],
                  display: 'inline-block',
                  border: '1px solid #e2e8f0',
                }}
              />
              <span style={{ fontWeight: 500, color: '#1e293b' }}>
                Reserved
              </span>
            </span>
          </div>
          <div
            className="mt-5"
            style={{
              position: 'absolute',
              top: 32,
              left: 0,
              width: '100%',
              height: 218,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 0,
                  right: 30,
                  left: 5,
                  bottom: 5,
                }}
              >
                {/* No grid lines for a clean look */}
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={(props) => {
                    const { x, y, payload } = props
                    // const idx = data.findIndex((d) => d.name === payload.value)
                    // const fill = barFills[idx % barFills.length]
                    return (
                      <text
                        x={x}
                        y={y + 10}
                        textAnchor="middle"
                        fill="#64748b"
                        fontWeight={500}
                        fontSize={15}
                        fontFamily="inherit"
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <YAxis
                  tickFormatter={(value) => {
                    // Remove any dash, period, or unwanted character
                    return String(value).replace(/[-.]/g, '')
                  }}
                  tick={{ fill: '#64748b' }}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: '#fffde7', opacity: 0.7 }}
                />
                <Bar radius={[5, 5, 0, 0]} dataKey="occupied" name="Occupied">
                  {data.map((entry, idx) => (
                    <Cell
                      key={`occupied-${idx}`}
                      fill={barFills[idx % barFills.length]}
                    />
                  ))}
                </Bar>
                <Bar radius={[5, 5, 0, 0]} dataKey="available" name="Available">
                  {data.map((entry, idx) => (
                    <Cell
                      key={`available-${idx}`}
                      fill={barFills[(idx + 2) % barFills.length]}
                    />
                  ))}
                </Bar>
                <Bar radius={[5, 5, 0, 0]} dataKey="reserved" name="Reserved">
                  {data.map((entry, idx) => (
                    <Cell
                      key={`reserved-${idx}`}
                      fill={barFills[(idx + 4) % barFills.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default TableOccupancy
