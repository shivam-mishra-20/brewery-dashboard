import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React, { useState } from 'react'
import {
  BsChevronLeft,
  BsChevronRight,
  BsPencil,
  BsToggleOff,
  BsToggleOn,
  BsTrash,
} from 'react-icons/bs'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import '@/styles/menu-carousel.css'
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
  // State to handle image loading errors
  const [imageLoadErrors, setImageLoadErrors] = useState<boolean[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  // Check if there are multiple images to display
  const hasMultipleImages = item.imageURLs && item.imageURLs.length > 0

  // For legacy support, combine all possible image URLs
  const allImageUrls = hasMultipleImages
    ? item.imageURLs
    : item.imageURL
      ? [item.imageURL]
      : []

  // Use this for conditional rendering if needed
  // const hasMultipleImagesForCarousel = allImageUrls.length > 1

  const handleImageError = (index: number) => {
    const newErrors = [...imageLoadErrors]
    newErrors[index] = true
    setImageLoadErrors(newErrors)
  }

  const handleSlideChange = (index: number) => {
    setActiveSlide(index)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: '0 14px 40px rgba(255, 207, 51, 0.25)' }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className={`relative bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3 border-2 transition-all duration-300 ${
        item.available
          ? 'border-yellow-200 hover:border-yellow-400'
          : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {allImageUrls && allImageUrls.length > 0 ? (
          <motion.div
            className="w-24 h-24 rounded-xl overflow-hidden border border-yellow-100 shadow-lg relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {allImageUrls.length === 1 ? (
              // Single image display with hover effect
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                animate={{ scale: isHovering ? 1.05 : 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <Image
                  src={allImageUrls[0]}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.onerror = null
                    target.src = '/file.svg'
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0"
                  animate={{ opacity: isHovering ? 0.5 : 0 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            ) : (
              // Enhanced carousel for multiple images
              <Carousel
                showArrows={true}
                showStatus={false}
                showIndicators={true}
                showThumbs={false}
                infiniteLoop={true}
                autoPlay={isHovering ? false : true}
                interval={4000}
                stopOnHover={true}
                swipeable={true}
                emulateTouch={true}
                className="menu-item-carousel"
                onChange={handleSlideChange}
                selectedItem={activeSlide}
                renderArrowPrev={(clickHandler) => (
                  <AnimatePresence>
                    {isHovering && (
                      <motion.button
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        onClick={clickHandler}
                        className="absolute left-0 z-10 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 text-yellow-600 hover:bg-white hover:text-yellow-700 shadow-md"
                        aria-label="Previous"
                      >
                        <BsChevronLeft size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                )}
                renderArrowNext={(clickHandler) => (
                  <AnimatePresence>
                    {isHovering && (
                      <motion.button
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        transition={{ duration: 0.2 }}
                        onClick={clickHandler}
                        className="absolute right-0 z-10 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 text-yellow-600 hover:bg-white hover:text-yellow-700 shadow-md"
                        aria-label="Next"
                      >
                        <BsChevronRight size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                )}
              >
                {allImageUrls.map((url, index) => (
                  <motion.div
                    key={`${item.id}-image-${index}`}
                    className="h-24 w-24 relative"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={imageLoadErrors[index] ? '/file.svg' : url}
                      alt={`${item.name} - Image ${index + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      onError={() => handleImageError(index)}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0"
                      animate={{ opacity: isHovering ? 0.5 : 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>
                ))}
              </Carousel>
            )}

            {allImageUrls.length > 1 && (
              <motion.div
                className="absolute bottom-1 right-1 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-sm"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: isHovering ? 1.1 : 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {activeSlide + 1}/{allImageUrls.length}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="w-24 h-24 rounded-xl object-contain bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-100 shadow-lg flex items-center justify-center text-yellow-400 text-3xl flex-shrink-0"
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
          >
            🍽️
          </motion.div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-inter-semibold text-black">
            {item.name}
          </h3>
          <p className="text-xs text-black mt-1">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <motion.span
          className="text-black font-bold text-lg price-highlight bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100"
          whileHover={{ scale: 1.05 }}
        >
          ₹{item.price.toFixed(2)}
        </motion.span>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleAvailability(item.id, !item.available)}
            className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-black hover:bg-yellow-100 transition"
            aria-label={
              item.available ? 'Mark as unavailable' : 'Mark as available'
            }
          >
            {item.available ? (
              <BsToggleOn className="text-green-500 text-xl" />
            ) : (
              <BsToggleOff className="text-gray-400 text-xl" />
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(item)}
            className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-black hover:bg-yellow-100 transition"
            aria-label="Edit item"
          >
            <BsPencil />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-black hover:bg-red-100 transition"
            aria-label="Delete item"
          >
            <BsTrash className="text-red-500" />
          </motion.button>
        </div>
      </div>
      {!item.available && (
        <span className="absolute top-3 right-3 bg-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full shadow">
          Unavailable
        </span>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-3 right-3 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full"
      >
        {item.category}
      </motion.div>
    </motion.div>
  )
}

export default MenuItemCard
