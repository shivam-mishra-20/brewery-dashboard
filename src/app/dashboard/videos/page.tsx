'use client'

import { Button, Empty, Modal, Spin, Tabs } from 'antd'
import { motion } from 'framer-motion'
import React, { useState } from 'react'
import { BsGrid, BsList, BsPlusCircle } from 'react-icons/bs'
import VideoCard from '@/components/VideoCard'
import VideoForm from '@/components/VideoForm'
import { useVideos } from '@/hooks/useVideos'
import { DEFAULT_VIDEO_CATEGORIES, Video } from '@/models/Video'

export default function VideoManagement() {
  const { videos, loading, error, addVideo, editVideo, removeVideo } =
    useVideos()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)

  const handleNewVideo = () => {
    setCurrentVideo(null)
    setIsFormOpen(true)
  }

  const handleEditVideo = (video: Video) => {
    setCurrentVideo(video)
    setIsFormOpen(true)
  }

  const handleDeleteVideo = (video: Video) => {
    setVideoToDelete(video)
    setDeleteConfirmVisible(true)
  }

  const confirmDelete = async () => {
    if (videoToDelete) {
      await removeVideo(videoToDelete.id)
      setDeleteConfirmVisible(false)
      setVideoToDelete(null)
    }
  }

  const handleSubmit = async (formData: any) => {
    if (currentVideo) {
      await editVideo(currentVideo.id, formData)
    } else {
      await addVideo(formData)
    }
    setIsFormOpen(false)
  }

  const filteredVideos =
    activeTab === 'all'
      ? videos
      : videos.filter((video) =>
          activeTab === 'featured'
            ? video.featured
            : video.category === activeTab,
        )

  // Animation variants for list items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Video Management</h1>
        <Button
          type="primary"
          icon={<BsPlusCircle />}
          onClick={handleNewVideo}
          size="large"
          className="rounded-xl bg-gradient-to-tr from-primary to-secondary"
          style={{ background: '#FFD600', color: '#222' }}
        >
          Upload New Video
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all', label: 'All Videos' },
              { key: 'featured', label: 'Featured' },
              ...DEFAULT_VIDEO_CATEGORIES.map((cat) => ({
                key: cat,
                label: cat,
              })),
            ]}
          />
          <div className="flex items-center space-x-2">
            <Button
              icon={<BsGrid />}
              onClick={() => setViewMode('grid')}
              type={viewMode === 'grid' ? 'primary' : 'default'}
              style={
                viewMode === 'grid'
                  ? { background: '#FFD600', color: '#222' }
                  : {}
              }
            />
            <Button
              icon={<BsList />}
              onClick={() => setViewMode('list')}
              type={viewMode === 'list' ? 'primary' : 'default'}
              style={
                viewMode === 'list'
                  ? { background: '#FFD600', color: '#222' }
                  : {}
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        ) : filteredVideos.length === 0 ? (
          <Empty description="No videos found" className="py-12" />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={`grid ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            } gap-6`}
          >
            {filteredVideos.map((video) => (
              <motion.div key={video.id} variants={item}>
                <VideoCard
                  video={video}
                  onEdit={handleEditVideo}
                  onDelete={handleDeleteVideo}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {isFormOpen && (
        <VideoForm
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          initialData={
            currentVideo
              ? {
                  title: currentVideo.title,
                  description: currentVideo.description,
                  category: currentVideo.category,
                  featured: currentVideo.featured,
                  videoFile: null,
                  thumbnailFile: null,
                }
              : undefined
          }
        />
      )}

      <Modal
        title="Confirm Delete"
        open={deleteConfirmVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete the video &ldquo;
          {videoToDelete?.title}&rdquo;? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
