import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

// GET /api/auth/user - Get all users
export async function GET() {
  await connectDB();
  try {
    const users = await User.find({}, '-password'); // Exclude password
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH /api/auth/user - Update user profile (requires JWT)
export async function PATCH(req: Request) {
  await connectDB();
  try {
    const { id, update } = await req.json();
    if (!id || !update) {
      return NextResponse.json({ error: 'Missing user id or update data' }, { status: 400 });
    }
    const user = await User.findByIdAndUpdate(id, update, { new: true, select: '-password' });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/auth/user - Delete user (requires JWT)
export async function DELETE(req: Request) {
  await connectDB();
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'User deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
