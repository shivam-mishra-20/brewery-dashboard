import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Table } from '@/models/Table'

// GET /api/tables - Get all tables
export async function GET() {
  await connectDB()
  try {
    const tables = await Table.find().sort({ number: 1 })
    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 },
    )
  }
}

// POST /api/tables - Create a new table
export async function POST(req: Request) {
  await connectDB()
  try {
    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.number || !data.capacity) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, number, and capacity are required',
        },
        { status: 400 },
      )
    }

    // Check for duplicate table number
    const existingTable = await Table.findOne({ number: data.number })
    if (existingTable) {
      return NextResponse.json(
        {
          error: 'A table with this number already exists',
        },
        { status: 409 },
      )
    }

    const newTable = await Table.create(data)
    return NextResponse.json({ table: newTable }, { status: 201 })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 },
    )
  }
}
