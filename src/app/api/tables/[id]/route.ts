/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Table } from '@/models/Table'

// GET /api/tables/[id] - Get a specific table
// @ts-ignore
export async function GET(request, params) {
  await connectDB()
  try {
    const { id } = params.params
    const table = await Table.findById(id)

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({ table })
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 },
    )
  }
}

// PUT /api/tables/[id] - Update a table
// @ts-ignore
export async function PUT(request, params) {
  await connectDB()
  try {
    const { id } = params.params
    const data = await request.json()

    // Check if table exists
    const existingTable = await Table.findById(id)
    if (!existingTable) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // If table number is changing, check for duplicates
    if (data.number && data.number !== existingTable.number) {
      const duplicateTable = await Table.findOne({ number: data.number })
      if (duplicateTable) {
        return NextResponse.json(
          {
            error: 'A table with this number already exists',
          },
          { status: 409 },
        )
      }
    }

    // If status is changing, push to statusHistory
    let updateObj = { ...data, updatedAt: new Date() }
    if (data.status && data.status !== existingTable.status) {
      updateObj = {
        ...updateObj,
        $push: {
          statusHistory: {
            status: data.status,
            timestamp: new Date(),
          },
        },
      }
    }

    // Use findByIdAndUpdate with $push if status changed
    const updatedTable = await Table.findByIdAndUpdate(id, updateObj, {
      new: true,
    })

    return NextResponse.json({ table: updatedTable })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 },
    )
  }
}

// DELETE /api/tables/[id] - Delete a table
// @ts-ignore
export async function DELETE(request, params) {
  await connectDB()
  try {
    const { id } = params.params
    const deletedTable = await Table.findByIdAndDelete(id)

    if (!deletedTable) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Table deleted successfully' })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 },
    )
  }
}
