import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/utils/dbConnect'
import Category from '@/models/db/Category'

export async function GET(req: NextRequest) {
  await dbConnect() // <-- Ensure connection is ready!
  const type = req.nextUrl.searchParams.get('type')
  const query = type ? { type } : {}
  const categories = await Category.find(query).sort({ name: 1 })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const { name, type } = await req.json()
  if (!name || !type) {
    return NextResponse.json({ error: 'Name and type required' }, { status: 400 })
  }
  const exists = await Category.findOne({ name, type })
  if (exists) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }
  const category = await Category.create({ name, type })
  return NextResponse.json({ category })
}

export async function PUT(req: NextRequest) {
  await dbConnect()
  const { oldName, newName, type } = await req.json()
  if (!oldName || !newName || !type) {
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
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest) {
  await dbConnect()
  const { name, type } = await req.json()
  if (!name || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  await Category.deleteOne({ name, type })
  return NextResponse.json({ success: true })
}