import { Button, Skeleton } from 'antd'
import React, { useRef, useState } from 'react'
import { BsPencil, BsPlay, BsThreeDotsVertical, BsTrash } from 'react-icons/bs'
import { Video } from '@/models/Video'

interface VideoCardProps {
  video: Video
  onEdit: (video: Video) => void
  onDelete: (video: Video) => void
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handlePlay = () => {
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoLoad = () => {
    setIsLoaded(true)
  }

  // Close the menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="relative aspect-video bg-gray-100">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
          </div>
        )}
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          poster={video.thumbnailUrl || undefined}
          preload="metadata"
          onLoadedData={handleVideoLoad}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          loop
          muted
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
        {!isPlaying && (
          <div
            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center cursor-pointer"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
              <BsPlay size={36} className="text-yellow-500 ml-1" />
            </div>
          </div>
        )}
        {video.featured && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-xs font-bold text-white rounded">
            Featured
          </span>
        )}
        <div className="absolute top-2 right-2" ref={menuRef}>
          <Button
            type="text"
            icon={<BsThreeDotsVertical className="text-white" />}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 h-8 w-8 flex items-center justify-center"
          />
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit(video)
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <BsPencil className="mr-2" /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(video)
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                >
                  <BsTrash className="mr-2" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{video.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {video.category} • {new Date(video.createdAt).toLocaleDateString()}
        </p>
        {video.description && (
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default VideoCard
