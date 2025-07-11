import { useEffect, useState } from 'react'
import { Video, VideoFormData } from '@/models/Video'
import {
  createVideo,
  deleteVideo,
  getVideos,
  updateVideo,
} from '@/services/videoService'

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedVideos = await getVideos()
      setVideos(fetchedVideos)
    } catch (err) {
      setError('Failed to load videos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const addVideo = async (formData: VideoFormData) => {
    try {
      setLoading(true)
      setError(null)
      const newVideo = await createVideo(formData)
      setVideos((prev) => [...prev, newVideo])
      return newVideo
    } catch (err) {
      setError('Failed to create video')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const editVideo = async (id: string, formData: VideoFormData) => {
    try {
      setLoading(true)
      setError(null)
      const updatedVideo = await updateVideo(id, formData)
      setVideos((prev) =>
        prev.map((video) => (video.id === id ? updatedVideo : video)),
      )
      return updatedVideo
    } catch (err) {
      setError('Failed to update video')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeVideo = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await deleteVideo(id)
      setVideos((prev) => prev.filter((video) => video.id !== id))
    } catch (err) {
      setError('Failed to delete video')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    videos,
    loading,
    error,
    fetchVideos,
    addVideo,
    editVideo,
    removeVideo,
  }
}
