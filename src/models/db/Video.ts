import mongoose, { Document, Schema } from 'mongoose'

export interface IVideo extends Document {
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  category: string
  featured: boolean
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
}

const VideoSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    featured: { type: Boolean, default: false },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true },
)

export default mongoose.models.Video ||
  mongoose.model<IVideo>('Video', VideoSchema)
