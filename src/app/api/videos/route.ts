import { NextRequest, NextResponse } from 'next/server'
import Video from '@/models/db/Video'
import dbConnect from '@/utils/dbConnect'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    await dbConnect()

    // Build query based on filters
    const query: Record<string, any> = {}

    if (category) {
      query.category = category
    }

    if (featured === 'true') {
      query.featured = true
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get videos
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get total count
    const total = await Video.countDocuments(query)

    return NextResponse.json({
      videos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category,
      featured,
      uploadedBy,
    } = data

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    await dbConnect()

    // Create video
    const video = new Video({
      title,
      description: description || '',
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      category: category || 'General',
      featured: featured || false,
      uploadedBy: uploadedBy || 'Admin',
    })

    await video.save()

    return NextResponse.json({
      success: true,
      video,
    })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 },
    )
  }
}
