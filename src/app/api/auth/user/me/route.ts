/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
// Remove SubscriptionPlan import as it's not needed for now
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

// GET /api/auth/user/me - Get current user info (requires JWT in Authorization header)
export async function GET(req: Request) {
  await connectDB()
  try {
    const auth = req.headers.get('authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = auth.replace('Bearer ', '')
    interface JwtPayloadWithId extends jwt.JwtPayload {
      id: string
    }
    let payload: string | JwtPayloadWithId
    try {
      payload = jwt.verify(token, JWT_SECRET) as string | JwtPayloadWithId
    } catch (err) {
      console.error('JWT verify error:', err)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    // Ensure payload is an object and has 'id'
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.id !== 'string'
    ) {
      console.error('Invalid token payload:', payload)
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 },
      )
    }
    let user
    try {
      // Don't use populate to avoid the MissingSchemaError
      user = await User.findById(payload.id).select('-password')
    } catch (err) {
      console.error('User DB error:', err)
      return NextResponse.json({ error: 'User DB error' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    // Return user info (excluding password)
    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        // Omit subscriptionPlan to avoid errors
        trialStart: user.trialStart,
      },
    })
  } catch (err) {
    console.error('Failed to fetch user:', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
