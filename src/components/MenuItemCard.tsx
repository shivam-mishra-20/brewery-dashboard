import { Image as AntdImage } from 'antd'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React, { useState } from 'react'
import {
  BsCartDash,
  BsCheckCircle,
  BsChevronLeft,
  BsChevronRight,
  BsCreditCard,
  BsPencil,
  BsToggleOff,
  BsToggleOn,
  BsTrash,
} from 'react-icons/bs'
import { Carousel } from 'react-responsive-carousel'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import '@/styles/menu-carousel.css'
import { Badge, message, Popover, Tag } from 'antd'
import { useOrder } from '@/hooks/useOrder'
import { MenuItem } from '@/models/MenuItem'

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailability: (id: string, available: boolean) => void
  orderId?: string
  paymentStatus?: 'unpaid' | 'paid'
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  orderId,
  paymentStatus = 'unpaid',
}) => {
  // State to handle image loading errors
  const [imageLoadErrors, setImageLoadErrors] = useState<boolean[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  // State for Ant Design image preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  // Video related states
  // Show video by default if present, but make it configurable
  const [showVideo, setShowVideo] = useState(Boolean(item.videoUrl))
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  // Payment related state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [localPaymentStatus, setLocalPaymentStatus] = useState(paymentStatus)
  const { updateOrderStatus, isLoading } = useOrder()

  // Check if there are multiple images to display
  const hasMultipleImages = item.imageURLs && item.imageURLs.length > 0
  // Check if the item has a video
  const hasVideo = Boolean(item.videoUrl)
  // Check if the item has ingredients
  const hasIngredients = Boolean(
    item.ingredients && item.ingredients.length > 0,
  )
  // Check if the item has add-ons
  const hasAddOns = Boolean(item.addOns && item.addOns.length > 0)

  // For displaying video indicator in card header
  // Removed unused videoIndicator variable

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

  const handlePlayVideo = () => {
    if (!showVideo) {
      setShowVideo(true)
      // Give time for video element to be created
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play()
          setIsVideoPlaying(true)
        }
      }, 100)
    } else {
      if (videoRef.current) {
        if (isVideoPlaying) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
        setIsVideoPlaying(!isVideoPlaying)
      }
    }
  }

  // const handleCloseVideo = () => {
  //   setShowVideo(false)
  //   setIsVideoPlaying(false)
  // }

  // Ingredients content for popover
  const ingredientsContent = (
    <div className="w-64 max-w-xs">
      <h4 className="text-sm font-medium mb-2 text-gray-800">Ingredients:</h4>
      <div className="flex flex-wrap gap-1">
        {item.ingredients?.map((ing, index) => (
          <Tag key={index} color="blue" className="mb-1">
            {ing.inventoryItemName}: {ing.quantity} {ing.unit}
          </Tag>
        ))}
      </div>
      {(!item.ingredients || item.ingredients.length === 0) && (
        <p className="text-xs text-gray-500">No ingredients listed</p>
      )}
    </div>
  )

  // Add-ons content for popover
  const addOnsContent = (
    <div className="w-64 max-w-xs">
      <h4 className="text-sm font-medium mb-2 text-gray-800">Add-ons:</h4>
      <div className="flex flex-wrap gap-1">
        {item.addOns?.map((addon, index) => (
          <Tag key={index} color="green" className="mb-1">
            {addon.name}: ${addon.price.toFixed(2)}
          </Tag>
        ))}
      </div>
      {(!item.addOns || item.addOns.length === 0) && (
        <p className="text-xs text-gray-500">No add-ons available</p>
      )}
    </div>
  )

  // Function to handle payment processing
  const handleProcessPayment = async () => {
    if (!orderId || isProcessingPayment) return

    try {
      setIsProcessingPayment(true)

      // Call the API to update payment status
      const result = await updateOrderStatus({
        id: orderId,
        paymentStatus: 'paid',
      })

      if (result.success) {
        setLocalPaymentStatus('paid')
        message.success('Payment processed successfully')
      } else {
        message.error(
          `Failed to process payment: ${result.error || 'Unknown error'}`,
        )
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      message.error(`Failed to process payment: ${errorMessage}`)
      console.error('Payment processing error:', err)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(255, 207, 51, 0.20)' }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className={`relative bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-3 border transition-all duration-300 min-h-[180px] max-w-[340px] w-full${
        item.available
          ? 'border-yellow-200 hover:border-yellow-400'
          : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex flex-col items-center gap-2 w-full">
        {allImageUrls && allImageUrls.length > 0 ? (
          <motion.div
            className="w-full aspect-[4/3] max-h-72 rounded-2xl overflow-hidden border border-yellow-100 shadow-lg relative bg-gray-50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Media content area - can contain video and/or images */}
            <div className="w-full h-full relative">
              {/* Video Layer - Shown when video is active */}
              {hasVideo && showVideo && (
                <div className="w-full h-full flex items-center justify-center absolute inset-0 z-20">
                  <video
                    ref={videoRef}
                    src={item.videoUrl}
                    className="w-full h-full object-cover rounded-2xl"
                    poster={item.videoThumbnailUrl || allImageUrls[0]}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '1rem',
                      background: 'black',
                    }}
                  />
                  <div className="absolute bottom-2 left-2 flex gap-2 z-30">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (isVideoPlaying) {
                            videoRef.current.pause()
                          } else {
                            videoRef.current.play()
                          }
                          setIsVideoPlaying(!isVideoPlaying)
                        }
                      }}
                      className="p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
                      title={isVideoPlaying ? 'Pause' : 'Play'}
                    >
                      {isVideoPlaying ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="#FFD600"
                        >
                          <rect x="6" y="5" width="4" height="14" />
                          <rect x="14" y="5" width="4" height="14" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="#FFD600"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    {/* <button
                      onClick={handleCloseVideo}
                      className="p-2 bg-white bg-opacity-80 rounded-full shadow hover:bg-opacity-100 transition"
                      title="Close video"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="black"
                      >
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button> */}
                  </div>
                </div>
              )}

              {/* Images Layer - Always rendered but visually hidden when video is shown */}
              <div
                className={`w-full h-full ${showVideo ? 'opacity-0 invisible' : 'opacity-100 visible'} transition-opacity duration-300 z-10`}
              >
                {allImageUrls.length === 1 ? (
                  <motion.div
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    animate={{ scale: isHovering ? 1.01 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={allImageUrls[0]}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover', borderRadius: '1rem' }}
                      className="object-cover rounded-2xl w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = '/file.svg'
                      }}
                    />
                    {hasVideo && (
                      <button
                        onClick={handlePlayVideo}
                        className="absolute bottom-2 right-2 flex items-center justify-center bg-black bg-opacity-70 rounded-full p-3 z-10 shadow-xl hover:bg-opacity-90 transition-all"
                        title="Play video"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="#FFD600"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0"
                      animate={{ opacity: isHovering ? 0.5 : 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>
                ) : (
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
                    className="menu-item-carousel w-full h-full"
                    onChange={handleSlideChange}
                    selectedItem={activeSlide}
                    renderArrowPrev={(clickHandler, hasPrev) => {
                      return (
                        hasPrev && (
                          <button
                            type="button"
                            onClick={clickHandler}
                            className="absolute left-1 z-10 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors shadow-md"
                          >
                            <BsChevronLeft
                              className="text-gray-700"
                              size={14}
                            />
                          </button>
                        )
                      )
                    }}
                    renderArrowNext={(clickHandler, hasNext) => {
                      return (
                        hasNext && (
                          <button
                            type="button"
                            onClick={clickHandler}
                            className="absolute right-1 z-10 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors shadow-md"
                          >
                            <BsChevronRight
                              className="text-gray-700"
                              size={14}
                            />
                          </button>
                        )
                      )
                    }}
                  >
                    {allImageUrls.map((url, idx) => (
                      <div key={idx} className="w-full h-full relative">
                        <Image
                          src={url}
                          alt={`${item.name} image ${idx + 1}`}
                          fill
                          style={{ objectFit: 'cover', borderRadius: '1rem' }}
                          className="object-cover rounded-2xl w-full h-full"
                          onError={() => handleImageError(idx)}
                        />
                        {imageLoadErrors[idx] && (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-2xl">
                            <svg
                              className="w-12 h-12 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
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
                        {hasVideo && (
                          <button
                            onClick={handlePlayVideo}
                            className="absolute bottom-2 right-2 flex items-center justify-center bg-black bg-opacity-70 rounded-full p-3 z-10 shadow-xl hover:bg-opacity-90 transition-all"
                            title="Play video"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="#FFD600"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
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
              </div>
            </div>
          </motion.div>
        ) : (
          // Placeholder when no image is available
          <div className="w-36 h-36 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
        )}
      </div>
      {/* Details section stacked below media */}
      <div className="flex flex-col gap-3 w-full mt-2">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-1 truncate">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 ml-3">
            <div className="flex">
              {hasIngredients && (
                <Popover
                  content={ingredientsContent}
                  title={`${item.name} - Ingredients`}
                  trigger="click"
                  overlayClassName="max-w-xs"
                >
                  <Badge dot={hasIngredients} color="blue">
                    <button
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      aria-label="View ingredients"
                    >
                      <BsCartDash size={16} />
                    </button>
                  </Badge>
                </Popover>
              )}
              {hasAddOns && (
                <Popover
                  content={addOnsContent}
                  title={`${item.name} - Add-ons`}
                  trigger="click"
                  overlayClassName="max-w-xs"
                >
                  <Badge dot={hasAddOns} color="green">
                    <button
                      className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-colors"
                      aria-label="View add-ons"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                      </svg>
                    </button>
                  </Badge>
                </Popover>
              )}
            </div>
            {/* Images button and popover with modal preview */}
            {allImageUrls && allImageUrls.length > 0 && (
              <>
                <Popover
                  content={
                    <div className="w-64 max-w-xs">
                      <h4 className="text-sm font-medium mb-2 text-gray-800">
                        Images:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {allImageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="w-20 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer"
                            onClick={() => {
                              setPreviewImage(url)
                              setPreviewOpen(true)
                            }}
                          >
                            <AntdImage
                              wrapperStyle={{ display: 'block' }}
                              src={url}
                              alt={`${item.name} image ${idx + 1}`}
                              width={80}
                              height={64}
                              style={{
                                objectFit: 'cover',
                                borderRadius: '0.5rem',
                              }}
                              preview={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  title={`${item.name} - Images`}
                  trigger="click"
                  overlayClassName="max-w-xs"
                >
                  <button
                    className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full hover:bg-yellow-50 transition-colors"
                    aria-label="View images"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8z" />
                    </svg>
                  </button>
                </Popover>
                <AntdImage
                  wrapperStyle={{ display: 'none' }}
                  preview={{
                    visible: previewOpen,
                    src: previewImage,
                    onVisibleChange: (visible) => setPreviewOpen(visible),
                    afterOpenChange: (visible) =>
                      !visible && setPreviewImage(''),
                  }}
                  src={previewImage}
                />
              </>
            )}

            <button
              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
              onClick={() => onEdit(item)}
              aria-label="Edit item"
            >
              <BsPencil size={16} />
            </button>
            <button
              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
              onClick={() => onDelete(item.id)}
              aria-label="Delete item"
            >
              <BsTrash size={16} />
            </button>
          </div>
        </div>

        <p className="text-base text-gray-500 line-clamp-2 mb-2">
          {item.description}
        </p>

        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-primary text-xl">
            ₹{Number(item.price).toFixed(2)}
          </p>
          <div className="flex items-center gap-2">
            {!orderId && (
              <div className="flex items-center gap-2">
                <button
                  className="p-1"
                  onClick={() => onToggleAvailability(item.id, !item.available)}
                >
                  {item.available ? (
                    <BsToggleOn
                      size={24}
                      className="text-green-500 hover:text-green-700"
                    />
                  ) : (
                    <BsToggleOff
                      size={24}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  )}
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment status section - Only render when we have an order ID */}
        {orderId && (
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Order ID:{' '}
                <span className="font-medium text-gray-800">{orderId}</span>
              </span>
              <span className="h-4 w-px bg-gray-300" />
              <span className="text-sm font-medium">
                Payment:{' '}
                <span
                  className={`${
                    localPaymentStatus === 'paid'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {localPaymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </span>
            </div>
            {localPaymentStatus === 'unpaid' ? (
              <button
                onClick={handleProcessPayment}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-all"
                disabled={isProcessingPayment || isLoading}
              >
                {isProcessingPayment ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <>
                    <BsCreditCard className="w-5 h-5" />
                    Pay Now
                  </>
                )}
              </button>
            ) : (
              <Tag color="green" className="flex items-center gap-1 py-1 px-3">
                <BsCheckCircle size={14} />
                <span>Paid</span>
              </Tag>
            )}
          </div>
        )}

        <div className="flex flex-row overflow-auto gap-2 mt-2 custom-scrollbar">
          {hasIngredients && (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2 font-medium">
                Ingredients:
              </p>
              <div className="flex flex-wrap gap-2">
                {item.ingredients?.slice(0, 3).map((ing, idx) => (
                  <Tag key={idx} color="blue" className="text-sm px-3 py-1">
                    {ing.inventoryItemName}: {ing.quantity} {ing.unit}
                  </Tag>
                ))}
                {item.ingredients && item.ingredients.length > 3 && (
                  <Popover
                    title="All Ingredients"
                    content={
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.ingredients?.map((ing, idx) => (
                            <Tag key={idx} color="blue" className="mb-1">
                              {ing.inventoryItemName}: {ing.quantity} {ing.unit}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <Tag
                      color="default"
                      className="text-sm cursor-pointer px-3 py-1"
                    >
                      +{item.ingredients.length - 3} more
                    </Tag>
                  </Popover>
                )}
              </div>
            </div>
          )}

          {hasAddOns && (
            <div className="mt-2 p-3 bg-green-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2 font-medium">
                Available Add-ons:
              </p>
              <div className="flex flex-wrap gap-2">
                {item.addOns?.slice(0, 3).map((addon, idx) => (
                  <Tag key={idx} color="green" className="text-sm px-3 py-1">
                    {addon.name}: ${addon.price.toFixed(2)}
                  </Tag>
                ))}
                {item.addOns && item.addOns.length > 3 && (
                  <Popover
                    title="All Add-ons"
                    content={
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.addOns?.map((addon, idx) => (
                            <Tag key={idx} color="green" className="mb-1">
                              {addon.name}: ${addon.price.toFixed(2)}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <Tag
                      color="default"
                      className="text-sm cursor-pointer px-3 py-1"
                    >
                      +{item.addOns.length - 3} more
                    </Tag>
                  </Popover>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MenuItemCard
