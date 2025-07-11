import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import Supplier from '@/models/db/Supplier'
import dbConnect from '@/utils/dbConnect'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    await dbConnect()

    const query = activeOnly ? { isActive: true } : {}
    const suppliers = await Supplier.find(query).sort({ name: 1 })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    await dbConnect()

    const newSupplier = new Supplier(data)
    await newSupplier.save()

    revalidatePath('/dashboard/inventory/suppliers')

    return NextResponse.json({
      success: true,
      supplier: newSupplier,
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 },
      )
    }

    await dbConnect()

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    )

    if (!updatedSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    revalidatePath('/dashboard/inventory/suppliers')

    return NextResponse.json({
      success: true,
      supplier: updatedSupplier,
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 },
      )
    }

    await dbConnect()

    // Instead of deleting, mark as inactive
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    )

    if (!updatedSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    revalidatePath('/dashboard/inventory/suppliers')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deactivating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate supplier' },
      { status: 500 },
    )
  }
}
