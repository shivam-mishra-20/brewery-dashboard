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

  const tabledata = searchParams?.get('tabledata') || ''

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
            Sorry, we couldn&apos;t find this menu item.
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
    <div className="min-h-screen flex flex-col bg-[#0e0e0e] relative pb-24 font-inter">
      {/* Modern app-like header with back button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/95 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="p-2 rounded-full bg-[#1a1a1a] hover:bg-[#252525] transition-colors flex items-center justify-center"
            onClick={() =>
              router.push(`/menu?tabledata=${encodeURIComponent(tabledata)}`)
            }
            aria-label="Back"
          >
            <FiArrowLeft className="h-5 w-5 text-[#f59e0b]" />
          </button>

          <h1 className="text-xl font-serif font-medium text-white drop-shadow-sm tracking-tight">
            {item?.name}
          </h1>

          <div className="relative">
            <button
              className="p-2 rounded-full bg-[#1a1a1a] hover:bg-[#252525] transition-colors flex items-center justify-center"
              onClick={() =>
                router.push(`/cart?tabledata=${encodeURIComponent(tabledata)}`)
              }
              aria-label="Cart"
            >
              <FiShoppingBag className="h-5 w-5 text-[#f59e0b]" />
              {cart && cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#f59e0b] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modern Immersive Image Carousel Header */}
      <div
        className="w-full flex justify-center items-center mt-16"
        style={{ zIndex: 10, position: 'relative' }}
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4">
          <div className="relative bg-[#1a1a1a] rounded-xl shadow-xl p-2 flex items-center justify-center w-full aspect-square max-w-md mx-auto overflow-hidden">
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
                      className={`object-cover rounded-lg transition-transform duration-300 ${isZoomed ? 'scale-110' : 'scale-100'}`}
                      priority={currentImageIndex === 0}
                    />

                    {/* Image number indicator */}
                    {imageItems.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-[#000000]/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium">
                        {currentImageIndex + 1}/{imageItems.length}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 rounded-lg"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image navigation arrows */}
            {imageItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#000000]/60 hover:bg-[#f59e0b] text-white p-2 rounded-full shadow-md backdrop-blur-sm z-10 transition-all"
                  aria-label="Previous image"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#000000]/60 hover:bg-[#f59e0b] text-white p-2 rounded-full shadow-md backdrop-blur-sm z-10 transition-all"
                  aria-label="Next image"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Image counter and dots below carousel */}
          {imageItems.length > 1 && (
            <div className="flex justify-center mt-3 gap-2">
              {imageItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentImageIndex === idx
                      ? 'bg-[#f59e0b] w-6'
                      : 'bg-gray-600 w-1.5'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Video Player - Keep existing code */}
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
                  width: '70vw',
                  height: '66vh',
                  maxWidth: '400px',
                  maxHeight: '700px',
                  position: 'fixed',
                  background: 'rgba(0,0,0,0.92)',
                  borderRadius: '1rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }
              : {
                  left: '1.5rem',
                  bottom: '1.5rem',
                  width: '8rem',
                  height: '14rem',
                  position: 'fixed',
                  background: 'rgba(0,0,0,0.92)',
                  borderRadius: '1rem',
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

      {/* Product info card - Styled to match the image */}
      <div className="w-full max-w-md mx-auto mt-8 px-5">
        {/* Category and tags */}
        <div className="flex gap-2 mb-2">
          {item?.available ? (
            <span className="text-xs px-3 py-1 rounded-full bg-[#1c2c1c] text-green-500 font-medium flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
              Available
            </span>
          ) : (
            <span className="text-xs px-3 py-1 rounded-full bg-[#2c1c1c] text-red-400 font-medium flex items-center">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
              Unavailable
            </span>
          )}

          <span className="text-xs px-3 py-1 rounded-full bg-[#1a1a1a] text-[#f59e0b] font-medium">
            {item?.category}
          </span>
        </div>

        {/* Title and price */}
        <h1 className="text-2xl font-serif text-white mb-1">{item?.name}</h1>
        <div className="text-xl font-serif text-[#f59e0b] font-semibold mb-4">
          ₹{item?.price.toFixed(0)}
        </div>

        {/* Chef's recommendation - styled like in the image */}
        <div className="mb-6">
          <h3 className="text-sm text-[#f59e0b] font-semibold mb-1">
            Chef&apos;s Special
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {item?.description}
          </p>
        </div>

        {/* Customize Your Dish - styled like in the image */}
        <div className="bg-[#1a1a1a] rounded-lg p-5 mb-6">
          <details className="group" open>
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <h3 className="text-white font-medium">Customize Your Dish</h3>
              <span className="transform group-open:rotate-180 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="text-[#f59e0b]"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                  />
                </svg>
              </span>
            </summary>

            {/* Spice Level */}
            <div className="mt-4">
              <span className="text-xs text-gray-400 mb-2 block">
                Spice Level
              </span>
              <div className="flex gap-2 mt-1">
                {['Mild', 'Medium', 'Spicy'].map((level) => (
                  <button
                    key={level}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedAddOns.includes(level)
                        ? 'bg-[#f59e0b] text-black'
                        : 'bg-[#252525] text-white'
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
              <div className="mt-4">
                <span className="text-xs text-gray-400 mb-2 block">
                  Add Extra
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  {item?.addOns.map((addon, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                        selectedAddOns.includes(addon.name)
                          ? 'bg-[#252525]'
                          : 'bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addon.name)}
                          onChange={() => handleAddOnToggle(addon.name)}
                          disabled={!addon.available}
                          className="accent-[#f59e0b] w-4 h-4 mr-3"
                        />
                        <span
                          className={`text-sm ${
                            addon.available ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-[#f59e0b] text-sm font-medium">
                        +₹{addon.price.toFixed(0)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </details>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white">Quantity</span>
          <div className="flex items-center bg-[#1a1a1a] rounded-lg">
            <button
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#252525] rounded-l-lg transition-colors"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <FiMinus size={18} />
            </button>
            <span className="font-bold text-lg px-5 text-white">
              {quantity}
            </span>
            <button
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#252525] rounded-r-lg transition-colors"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-[#0e0e0e]/95 backdrop-blur-xl p-4 border-t border-[#252525]">
        <button
          className="w-full py-3.5 rounded-lg font-medium text-base bg-[#f59e0b] text-black flex items-center justify-center gap-2 transition-all hover:bg-[#e08900]"
          disabled={!item?.available || isAdding}
          onClick={handleAddToCart}
        >
          {isAdding ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-1"
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
              <FiShoppingBag className="h-5 w-5" />
              {getCartQuantity() > 0
                ? `In Cart: ${getCartQuantity()} | Add ${quantity} More`
                : `Add to Cart`}
            </>
          )}
        </button>
      </div>

      {/* Clean up styles and remove decorative elements for a more minimal design */}
      <style jsx global>{`
        body {
          background: #0e0e0e !important;
          color: #fff;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }

        /* Animation keyframes */
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadein {
          animation: fadein 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
