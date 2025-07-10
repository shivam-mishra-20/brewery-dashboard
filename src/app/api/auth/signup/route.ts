import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { connectDB, disconnectDB } from '@/lib/mongodb'
import { SubscriptionPlan } from '@/models/SubscriptionPlan'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 },
      )
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    // Find Free plan (case-insensitive)
    let freePlan = await SubscriptionPlan.findOne({
      name: { $regex: /^free$/i },
    })
    if (!freePlan) {
      // Create Free plan if not exists
      freePlan = await SubscriptionPlan.create({
        name: 'Free',
        price: 0,
        features: ['Basic access'],
        isActive: true,
        trialPeriodDays: 10,
      })
    }
    const user = await User.create({
      email,
      password: hash,
      name,
      subscriptionPlan: freePlan._id,
      trialStart: new Date(),
    })
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    })
    return NextResponse.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        subscriptionPlan: freePlan._id,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  } finally {
    await disconnectDB()
  }
}
