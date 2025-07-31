'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiCoffee,
  FiMinus,
  FiPlus,
  FiShoppingBag,
} from 'react-icons/fi'
import { useCart } from '@/context/CartContext'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  imageURL?: string
  images?: string[]
  imageURLs?: string[]
  videoUrl?: string
  videoThumbnailUrl?: string
  available: boolean
  ingredients?: Array<{
    inventoryItemId: string
    inventoryItemName: string
    quantity: number
    unit: string
  }>
  addOns?: Array<{
    name: string
    price: number
    available: boolean
  }>
  createdAt?: string
  updatedAt?: string
}

export default function ProductDetailPage() {
  // Cart and order state
  const { cart, addToCart } = useCart()
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const [item, setItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageItems, setImageItems] = useState<string[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  // Video player state
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoExpanded, setVideoExpanded] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const tabledata = searchParams.get('tabledata') || ''

  // Check for tabledata parameter
  useEffect(() => {
    // If tabledata exists and we don't have table info in session storage
    if (tabledata && !sessionStorage.getItem('tableInfo')) {
      // Import the table utilities dynamically
      import('@/lib/table').then(({ getTableDataFromUrl }) => {
        try {
          const tableData = getTableDataFromUrl(window.location.href)
          if (tableData) {
            // Store the table data in session storage for use across the app
            sessionStorage.setItem('tableInfo', JSON.stringify(tableData))
          } else {
            // Store the raw encrypted data for verification
            sessionStorage.setItem('pendingTableData', tabledata)
            // Redirect to the verification page
            router.push(
              `/qr-verification?tabledata=${encodeURIComponent(tabledata)}`,
            )
          }
        } catch (error) {
          console.error('Error processing table data:', error)
          // Store the raw encrypted data for verification
          sessionStorage.setItem('pendingTableData', tabledata)
          // Redirect to the verification page
          router.push(
            `/qr-verification?tabledata=${encodeURIComponent(tabledata)}`,
          )
        }
      })
    }
  }, [tabledata, router])

  // Get id from Next.js dynamic route param
  const id =
    typeof window === 'undefined'
      ? ''
      : decodeURIComponent(location.pathname.split('/').pop() || '')

  // But for SSR/Next.js, use the segment from the params if available
  // We'll use searchParams.get('id') as fallback, but Next.js should pass params
  // If you want to use params, you can accept them as a prop

  // Handle add-on selection
  const handleAddOnToggle = (name: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  // Helper function to normalize add-ons for consistent comparison across the app
  const normalizeAddOns = (addOns?: { name: string; price: number }[]) => {
    if (!addOns || addOns.length === 0) return ''
    return addOns
      .map((a) => `${a.name}:${a.price}`)
      .sort()
      .join('|')
  }

  // Function to check if item is already in cart
  const getCartQuantity = () => {
    if (!item || !cart) return 0

    // Create the current item's key
    const currentItemAddOns =
      item.addOns?.filter((a) => selectedAddOns.includes(a.name)) || []
    const currentItemKey = `${item.id}|${normalizeAddOns(currentItemAddOns)}`

    // Find matching items in cart with exact add-on configuration
    return cart.reduce((total, cartItem) => {
      const cartItemKey = `${cartItem.id}|${normalizeAddOns(cartItem.addOns)}`

      // If keys match exactly, add the quantity to the total
      if (cartItemKey === currentItemKey) {
        return total + cartItem.quantity
      }
      return total
    }, 0)
  }

  // Add to cart logic
  const handleAddToCart = () => {
    if (!item) return

    // Set isAdding to true to show loading state
    setIsAdding(true)

    // Filter add-ons based on selected ones
    const selectedItemAddOns =
      item.addOns?.filter((a) => selectedAddOns.includes(a.name)) || []

    // Add to cart with the selected quantity
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity, // Use the selected quantity
      addOns: selectedItemAddOns,
      image: item.imageURL || item.imageURLs?.[0] || '',
    })

    // Reset state after adding
    setTimeout(() => {
      setQuantity(1) // Reset quantity to 1
      setSelectedAddOns([]) // Clear selected add-ons
      setIsAdding(false) // End loading state
    }, 500) // Short delay for visual feedback
  }
  // Place order logic removed (cart modal not shown)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left, go to next
      handleNextImage()
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right, go to previous
      handlePrevImage()
    }
  }

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev)
  }

  const handleNextImage = () => {
    if (imageItems.length === 0) return
    setCurrentImageIndex((prev) =>
      prev === imageItems.length - 1 ? 0 : prev + 1,
    )
  }

  const handlePrevImage = () => {
    if (imageItems.length === 0) return
    setCurrentImageIndex((prev) =>
      prev === 0 ? imageItems.length - 1 : prev - 1,
    )
  }

  const toggleVideoExpand = () => {
    const newExpandedState = !videoExpanded
    setVideoExpanded(newExpandedState)

    // Unmute when expanded, mute when minimized
    if (newExpandedState) {
      setVideoMuted(false)
      if (videoRef.current) {
        videoRef.current.muted = false
      }
    } else {
      setVideoMuted(true)
      if (videoRef.current) {
        videoRef.current.muted = true
      }
    }
  }

  // Updated toggle function with animation controls
  //   const toggleVideoMute = (e: React.MouseEvent) => {
  //     e.stopPropagation() // Prevent toggling expand
  //     setVideoMuted((prev) => !prev)

  //     if (videoRef.current) {
  //       videoRef.current.muted = !videoMuted
  //     }
  //   }

  useEffect(() => {
    async function fetchItem() {
      setLoading(true)
      try {
        const res = await fetch('/api/menu/get-items')
        if (!res.ok) throw new Error('Failed to fetch item')
        const data = await res.json()
        // Find the item by id from the list
        const found = data.items?.find((i: MenuItem) => i.id === id)
        setItem(found || null)

        if (found) {
          // Set images for header carousel
          if (found.imageURLs && found.imageURLs.length > 0) {
            setImageItems(found.imageURLs)
          }

          // Set video URL for the persistent video player
          if (found.videoUrl) {
            setVideoUrl(found.videoUrl)
          }
        }
      } catch (error) {
        console.error('Error fetching menu item:', error)
        setError('Could not load menu item.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchItem()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#181c22] to-[#23272F]">
        <div className="flex flex-col items-center bg-[#23272F]/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-yellow-400/20 animate-fadein-card">
          <div className="relative mb-4">
            <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiCoffee className="text-yellow-400 h-8 w-8 animate-bounce-slow" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-yellow-400 mt-2 font-serif drop-shadow-lg">
            Preparing your order...
          </h1>
          <p className="text-yellow-200/80 mt-2 font-serif text-lg">
            Loading menu item details
          </p>
        </div>
      </div>
    )
  }

  if (!loading && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#181c22] to-[#23272F]">
        <div className="bg-[#23272F]/90 border border-yellow-400/20 p-8 rounded-2xl shadow-2xl max-w-md text-center flex flex-col items-center animate-fadein-card">
          <FiCoffee className="text-yellow-400 text-5xl mb-4 animate-bounce-slow" />
          <h1 className="text-2xl font-bold text-yellow-400 mb-2 font-serif drop-shadow-lg">
            {error}
          </h1>
          <p className="text-yellow-200/80 mb-4 font-serif text-lg">
            Sorry, we couldn't find this menu item.
          </p>
          <button
            onClick={() =>
              router.push(`/menu?tabledata=${encodeURIComponent(tabledata)}`)
            }
            className="mt-2 px-8 py-3 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 text-[#23272F] rounded-xl font-bold font-serif shadow-lg hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-400 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#151a22] relative pb-24 font-inter">
      {/* Modern app-like header with back button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#181C22]/95 backdrop-blur-xl shadow-lg border-b border-[#23272F]/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="p-2 rounded-full bg-gradient-to-br from-[#23272F] to-[#18382D] hover:from-[#23272F]/80 hover:to-[#18382D]/80 transition-colors flex items-center justify-center shadow-lg border border-[#23272F]/30"
            onClick={() =>
              router.push(`/menu?tabledata=${encodeURIComponent(tabledata)}`)
            }
            aria-label="Back"
          >
            <FiArrowLeft className="h-5 w-5 text-yellow-400" />
          </button>

          <h1 className="text-xl font-serif font-bold text-white drop-shadow-lg tracking-tight">
            {item?.name}
          </h1>

          <div className="relative">
            <button
              className="p-2 rounded-full bg-gradient-to-br from-[#23272F] to-[#18382D] hover:from-[#23272F]/80 hover:to-[#18382D]/80 transition-colors flex items-center justify-center shadow-lg border border-[#23272F]/30"
              onClick={() =>
                router.push(`/cart?tabledata=${encodeURIComponent(tabledata)}`)
              }
              aria-label="Cart"
            >
              <FiShoppingBag className="h-5 w-5 text-yellow-400" />
              {cart && cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg border border-yellow-200">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      {/* Modern Immersive Image Carousel Header */}
      <div
        className="w-full flex justify-center items-center mt-24"
        style={{ zIndex: 10, position: 'relative' }}
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4">
          <div className="relative bg-[#23272F] rounded-3xl shadow-2xl p-3 flex items-center justify-center border border-[#23272F]/40 w-full aspect-square max-w-md mx-auto overflow-hidden">
            <AnimatePresence initial={false}>
              {imageItems.length > 0 && (
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="w-full h-full relative cursor-zoom-in flex items-center justify-center"
                    onClick={toggleZoom}
                  >
                    <Image
                      src={imageItems[currentImageIndex]}
                      alt={`${item?.name} - image ${currentImageIndex + 1}`}
                      fill
                      className={`object-cover rounded-2xl transition-transform duration-300 ${isZoomed ? 'scale-110' : 'scale-100'} shadow-lg`}
                      priority={currentImageIndex === 0}
                    />

                    {/* Image number indicator */}
                    {imageItems.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-[#181C22]/80 backdrop-blur-md px-3 py-1.5 rounded-full text-yellow-400 text-xs font-medium border border-yellow-400/30">
                        {currentImageIndex + 1}/{imageItems.length}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 rounded-2xl"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image navigation arrows */}
            {imageItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#23272F]/80 hover:bg-yellow-500 text-yellow-400 hover:text-white p-2 rounded-full shadow-md backdrop-blur-sm border border-yellow-400/30 z-10 transition-all"
                  aria-label="Previous image"
                >
                  <FiChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#23272F]/80 hover:bg-yellow-500 text-yellow-400 hover:text-white p-2 rounded-full shadow-md backdrop-blur-sm border border-yellow-400/30 z-10 transition-all"
                  aria-label="Next image"
                >
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Image counter and dots below carousel */}
          <div className="flex flex-col items-center mt-6">
            {imageItems.length > 1 && (
              <div className="flex justify-center mt-3 gap-2">
                {imageItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      currentImageIndex === idx
                        ? 'bg-yellow-400 w-6'
                        : 'bg-[#23272F] w-2'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Floating Video Player - Always Playing */}
      {videoUrl ? (
        <div
          className={`fixed z-50 flex items-center justify-center transition-all duration-500 ease-in-out ${
            videoExpanded ? '' : 'shadow-2xl rounded-xl overflow-hidden'
          }`}
          style={
            videoExpanded
              ? {
                  left: '1rem',
                  bottom: '1rem',
                  width: '70vw', // 1/3 of viewport width
                  height: '66vh', // Portrait aspect
                  maxWidth: '400px',
                  maxHeight: '700px',
                  position: 'fixed',
                  background: 'rgba(0,0,0,0.92)',
                  borderRadius: '1.25rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }
              : {
                  left: '1.5rem',
                  bottom: '1.5rem',
                  width: '8rem',
                  height: '14rem', // Portrait aspect for minimized
                  position: 'fixed',
                  background: 'rgba(0,0,0,0.92)',
                  borderRadius: '1.25rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }
          }
        >
          {/* Cross button in minimized state */}
          {!videoExpanded && (
            <button
              onClick={() => setVideoUrl(null)}
              className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 shadow-lg"
              style={{ cursor: 'pointer' }}
              aria-label="Close video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <motion.div
            layout
            layoutId="videoPlayer"
            className={`bg-black relative w-full h-full rounded-xl overflow-hidden border border-amber-300/20`}
            onClick={toggleVideoExpand}
            style={{ cursor: 'pointer' }}
          >
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={videoMuted}
              playsInline
              className="w-full h-full object-cover"
              poster={item?.videoThumbnailUrl || item?.imageURL}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            >
              <source src={videoUrl || undefined} type="video/mp4" />
            </video>

            {/* Enhanced Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
              {/* Top controls */}
              {videoExpanded && (
                <div className="flex justify-end">
                  <div className="text-xs text-amber-100 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {item?.name} - Video Preview
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
      {/* Enhanced Image thumbnails with glossy effect */}
      <div className="w-full flex justify-center items-center mt-12 mb-2">
        <div className="flex gap-4 overflow-x-auto pb-3 px-6 snap-x snap-mandatory scrollbar-hide">
          {imageItems.map((image, idx) => (
            <motion.div
              key={idx}
              className={`relative snap-center bg-[#23272F] rounded-xl border border-yellow-400/20 shadow-lg p-2 flex items-center justify-center transition-all duration-300`}
              whileTap={{ scale: 0.97 }}
              style={{
                minWidth: '80px',
                minHeight: '80px',
                maxWidth: '90px',
                maxHeight: '90px',
              }}
            >
              <Image
                src={image}
                alt={`${item?.name} - thumbnail ${idx + 1}`}
                width={72}
                height={72}
                onClick={() => setCurrentImageIndex(idx)}
                className="rounded-lg object-cover border border-yellow-400/30 transition-all hover:opacity-100 cursor-pointer"
                style={{
                  width: '72px',
                  height: '72px',
                  opacity: currentImageIndex === idx ? 1 : 0.7,
                  boxShadow:
                    currentImageIndex === idx
                      ? '0 4px 16px rgba(255,193,7,0.18)'
                      : 'none',
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
      {/* Premium content card with luxury café design */}
      <div
        className="relative z-20 w-full max-w-md mb-10 rounded-2xl p-6 product-detail-card mx-auto flex flex-col items-center bg-gradient-to-br from-[#181c22] to-[#23272F] shadow-2xl border border-[#23272F]/40"
        style={{ marginTop: '1rem' }}
      >
        {/* Tag badges */}
        <div className="flex gap-2 mb-4">
          {/* Availability indicator */}
          {item?.available ? (
            <span className="bg-green-50 text-green-700 border border-green-200 text-sm px-3 py-1 rounded-full font-medium shadow-sm flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Available
            </span>
          ) : (
            <span className="bg-red-50 text-red-600 border border-red-200 text-sm px-3 py-1 rounded-full font-medium shadow-sm flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
              Unavailable
            </span>
          )}

          {/* Category badge */}
          <span className="bg-gradient-to-r from-primary to-secondary shadow-white/[0.5] shadow-inner text-white text-sm px-4 py-1.5 rounded-full font-medium border-primary/10 border flex items-center gap-1">
            <FiCoffee className="mr-1" />
            {item?.category}
          </span>
        </div>

        {/* Product name and price */}
        <h1 className="text-2xl font-normal font-serif text-white mb-2 text-center drop-shadow-lg">
          {item?.name}
        </h1>
        <div className="text-lg font-bold text-yellow-400 mb-4">
          ₹{item?.price.toFixed(0)}
        </div>

        {/* Chef's Special Recommendation */}
        <div className="mb-2 text-left font-serif w-full">
          <span className="text-yellow-400 font-semibold">
            Chef's Special Recommendation
          </span>
          <p className="text-gray-300 text-sm mt-1">{item?.description}</p>
        </div>

        {/* Customize Your Dish */}
        <div className="w-full mt-6">
          <details className="mb-4">
            <summary className="font-semibold font-serif text-white cursor-pointer py-2">
              Customize Your Dish
            </summary>
            {/* Spice Level */}
            <div className="mt-3 mb-2">
              <span className="text-sm text-gray-200 mb-2 font-serif block">
                Spice Level
              </span>
              <div className="flex gap-2">
                {['Mild', 'Medium', 'Spicy'].map((level) => (
                  <button
                    key={level}
                    className={`px-4 py-1 rounded-full text-xs font-semibold border font-serif transition-all ${
                      selectedAddOns.includes(level)
                        ? 'bg-yellow-400 text-[#23272F] border-yellow-400'
                        : 'bg-[#23272F] text-yellow-400 border-yellow-400/30'
                    }`}
                    onClick={() => handleAddOnToggle(level)}
                    type="button"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            {/* Add Extra */}
            {item?.addOns && item?.addOns.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-200 mb-2 block">
                  Add Extra
                </span>
                <div className="flex flex-col gap-2">
                  {item?.addOns.map((addon, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(addon.name)}
                        onChange={() => handleAddOnToggle(addon.name)}
                        disabled={!addon.available}
                        className="accent-yellow-400 w-4 h-4"
                      />
                      <span
                        className={`text-sm ${
                          addon.available ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {addon.name}{' '}
                        <span className="text-yellow-400 font-semibold">
                          (+₹{addon.price.toFixed(0)})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </details>
        </div>

        {/* Quantity Selector */}
        <div className="w-full flex items-center font-serif justify-between mt-4 mb-6">
          <span className="font-semibold text-gray-200">Quantity</span>
          <div className="flex items-center gap-1 bg-[#181C22] p-1 rounded-lg border border-[#23272F]/40">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-yellow-400 hover:bg-[#23272F]/80 transition-colors"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <FiMinus size={18} />
            </button>
            <span className="font-bold text-lg px-3 text-yellow-400">
              {quantity}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-yellow-400 hover:bg-[#23272F]/80 transition-colors"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          className="w-full py-4 rounded-xl font-bold font-serif text-lg bg-yellow-400 text-[#23272F] flex items-center justify-center gap-2 shadow-lg hover:bg-yellow-500 transition-all"
          disabled={!item?.available || isAdding}
          onClick={handleAddToCart}
        >
          <FiShoppingBag className="h-5 w-5" />
          Add to Cart
        </button>
      </div>
      <div
        className="flex w-full pb-5 flex-row justify-center items-center product-add-to-order-row"
        style={{ zIndex: 30, position: 'relative' }}
      >
        <button
          className={`w-[95%] max-w-md py-4 shadow-inner shadow-yellow-400/[0.5] rounded-2xl font-extrabold font-serif text-lg tracking-wide relative overflow-hidden transition-all duration-300 product-add-to-order-btn ${
            item?.available && !isAdding
              ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-400 text-[#23272F] hover:scale-[1.02]'
              : 'bg-[#23272F]/40 cursor-not-allowed text-gray-500'
          }`}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto',
          }}
          disabled={!item?.available || isAdding}
          onClick={handleAddToCart}
        >
          {/* Add shine effect for available items */}
          {item?.available && !isAdding && (
            <span className="absolute inset-0 overflow-hidden">
              <span className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine"></span>
            </span>
          )}

          <div className="flex items-center justify-center">
            {item?.available ? (
              isAdding ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#23272F]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {getCartQuantity() > 0
                    ? `In Cart: ${getCartQuantity()} | Add ${quantity} More`
                    : `Add to Order (${quantity})`}
                </>
              )
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Currently Unavailable
              </>
            )}
          </div>
        </button>
      </div>

      {/* Enhanced decorative elements */}
      {/* <div className="absolute top-8 right-8 z-30 animate-float">
        <FiCoffee className="text-yellow-400 text-5xl md:text-6xl opacity-40" />
      </div> */}
      <div className="absolute bottom-8 left-8 z-30 animate-float-delay pointer-events-none">
        <FiCoffee className="text-yellow-500 text-4xl md:text-5xl opacity-30" />
      </div>
      {/* Additional decorative elements */}
      <div className="absolute top-1/4 left-12 z-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-12 z-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
      {/* Enhanced responsive and animation styles */}
      <style jsx global>{`
        body {
          background: #181c22 !important;
          color: #fff;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }
        .product-detail-card,
        .product-title-price,
        .product-title,
        .product-category-row,
        .product-add-order-section,
        .product-quantity-row,
        .product-description-row,
        .product-description,
        .product-ingredients-row,
        .product-addons-row {
          text-align: center;
          align-items: center;
          justify-content: center;
        }
        .product-add-to-order-row,
        .product-add-to-order-btn,
        .product-cart-place-order-btn {
          text-align: center !important;
          align-items: center !important;
          justify-content: center !important;
        }
        @media (max-width: 900px) {
          .product-detail-card,
          .product-title-price,
          .product-title,
          .product-category-row,
          .product-add-order-section,
          .product-quantity-row,
          .product-description-row,
          .product-description,
          .product-ingredients-row,
          .product-addons-row {
            text-align: left !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
          }
        }
        .product-add-to-order-row,
        .product-add-to-order-btn,
        .product-cart-place-order-btn {
          text-align: center !important;
          align-items: center !important;
          justify-content: center !important;
        }
        @media (max-width: 768px) {
          .max-w-2xl {
            max-width: 95vw !important;
          }
          .p-8 {
            padding: 1.5rem !important;
          }
          .mt-8 {
            margin-top: 0.5rem !important;
          }
          .mb-8 {
            margin-bottom: 0.5rem !important;
          }
        }

        /* Advanced animations */
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadein {
          animation: fadein 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fadein-card {
          animation: fadein 0.9s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0);
          }
          25% {
            transform: translateY(-8px) rotate(-3deg);
          }
          75% {
            transform: translateY(8px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 7s ease-in-out infinite 0.5s;
        }

        @keyframes shine {
          from {
            transform: translateX(-100%) skewX(15deg);
          }
          to {
            transform: translateX(200%) skewX(15deg);
          }
        }
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }

        @keyframes slow-zoom {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite;
        }

        @keyframes subtle-zoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 10s ease-in-out infinite alternate;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slow-delay {
          animation: pulse-slow 9s ease-in-out infinite 2s;
        }

        /* Background noise texture */
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
        }
      `}</style>
    </div>
  )
}
