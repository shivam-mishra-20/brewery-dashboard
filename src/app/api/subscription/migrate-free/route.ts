import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SubscriptionPlan } from '@/models/SubscriptionPlan'
import { User } from '@/models/User'

// POST: Assign Free plan to all users without a plan
export async function POST() {
  await connectDB()
  let freePlan = await SubscriptionPlan.findOne({ name: { $regex: /^free$/i } })
  if (!freePlan) {
    freePlan = await SubscriptionPlan.create({
      name: 'Free',
      price: 0,
      features: ['Basic access'],
      isActive: true,
    })
  }
  const result = await User.updateMany(
    {
      $or: [
        { subscriptionPlan: { $exists: false } },
        { subscriptionPlan: null },
      ],
    },
    { $set: { subscriptionPlan: freePlan._id } },
  )
  return NextResponse.json({
    message: 'Migration complete',
    updated: result.modifiedCount,
  })
}
