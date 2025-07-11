export interface Video {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  category: string
  featured: boolean
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export interface VideoFormData {
  title: string
  description: string
  videoFile: File | null
  thumbnailFile: File | null
  category: string
  featured: boolean
}

export const DEFAULT_VIDEO_CATEGORIES = [
  'Tutorial',
  'Promotional',
  'Announcement',
  'Event',
  'Testimonial',
  'General',
]
