import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SubscriptionPlan } from '@/models/SubscriptionPlan'

// GET: List all plans
export async function GET() {
  await connectDB()
  const plans = await SubscriptionPlan.find({})
  return NextResponse.json({ plans })
}

// POST: Create a new plan
export async function POST(req: Request) {
  await connectDB()
  const { name, price, features, isActive } = await req.json()
  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const plan = await SubscriptionPlan.create({
    name,
    price,
    features,
    isActive,
  })
  return NextResponse.json({ plan })
}

// PATCH: Update a plan
export async function PATCH(req: Request) {
  await connectDB()
  const { id, update } = await req.json()
  if (!id || !update) {
    return NextResponse.json({ error: 'Missing id or update' }, { status: 400 })
  }
  const plan = await SubscriptionPlan.findByIdAndUpdate(id, update, {
    new: true,
  })
  if (!plan)
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  return NextResponse.json({ plan })
}

// DELETE: Remove a plan
export async function DELETE(req: Request) {
  await connectDB()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const plan = await SubscriptionPlan.findByIdAndDelete(id)
  if (!plan)
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  return NextResponse.json({ message: 'Plan deleted' })
}
