import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { connectDB, disconnectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

// Signup handler
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
    const user = await User.create({ email, password: hash, name })
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

// Login handler
export async function PUT(req: Request) {
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
