import { Button, Checkbox, Input, Select } from 'antd'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React, { useRef, useState } from 'react'
import { BsUpload, BsX } from 'react-icons/bs'
import { DEFAULT_VIDEO_CATEGORIES, VideoFormData } from '@/models/Video'

const { TextArea } = Input

interface VideoFormProps {
  onSubmit: (formData: VideoFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<VideoFormData>
}

const VideoForm: React.FC<VideoFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    videoFile: null,
    thumbnailFile: null,
    category: initialData?.category || DEFAULT_VIDEO_CATEGORIES[0],
    featured: initialData?.featured || false,
  })

  const [videoPreview, setVideoPreview] = useState<string>('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, videoFile: file }))

      // Create preview URL
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, thumbnailFile: file }))

      // Create preview URL
      const url = URL.createObjectURL(file)
      setThumbnailPreview(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validate form
    if (!formData.title) {
      setErrorMessage('Please enter a title for the video')
      return
    }

    if (!formData.videoFile && !initialData?.videoFile) {
      setErrorMessage('Please upload a video file')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to save video. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Video' : 'Upload New Video'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Title*
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter video title"
                  size="large"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onChange={(value) => handleSelectChange(value, 'category')}
                  options={DEFAULT_VIDEO_CATEGORIES.map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                  className="w-full rounded-xl !h-10"
                  size="large"
                  style={{ borderRadius: 12 }}
                  placeholder="Select category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter video description"
                  className="rounded-xl"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video File*
                </label>
                <div className="mt-1 flex flex-col items-center">
                  {videoPreview ? (
                    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                      <video
                        src={videoPreview}
                        className="w-full h-full object-contain"
                        controls
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoPreview('')
                          setFormData((prev) => ({ ...prev, videoFile: null }))
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <BsX size={20} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition duration-200 mb-3"
                    >
                      <BsUpload size={32} className="text-gray-400 mb-2" />
                      <p className="text-gray-500">Click to upload video</p>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: MP4, WebM, MOV (max 100MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Image (Optional)
                </label>
                <div className="mt-1 flex flex-col items-center">
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, 720px"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailPreview('')
                          setFormData((prev) => ({
                            ...prev,
                            thumbnailFile: null,
                          }))
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <BsX size={20} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-full aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition duration-200 mb-3"
                    >
                      <BsUpload size={32} className="text-gray-400 mb-2" />
                      <p className="text-gray-500">Click to upload thumbnail</p>
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended size: 1280×720 (16:9 aspect ratio)
                  </p>
                </div>
              </div>

              <div>
                <Checkbox
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      featured: e.target.checked,
                    }))
                  }
                >
                  <span className="ml-2">Feature this video</span>
                </Checkbox>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mt-6">
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end mt-8 space-x-3">
              <Button onClick={onCancel} size="large" className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                size="large"
                className="rounded-xl bg-gradient-to-tr from-primary to-secondary"
                style={{ background: '#FFD600', color: '#222' }}
              >
                {isSubmitting
                  ? 'Uploading...'
                  : initialData
                    ? 'Update Video'
                    : 'Upload Video'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default VideoForm
