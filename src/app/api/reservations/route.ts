import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB, disconnectDB } from '@/lib/mongodb'
import { Reservation } from '@/models/Reservation'

// Get Table model
// Since the Table model is defined in another file, we need to get it from mongoose
const Table = mongoose.models.Table

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const tableId = searchParams.get('tableId')
    const date = searchParams.get('date')

    // Build query
    const query: Record<string, unknown> = {}
    if (tableId) query.tableId = tableId
    if (date) {
      // If a date is provided, find reservations for that day
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      query.reservationDate = {
        $gte: startDate,
        $lte: endDate,
      }
    }

    // Get reservations based on query
    const reservations = await Reservation.find(query)
      .sort({ reservationDate: 1 })
      .populate('tableId', 'tableNumber capacity location')

    return NextResponse.json(
      { success: true, data: reservations },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservations' },
      { status: 500 },
    )
  } finally {
    await disconnectDB()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      duration,
      specialRequests,
    } = body

    // Validate required fields
    if (
      !tableId ||
      !customerName ||
      !customerPhone ||
      !partySize ||
      !reservationDate
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    await connectDB()

    // Check if table exists
    const table = await Table.findById(tableId)
    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 },
      )
    }

    // Check if party size exceeds table capacity
    if (partySize > table.capacity) {
      return NextResponse.json(
        { success: false, error: 'Party size exceeds table capacity' },
        { status: 400 },
      )
    }

    // Check if there's a conflicting reservation
    const reservationDateObj = new Date(reservationDate)
    const endTime = new Date(
      reservationDateObj.getTime() + (duration || 90) * 60000,
    )

    const conflictingReservation = await Reservation.findOne({
      tableId: tableId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        // New reservation starts during an existing reservation
        {
          reservationDate: { $lte: reservationDateObj },
          $expr: {
            $gte: [
              {
                $add: ['$reservationDate', { $multiply: ['$duration', 60000] }],
              },
              reservationDateObj.getTime(),
            ],
          },
        },
        // New reservation ends during an existing reservation
        {
          reservationDate: { $lte: endTime },
          $expr: {
            $gte: [
              {
                $add: ['$reservationDate', { $multiply: ['$duration', 60000] }],
              },
              endTime.getTime(),
            ],
          },
        },
      ],
    })

    if (conflictingReservation) {
      return NextResponse.json(
        { success: false, error: 'Table is already reserved for this time' },
        { status: 400 },
      )
    }

    // Create reservation
    const reservation = await Reservation.create({
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate: reservationDateObj,
      duration: duration || 90,
      specialRequests,
    })

    // Update table status to reserved
    await Table.findByIdAndUpdate(tableId, {
      status: 'reserved',
      lastOccupied: `Reserved for ${new Date(reservationDate).toLocaleTimeString()}`,
      updatedAt: new Date(),
    })

    return NextResponse.json(
      { success: true, data: reservation },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create reservation' },
      { status: 500 },
    )
  } finally {
    await disconnectDB()
  }
}
