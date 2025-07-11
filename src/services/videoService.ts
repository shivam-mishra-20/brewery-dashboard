import { Video, VideoFormData } from '@/models/Video'

// Get all videos
export const getVideos = async (): Promise<Video[]> => {
  try {
    const response = await fetch('/api/videos')
    if (!response.ok) throw new Error('Failed to fetch videos')
    const data = await response.json()
    return data.videos
  } catch (error) {
    console.error('Error fetching videos:', error)
    throw error
  }
}

// Get a single video by ID
export const getVideoById = async (id: string): Promise<Video> => {
  try {
    const response = await fetch(`/api/videos/${id}`)
    if (!response.ok) throw new Error('Failed to fetch video')
    const data = await response.json()
    return data.video
  } catch (error) {
    console.error(`Error fetching video with ID ${id}:`, error)
    throw error
  }
}

// Create a new video
export const createVideo = async (formData: VideoFormData): Promise<Video> => {
  try {
    // First upload the video to Firebase Storage
    const videoUrl = await uploadVideoFile(formData.videoFile)

    // Upload thumbnail if available, otherwise use a default
    const thumbnailUrl = formData.thumbnailFile
      ? await uploadThumbnailFile(formData.thumbnailFile)
      : ''

    // Create video record in the database
    const response = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        videoUrl,
        thumbnailUrl,
        category: formData.category,
        featured: formData.featured,
      }),
    })

    if (!response.ok) throw new Error('Failed to create video')
    const data = await response.json()
    return data.video
  } catch (error) {
    console.error('Error creating video:', error)
    throw error
  }
}

// Update an existing video
export const updateVideo = async (
  id: string,
  formData: VideoFormData,
): Promise<Video> => {
  try {
    const updateData: any = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      featured: formData.featured,
    }

    // Only upload new files if provided
    if (formData.videoFile) {
      updateData.videoUrl = await uploadVideoFile(formData.videoFile)
    }

    if (formData.thumbnailFile) {
      updateData.thumbnailUrl = await uploadThumbnailFile(
        formData.thumbnailFile,
      )
    }

    const response = await fetch(`/api/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) throw new Error('Failed to update video')
    const data = await response.json()
    return data.video
  } catch (error) {
    console.error(`Error updating video with ID ${id}:`, error)
    throw error
  }
}

// Delete a video
export const deleteVideo = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/videos/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete video')
  } catch (error) {
    console.error(`Error deleting video with ID ${id}:`, error)
    throw error
  }
}

// Helper function to upload video file to Firebase Storage
const uploadVideoFile = async (file: File | null): Promise<string> => {
  if (!file) throw new Error('No video file provided')

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'video')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Failed to upload video file')
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error uploading video file:', error)
    throw error
  }
}

// Helper function to upload thumbnail file to Firebase Storage
const uploadThumbnailFile = async (file: File | null): Promise<string> => {
  if (!file) throw new Error('No thumbnail file provided')

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'thumbnail')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Failed to upload thumbnail file')
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error uploading thumbnail file:', error)
    throw error
  }
}
