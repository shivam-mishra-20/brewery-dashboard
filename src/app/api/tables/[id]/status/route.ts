/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Table } from '@/models/Table'

// PATCH /api/tables/[id]/status - Update a table's status
// @ts-ignore - Bypass Next.js type checking issues with dynamic routes
export async function PATCH(req, params) {
  await connectDB()
  try {
    const { id } = params.params
    const { status } = await req.json()

    if (
      !status ||
      !['available', 'occupied', 'reserved', 'maintenance'].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            'Valid status is required (available, occupied, reserved, or maintenance)',
        },
        { status: 400 },
      )
    }

    const table = await Table.findById(id)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    if (table.status !== status) {
      table.status = status
      table.updatedAt = new Date()
      table.statusHistory.push({ status, timestamp: new Date() })
      await table.save()
    } else {
      // No change, just update updatedAt
      table.updatedAt = new Date()
      await table.save()
    }

    return NextResponse.json({
      message: 'Table status updated successfully',
      table,
    })
  } catch (error) {
    console.error('Error updating table status:', error)
    return NextResponse.json(
      { error: 'Failed to update table status' },
      { status: 500 },
    )
  }
}
