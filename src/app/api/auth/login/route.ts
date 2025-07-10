import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { connectDB, disconnectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

export async function POST(req: Request) {
  try {
    await connectDB()
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      )
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    })
    return NextResponse.json({
      token,
      user: { email: user.email, name: user.name },
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
