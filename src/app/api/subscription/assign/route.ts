import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SubscriptionPlan } from '@/models/SubscriptionPlan'
import { User } from '@/models/User'

// POST: Assign a plan to a user
export async function POST(req: Request) {
  await connectDB()
  const { userId, planId } = await req.json()
  if (!userId || !planId) {
    return NextResponse.json(
      { error: 'Missing userId or planId' },
      { status: 400 },
    )
  }
  const plan = await SubscriptionPlan.findById(planId)
  if (!plan)
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  const user = await User.findByIdAndUpdate(
    userId,
    { subscriptionPlan: planId },
    { new: true },
  )
  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ user })
}
