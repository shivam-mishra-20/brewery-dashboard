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
    <div className="p-6 bg-[#F9FAFB] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#04B851]">Video Management</h1>
        <Button
          type="primary"
          icon={<BsPlusCircle />}
          onClick={handleNewVideo}
          size="large"
          className="rounded-xl bg-gradient-to-tr from-[#04B851] to-[#039f45] border border-[#04B851] text-white font-semibold hover:bg-[#039f45]"
          style={{ background: undefined, color: undefined }}
        >
          Upload New Video
        </Button>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm p-4 mb-6 border border-[#E0E0E0]">
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
            className="custom-tabs"
          />
          <div className="flex items-center space-x-2">
            <Button
              icon={<BsGrid />}
              onClick={() => setViewMode('grid')}
              type={viewMode === 'grid' ? 'primary' : 'default'}
              className={`rounded-xl border border-[#E0E0E0] ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-tr from-[#04B851] to-[#039f45] text-white font-semibold'
                  : 'bg-[#e6f9f0] text-[#04B851]'
              }`}
              style={
                viewMode === 'grid'
                  ? { background: undefined, color: undefined }
                  : {}
              }
            />
            <Button
              icon={<BsList />}
              onClick={() => setViewMode('list')}
              type={viewMode === 'list' ? 'primary' : 'default'}
              className={`rounded-xl border border-[#E0E0E0] ${
                viewMode === 'list'
                  ? 'bg-gradient-to-tr from-[#04B851] to-[#039f45] text-white font-semibold'
                  : 'bg-[#e6f9f0] text-[#04B851]'
              }`}
              style={
                viewMode === 'list'
                  ? { background: undefined, color: undefined }
                  : {}
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" className="text-[#04B851]" />
          </div>
        ) : error ? (
          <div className="bg-[#e6f9f0] text-[#EB5757] p-4 rounded-lg border border-[#EB5757] font-medium shadow-sm">
            {error}
          </div>
        ) : filteredVideos.length === 0 ? (
          <Empty
            description={
              <span className="text-[#4D4D4D]">No videos found</span>
            }
            className="py-12"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
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
        title={
          <span className="text-[#EB5757] font-semibold">Confirm Delete</span>
        }
        open={deleteConfirmVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{
          danger: true,
          style: { background: '#EB5757', borderColor: '#EB5757' },
        }}
        cancelButtonProps={{
          style: { borderColor: '#E0E0E0', color: '#1A1A1A' },
        }}
      >
        <p className="text-[#4D4D4D]">
          Are you sure you want to delete the video &ldquo;
          {videoToDelete?.title}&rdquo;? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
