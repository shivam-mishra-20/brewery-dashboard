/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Table } from '@/models/Table'

// QR Code generation will happen on the client side

// POST /api/tables/[id]/qr - Generate and save QR code for a table
// @ts-ignore - Bypass Next.js type checking issues with dynamic routes
export async function POST(req, { params }) {
  await connectDB()
  try {
    const { id } = params
    const { qrCode } = await req.json()

    if (!qrCode) {
      return NextResponse.json(
        {
          error: 'QR code data is required',
        },
        { status: 400 },
      )
    }

    const table = await Table.findById(id)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    table.qrCode = qrCode
    table.updatedAt = new Date()
    await table.save()

    return NextResponse.json({
      message: 'QR code updated successfully',
      table,
    })
  } catch (error) {
    console.error('Error updating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to update QR code' },
      { status: 500 },
    )
  }
}
