/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore - Bypass Next.js type checking issues with dynamic routes
import { NextRequest, NextResponse } from 'next/server'
import Video from '@/models/db/Video'
import dbConnect from '@/utils/dbConnect'

// @ts-ignore - Bypass Next.js type checking issues with dynamic routes
export async function GET(req: NextRequest, { params }) {
  try {
    const { id } = params

    await dbConnect()

    const video = await Video.findById(id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({
      video,
    })
  } catch (error) {
    console.error(`Error fetching video with ID ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 },
    )
  }
}

// @ts-ignore - Bypass Next.js type checking issues with dynamic routes
export async function PUT(req: NextRequest, { params }) {
  try {
    const { id } = params
    const data = await req.json()
    const { title, description, videoUrl, thumbnailUrl, category, featured } =
      data

    await dbConnect()

    const video = await Video.findById(id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update only the fields that are provided
    if (title !== undefined) video.title = title
    if (description !== undefined) video.description = description
    if (videoUrl !== undefined) video.videoUrl = videoUrl
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl
    if (category !== undefined) video.category = category
    if (featured !== undefined) video.featured = featured

    await video.save()

    return NextResponse.json({
      success: true,
      video,
    })
  } catch (error) {
    console.error(`Error updating video with ID ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 },
    )
  }
}

// @ts-ignore - Bypass Next.js type checking issues with dynamic routes
export async function DELETE(req: NextRequest, { params }) {
  try {
    const { id } = params

    await dbConnect()

    const video = await Video.findByIdAndDelete(id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Note: You may want to also delete the video file from Firebase Storage here
    // This would require implementing the storage deletion functionality

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(`Error deleting video with ID ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 },
    )
  }
}
