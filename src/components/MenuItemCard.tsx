'use client'

import '@/styles/menu-carousel.css'
import { AnimatePresence, easeInOut, motion } from 'framer-motion'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import {
  BsChevronLeft,
  BsChevronRight,
  BsInfoCircle,
  BsPauseFill,
  BsPencil,
  BsPlayFill,
  BsToggleOff,
  BsToggleOn,
  BsTrash,
  BsXLg,
} from 'react-icons/bs'
import { MenuItem } from '@/models/MenuItem'

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailability: (id: string, available: boolean) => void
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  // State
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isShowingVideo, setIsShowingVideo] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Handle image resources
  const images = item.imageURLs?.length
    ? item.imageURLs
    : item.imageURL
      ? [item.imageURL]
      : []

  const hasImages = images.length > 0
  const hasVideo = Boolean(item.videoUrl)
  const hasIngredients = Boolean(
    item.ingredients && item.ingredients.length > 0,
  )
  const hasAddOns = Boolean(item.addOns && item.addOns.length > 0)

  // Carousel control
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)
  }

  // Video control
  const toggleVideo = () => {
    if (!hasVideo) return

    if (!isShowingVideo) {
      setIsShowingVideo(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current
            .play()
            .then(() => setIsVideoPlaying(true))
            .catch((err) => console.error('Video play error:', err))
        }
      }, 100)
    } else {
      if (videoRef.current) {
        videoRef.current.pause()
      }
      setIsShowingVideo(false)
      setIsVideoPlaying(false)
    }
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isVideoPlaying) {
      videoRef.current.pause()
      setIsVideoPlaying(false)
    } else {
      videoRef.current
        .play()
        .then(() => setIsVideoPlaying(true))
        .catch((err) => console.error('Video play error:', err))
    }
  }

  // Auto-advance carousel when not hovering
  useEffect(() => {
    if (!isHovering && images.length > 1 && !isShowingVideo) {
      const interval = setInterval(nextSlide, 5000)
      return () => clearInterval(interval)
    }
  }, [isHovering, images.length, isShowingVideo])

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easeInOut,
      },
    },
    hover: {
      y: -8,
      boxShadow: '0 20px 30px rgba(255, 207, 51, 0.2)',
      transition: { duration: 0.3 },
    },
  }

  const detailsVariants = {
    collapsed: { maxHeight: 0, opacity: 0 },
    expanded: {
      maxHeight: 200,
      opacity: 1,
      transition: {
        maxHeight: { duration: 0.3 },
        opacity: { duration: 0.3, delay: 0.1 },
      },
    },
  }

  // Error handling
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/file.svg'
  }

  return (
    <motion.div
      className={`menu-card border ${item.available ? 'border-yellow-200' : 'border-gray-200'}`}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      layout
    >
      {/* Status badge */}
      <div
        className={`status-badge ${item.available ? 'status-available' : 'status-unavailable'}`}
      >
        {item.available ? 'Available' : 'Unavailable'}
      </div>

      {/* Media section */}
      <div className="menu-carousel">
        {hasImages ? (
          <>
            {/* Images */}
            <div
              ref={carouselRef}
              className="menu-carousel-inner"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {images.map((url, idx) => (
                <div key={idx} className="menu-carousel-slide">
                  <Image
                    src={url}
                    alt={`${item.name} - image ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    priority={idx === 0}
                    className="object-cover"
                    onError={handleImageError}
                  />
                </div>
              ))}
            </div>

            {/* Video overlay */}
            {hasVideo && isShowingVideo && (
              <div className="video-container">
                <video
                  ref={videoRef}
                  src={item.videoUrl}
                  poster={item.videoThumbnailUrl || images[0]}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="video-controls">
                  <button className="video-btn" onClick={togglePlayPause}>
                    {isVideoPlaying ? (
                      <BsPauseFill size={16} />
                    ) : (
                      <BsPlayFill size={16} />
                    )}
                  </button>
                  <button className="video-btn" onClick={toggleVideo}>
                    <BsXLg size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Carousel controls */}
            {images.length > 1 && !isShowingVideo && (
              <>
                <button
                  className="carousel-arrow carousel-arrow-left"
                  onClick={prevSlide}
                >
                  <BsChevronLeft size={16} />
                </button>
                <button
                  className="carousel-arrow carousel-arrow-right"
                  onClick={nextSlide}
                >
                  <BsChevronRight size={16} />
                </button>

                <div className="menu-carousel-dots">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`menu-carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(idx)}
                    />
                  ))}
                </div>

                <div className="image-counter">
                  {currentSlide + 1}/{images.length}
                </div>
              </>
            )}

            {/* Video button */}
            {hasVideo && !isShowingVideo && (
              <motion.button
                className="absolute bottom-2 left-2 bg-yellow-500 text-white p-2 rounded-full shadow-md z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVideo}
              >
                <BsPlayFill size={16} />
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="menu-card-content">
        <div className="menu-card-header">
          <h3 className="menu-card-title">{item.name}</h3>
          <div className="flex gap-1">
            <motion.button
              className="btn btn-icon btn-secondary"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(item)}
            >
              <BsPencil size={14} />
            </motion.button>
            <motion.button
              className="btn btn-icon btn-danger"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(item.id)}
            >
              <BsTrash size={14} />
            </motion.button>
          </div>
        </div>

        <p className="menu-card-description">
          {item.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between">
          <p className=" text-secondary ">₹{Number(item.price).toFixed(2)}</p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleAvailability(item.id, !item.available)}
            className="text-lg"
          >
            {item.available ? (
              <BsToggleOn className="text-green-500" size={24} />
            ) : (
              <BsToggleOff className="text-gray-400" size={24} />
            )}
          </motion.button>
        </div>

        {/* Tags section */}
        <div className="tag-container">
          {hasIngredients && (
            <span className="menu-tag tag-ingredient">
              {item.ingredients!.length} ingredients
            </span>
          )}

          {hasAddOns && (
            <span className="menu-tag tag-addon">
              {item.addOns!.length} add-ons
            </span>
          )}

          {(hasIngredients || hasAddOns) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDetails(!showDetails)}
              className="ml-auto text-xs flex items-center gap-1 text-primary"
            >
              <BsInfoCircle size={12} />
              {showDetails ? 'Less info' : 'More info'}
            </motion.button>
          )}
        </div>

        {/* Details section */}
        <AnimatePresence>
          {showDetails && (hasIngredients || hasAddOns) && (
            <motion.div
              variants={detailsVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="mt-2 overflow-hidden"
            >
              <div
                className="space-y-2 custom-scrollbar pr-1"
                style={{ maxHeight: '160px', overflowY: 'auto' }}
              >
                {/* Ingredients section */}
                {hasIngredients && (
                  <div className="p-2 bg-blue-50 rounded-md">
                    <h4 className="text-xs font-semibold mb-1 text-blue-800">
                      Ingredients:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {item.ingredients!.map((ing, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                        >
                          {ing.inventoryItemName}: {ing.quantity} {ing.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons section */}
                {hasAddOns && (
                  <div className="p-2 bg-green-50 rounded-md">
                    <h4 className="text-xs font-semibold mb-1 text-green-800">
                      Add-ons:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {item.addOns!.map((addon, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                        >
                          {addon.name}: ₹{addon.price.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default MenuItemCard
