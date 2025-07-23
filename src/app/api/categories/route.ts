import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import Category from '@/models/db/Category'

export async function GET(req: NextRequest) {
  await dbConnect()
  const type = req.nextUrl.searchParams.get('type') || 'menu'
  const categories = await Category.find({ type }).sort({ name: 1 })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const { name, type = 'menu' } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  const exists = await Category.findOne({ name, type })
  if (exists) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }
  const category = await Category.create({ name, type })
  // Revalidate menu page if type is menu
  if (type === 'menu') {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard/menu')
  }
  return NextResponse.json({ category })
}

export async function PUT(req: NextRequest) {
  await dbConnect()
  const { oldName, newName, type = 'menu' } = await req.json()
  if (!oldName || !newName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const category = await Category.findOneAndUpdate(
    { name: oldName, type },
    { name: newName },
    { new: true }
  )
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
  // Revalidate menu page if type is menu
  if (type === 'menu') {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard/menu')
  }
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest) {
  await dbConnect()
  const { name, type = 'menu' } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  await Category.deleteOne({ name, type })
  // Revalidate menu page if type is menu
  if (type === 'menu') {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard/menu')
  }
  return NextResponse.json({ success: true })
}