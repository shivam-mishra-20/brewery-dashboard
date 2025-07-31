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
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 2px 12px 0 rgba(4, 184, 81, 0.10)',
        padding: '16px 20px',
        minWidth: 140,
        color: '#1A1A1A',
        fontFamily: 'inherit',
        transition: 'box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        border: '1px solid #E0E0E0',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 2,
          letterSpacing: 0.2,
          color: '#04B851',
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
                border: '1.5px solid #04B851',
                marginRight: 2,
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 14, color: '#04B851' }}>
              Occupied
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginLeft: 'auto',
                color: '#1A1A1A',
              }}
            >
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
                border: '1.5px solid #039f45',
                marginRight: 2,
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 14, color: '#039f45' }}>
              Available
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginLeft: 'auto',
                color: '#1A1A1A',
              }}
            >
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
                border: '1.5px solid #F2C94C',
                marginRight: 2,
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 14, color: '#F2C94C' }}>
              Reserved
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginLeft: 'auto',
                color: '#1A1A1A',
              }}
            >
              {reserved.value}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

// Green palette for chart bars
const barFills = [
  '#04B851', // brand green
  '#039f45', // green hover
  '#e6f9f0', // primary light
  '#2ECC71', // success
  '#F2C94C', // warning
  '#EB5757', // error
  '#4D4D4D', // text light
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
    fetch(`/api/tables/occupancy?range=${timeRange}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch occupancy data')
        const result = await res.json()
        let incoming = result.data || []
        // If the API returns table objects, map them to chart format
        if (
          incoming.length &&
          incoming[0] &&
          typeof incoming[0].status === 'string'
        ) {
          incoming = incoming.map((table: any) => ({
            name: table.name,
            occupied: table.status === 'occupied' ? 1 : 0,
            available: table.status === 'available' ? 1 : 0,
            reserved: table.status === 'reserved' ? 1 : 0,
          }))
        }
        setData(incoming)
      })
      .catch((err) => {
        setData([])
        console.error('Error fetching occupancy data:', err)
      })
      .finally(() => setLoading(false))
  }, [timeRange])
  return (
    <div className="w-full h-full min-h-[300px] rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] p-4 shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-[#04B851]">
        Table Occupancy{' '}
        {timeRange === 'daily'
          ? 'Today'
          : timeRange === 'weekly'
            ? 'This Week'
            : 'This Month'}
      </h3>

      {loading ? (
        <div className="flex justify-center items-center h-[250px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#04B851]"></div>
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
              background: '#FFFFFF',
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
                  border: '1px solid #04B851',
                }}
              />
              <span style={{ fontWeight: 500, color: '#04B851' }}>
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
                  border: '1px solid #039f45',
                }}
              />
              <span style={{ fontWeight: 500, color: '#039f45' }}>
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
                  border: '1px solid #F2C94C',
                }}
              />
              <span style={{ fontWeight: 500, color: '#F2C94C' }}>
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
                    return (
                      <text
                        x={x}
                        y={y + 10}
                        textAnchor="middle"
                        fill="#4D4D4D"
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
                  tick={{ fill: '#4D4D4D' }}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: '#e6f9f0', opacity: 0.7 }}
                />
                <Bar radius={[5, 5, 0, 0]} dataKey="occupied" name="Occupied">
                  {data.map((entry, idx) => (
                    <Cell key={`occupied-${idx}`} fill={barFills[0]} />
                  ))}
                </Bar>
                <Bar radius={[5, 5, 0, 0]} dataKey="available" name="Available">
                  {data.map((entry, idx) => (
                    <Cell key={`available-${idx}`} fill={barFills[2]} />
                  ))}
                </Bar>
                <Bar radius={[5, 5, 0, 0]} dataKey="reserved" name="Reserved">
                  {data.map((entry, idx) => (
                    <Cell key={`reserved-${idx}`} fill={barFills[4]} />
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
