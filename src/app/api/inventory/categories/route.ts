import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import Category from '@/models/db/Category' // Adjust path if needed

export async function GET() {
  await dbConnect()
  const categories = await Category.find({ type: 'inventory' }).sort({ name: 1 })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  const exists = await Category.findOne({ name, type: 'inventory' })
  if (exists) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }
  const category = await Category.create({ name, type: 'inventory' })

  revalidatePath('/dashboard/inventory')

  return NextResponse.json({ category })
}

export async function PUT(req: NextRequest) {
  await dbConnect()
  const { oldName, newName } = await req.json()
  if (!oldName || !newName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const category = await Category.findOneAndUpdate(
    { name: oldName, type: 'inventory' },
    { name: newName },
    { new: true },
  )
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest) {
  await dbConnect()
  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  await Category.deleteOne({ name, type: 'inventory' })
  return NextResponse.json({ success: true })
}
