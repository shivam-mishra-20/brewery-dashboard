import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Table } from '@/models/Table'

// Helper to get day names for weekly chart
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'weekly'

    // Fetch all tables
    const tables = await Table.find({})

    // Helper to get the status of a table as of a given date
    function getStatusAsOf(
      history: { status: string; timestamp: Date }[] = [],
      asOf: Date,
    ): string | null {
      // Find the latest status change before or at 'asOf'
      const sorted = [...(history || [])].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      let lastStatus = null
      for (const entry of sorted) {
        if (new Date(entry.timestamp).getTime() <= asOf.getTime()) {
          lastStatus = entry.status
        } else {
          break
        }
      }
      return lastStatus
    }

    let data = []
    const now = new Date()

    if (range === 'daily') {
      // For today, use the latest status as of now, fallback to current status if no history
      let occupied = 0,
        available = 0,
        reserved = 0
      for (const t of tables) {
        let status = getStatusAsOf(t.statusHistory, now)
        if (status === null || status === undefined) {
          status = t.status // fallback to current status if no history
        }
        if (status === 'occupied') occupied++
        if (status === 'available') available++
        if (status === 'reserved') reserved++
      }
      data = [{ name: 'Today', occupied, available, reserved }]
    } else if (range === 'weekly') {
      // For each day in the last 7 days, aggregate status
      data = weekDays.map((day, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - (6 - i)) // Mon is 6 days ago, Sun is today
        d.setHours(23, 59, 59, 999)
        let occupied = 0,
          available = 0,
          reserved = 0
        for (const t of tables) {
          const status = getStatusAsOf(t.statusHistory, d)
          if (status === 'occupied') occupied++
          if (status === 'available') available++
          if (status === 'reserved') reserved++
        }
        return { name: day, occupied, available, reserved }
      })
    } else {
      // Monthly: 4 weeks, aggregate as of each week's end (Sun)
      data = Array.from({ length: 4 }, (_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - (21 - i * 7)) // 3 weeks ago, 2, 1, this week
        d.setHours(23, 59, 59, 999)
        let occupied = 0,
          available = 0,
          reserved = 0
        for (const t of tables) {
          const status = getStatusAsOf(t.statusHistory, d)
          if (status === 'occupied') occupied++
          if (status === 'available') available++
          if (status === 'reserved') reserved++
          // If status is null, do not increment any count
        }
        return { name: `Week ${i + 1}`, occupied, available, reserved }
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error aggregating occupancy:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate occupancy' },
      { status: 500 },
    )
  }
}
