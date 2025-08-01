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
  FiImage,
} from 'react-icons/fi'
import { useOrder } from '@/hooks/useOrder'

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
  const [cart, setCart] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { placeOrder } = useOrder()

  // Add to cart logic
  const addToCart = (item: any) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (ci) =>
          ci.id === item.id &&
          JSON.stringify(ci.addOns) === JSON.stringify(item.addOns),
      )
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx].quantity += item.quantity
        return updated
      }
      return [...prev, item]
    })
    setShowCart(true)
    setOrderFeedback('Added to cart!')
    setTimeout(() => setOrderFeedback(null), 1500)
  }
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== id))
  }
  const clearCart = () => setCart([])
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

  // Get id from Next.js dynamic route param
  const id =
    typeof window === 'undefined'
      ? ''
      : decodeURIComponent(location.pathname.split('/').pop() || '')

  // But for SSR/Next.js, use the segment from the params if available
  // We'll use searchParams.get('id') as fallback, but Next.js should pass params
  // If you want to use params, you can accept them as a prop
  const tabledata = searchParams?.get('tabledata') || ''

  // Handle add-on selection
  const handleAddOnToggle = (name: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  // Add to cart logic
  const handleAddToCart = () => {
    if (!item) return
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      addOns: item.addOns?.filter((a) => selectedAddOns.includes(a.name)) || [],
      image: item.imageURLs?.[0] || item.imageURL || '',
    })
    setShowCart(true)
    setOrderFeedback('Added to cart!')
    setTimeout(() => setOrderFeedback(null), 1500)
  }

  // Place order logic (only from cart UI)
  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    try {
      const orderData = {
        items: cart.map((cartItem) => ({
          menuItemId: cartItem.id,
          quantity: cartItem.quantity,
          selectedAddOns:
            cartItem.addOns?.map((a: any) => ({
              name: a.name,
              price: a.price,
            })) || [],
        })),
        tabledata,
        customerName: 'Guest',
        tableId: tabledata,
      }
      await placeOrder(orderData)
      setOrderFeedback('Order placed successfully!')
      setOrderStatus('Order placed successfully!')
      clearCart()
    } catch {
      setOrderFeedback('Failed to place order.')
      setOrderStatus('Failed to place order.')
    } finally {
      setPlacingOrder(false)
      setTimeout(() => setOrderFeedback(null), 2000)
    }
  }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-amber-50">
        <div className="flex flex-col items-center bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiCoffee className="text-amber-500 h-8 w-8" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-amber-700 mt-4">
            Preparing your order...
          </h1>
          <p className="text-amber-600/80 mt-2">Loading menu item details</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-yellow-50">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md text-center">
          <FiCoffee className="text-red-400 text-4xl mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-500 mb-2">
            {error || 'Item not found'}
          </h1>
          <button
            onClick={() =>
              router.push(`/menu?tabledata=${encodeURIComponent(tabledata)}`)
            }
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Back to menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-white relative pb-24">
      {' '}
      {/* Add bottom padding for navbar */}
      {/* App-like header with back button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            className="p-2 rounded-full bg-white shadow-md hover:bg-amber-50 transition-colors"
            onClick={() =>
              router.push(`/menu?tabledata=${encodeURIComponent(tabledata)}`)
            }
          >
            <FiArrowLeft className="h-6 w-6 text-amber-700" />
          </button>

          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-800 to-amber-600">
            {item.name}
          </h1>

          <div className="p-2 rounded-full bg-white shadow-md">
            <FiCoffee className="h-6 w-6 text-amber-700" />
          </div>
        </div>
      </header>
      {/* Immersive Image Carousel Header */}
      <div
        className="w-full flex justify-center items-center mt-28"
        style={{ zIndex: 10, position: 'relative' }}
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative flex flex-col items-center justify-center">
          <div
            className="relative bg-white rounded-3xl shadow-2xl p-8 flex items-center justify-center border border-amber-100"
            style={{
              width: '350px',
              height: '350px',
              boxShadow:
                '0 12px 32px rgba(255,193,7,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <AnimatePresence initial={false}>
              {imageItems.length > 0 && (
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute   inset-0 flex items-center justify-center"
                >
                  <div
                    className="w-full h-full relative cursor-zoom-in flex items-center justify-center"
                    onClick={toggleZoom}
                  >
                    <Image
                      src={imageItems[currentImageIndex]}
                      alt={`${item.name} - image ${currentImageIndex + 1}`}
                      fill
                      className={`object-cover rounded-2xl transition-transform duration-300 border-2 border-amber-100 shadow-lg ${isZoomed ? 'scale-110' : 'scale-100'}`}
                      priority={currentImageIndex === 0}
                      style={{
                        borderRadius: '1.5rem',
                        boxShadow: '0 8px 24px rgba(255,193,7,0.18)',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 rounded-2xl"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image navigation arrows */}
            {imageItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-amber-100 text-amber-700 p-3 rounded-full shadow-lg border border-amber-200 z-10"
                  aria-label="Previous image"
                >
                  <FiChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-amber-100 text-amber-700 p-3 rounded-full shadow-lg border border-amber-200 z-10"
                  aria-label="Next image"
                >
                  <FiChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {/* Image counter and dots below carousel */}
          <div className="flex flex-col items-center mt-6">
            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md rounded-full px-5 py-2 text-amber-700 text-base shadow-lg border border-amber-100">
              <FiImage className="mr-1 text-amber-400" />
              <span>
                {currentImageIndex + 1} / {imageItems.length}
              </span>
            </div>
            {imageItems.length > 1 && (
              <div className="flex justify-center mt-3 gap-3">
                {imageItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      currentImageIndex === idx
                        ? ' scale-110 shadow-lg'
                        : 'bg-white border-amber-200'
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
              poster={item.videoThumbnailUrl || item.imageURL}
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
                    {item.name} - Video Preview
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
      {/* Enhanced Image thumbnails with glossy effect */}
      <div className="w-full  flex justify-center items-center mt-12 mb-2">
        <div className="flex gap-4 overflow-x-auto pb-3 px-6 snap-x snap-mandatory scrollbar-hide">
          {imageItems.map((image, idx) => (
            <motion.div
              key={idx}
              className={`relative snap-center ${
                currentImageIndex === idx ? '' : ''
              } bg-white rounded-xl border border-amber-100 shadow-md p-2 flex items-center justify-center transition-all duration-300`}
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
                alt={`${item.name} - thumbnail ${idx + 1}`}
                width={72}
                height={72}
                onClick={() => setCurrentImageIndex(idx)}
                className="rounded-lg object-cover border border-gray-200 transition-all hover:opacity-100 cursor-pointer"
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
        className="relative z-20 w-full max-w-2xl mb-10 rounded-2xl p-6 product-detail-card mx-auto flex flex-col items-center"
        style={{ marginTop: '1rem' }}
      >
        {/* Product name and price - responsive alignment */}
        <div className="mb-6 product-title-price w-full flex flex-col items-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-2 product-title w-full text-center">
            {item.name}
          </h1>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-4 py-2 rounded-lg border border-amber-300 shadow-sm">
              ₹{item.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Category and availability indicators with improved styling */}
        <div className="flex flex-wrap items-center gap-2 mb-4 product-category-row w-full justify-center">
          <span className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-white/[0.5] shadow-inner text-white text-sm px-4 py-1.5 rounded-full font-medium  border-amber-500/[0.1] border flex items-center gap-1">
            <FiCoffee className="mr-1" />
            {item.category}
          </span>
          {item.available ? (
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
        </div>

        {/* Premium add to order button with quantity and feedback */}
        <div className="mt-6 relative w-full flex flex-col items-center justify-center product-add-order-section">
          {/* Decorative element */}
          <div className="absolute -left-2 -bottom-2 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl"></div>
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-amber-500/20 rounded-full blur-xl"></div>

          <div className="w-full flex flex-col items-center product-quantity-row">
            <div className="flex items-center gap-4 mb-2 w-full justify-start">
              <div className="flex items-center gap-2 w-1/2 justify-start">
                <span className="font-semibold text-amber-700">Quantity:</span>
                <button
                  className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-lg"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="font-bold text-lg px-2">{quantity}</span>
                <button
                  className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-lg"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {orderFeedback && (
              <div className="mt-2 text-center text-amber-700 font-bold animate-fadein-card">
                {orderFeedback}
              </div>
            )}
          </div>
        </div>
        {/* Enhanced description with quote styling */}
        <div className="relative mb-8 overflow-hidden product-description-row w-full flex justify-center">
          <p className="text-lg text-gray-700 italic pt-6 pb-4 rounded-xl shadow-sm product-description w-full text-center">
            &quot;{item.description}&quot;
          </p>
        </div>

        {/* Ingredients with enhanced visual styling */}
        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mb-8 w-full product-ingredients-row flex flex-col items-center">
            <div className="flex items-center justify-center w-full my-4">
              <h3 className="mx-4 text-xl font-bold text-amber-800 flex justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Ingredients
              </h3>
              <div className="h-px flex-grow bg-amber-200"></div>
            </div>
            <div className="grid w-full items-start grid-cols-1 sm:grid-cols-2 gap-3">
              {item.ingredients.map((ingredient, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-md hover:shadow-lg transition-all duration-300 animate-fadein-card`}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-amber-400"></div>
                    <span className="font-medium text-gray-800 text-sm md:text-base">
                      {ingredient.inventoryItemName}
                    </span>
                  </div>
                  <span className="ml-2 text-sm text-gray-600 font-semibold bg-white px-2 py-1 rounded border border-gray-200">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Enhanced Add-ons section with cart logic */}
        {item.addOns && item.addOns.length > 0 && (
          <div className="mb-8 w-full product-addons-row flex flex-col items-center">
            <div className="flex items-center justify-center w-full my-4">
              <h3 className="mx-4 text-xl font-bold text-amber-800 flex justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Customizations
              </h3>
              <div className="h-px flex-grow bg-amber-200"></div>
            </div>

            <div className="grid grid-cols-1 w-full sm:grid-cols-2 gap-3">
              {item.addOns.map((addon, idx) => (
                <div
                  key={idx}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    addon.available
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
                      : 'bg-gray-100 border border-gray-200 opacity-60'
                  } shadow-md hover:shadow-lg transition-all duration-300 animate-fadein-card`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${addon.available ? 'bg-amber-400' : 'bg-gray-300'}`}
                    ></div>
                    <span className="font-medium text-gray-800 text-sm md:text-base">
                      {addon.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`${addon.available ? 'text-amber-700' : 'text-gray-500'} font-bold text-xs md:text-base px-2 py-1 rounded-md ${addon.available ? 'bg-amber-100' : 'bg-gray-100'}`}
                    >
                      + ₹{addon.price.toFixed(2)}
                    </span>
                    <button
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transform transition-transform duration-200 hover:scale-110 ${
                        addon.available
                          ? selectedAddOns.includes(addon.name)
                            ? 'bg-amber-600 text-white border-amber-700 border-2'
                            : 'bg-gradient-to-r from-primary to-secondary shdow-inner shadow-white/[0.4] border border-primary/[0.1] hover:from-amber-600 hover:to-amber-500 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!addon.available}
                      onClick={() => handleAddOnToggle(addon.name)}
                      aria-label={
                        selectedAddOns.includes(addon.name)
                          ? 'Remove add-on'
                          : 'Add add-on'
                      }
                    >
                      {selectedAddOns.includes(addon.name) ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
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
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Cart UI */}
        {showCart && (
          <div
            className="fixed bottom-24 right-0 z-[60] w-full max-w-md bg-white/95 shadow-2xl rounded-t-2xl border-t border-amber-200 p-6 animate-fadein-card product-cart-ui"
            style={{ marginRight: '1rem' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-800">Your Cart</h2>
              <button
                className="text-amber-500 hover:text-amber-700 font-bold"
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="text-gray-500">Cart is empty.</div>
            ) : (
              <div className="space-y-4">
                {cart.map((cartItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-amber-50 rounded-xl p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={cartItem.image}
                        alt={cartItem.name}
                        width={48}
                        height={48}
                        className="rounded-lg border border-amber-200"
                      />
                      <div>
                        <div className="font-bold text-amber-900">
                          {cartItem.name}
                        </div>
                        <div className="text-sm text-gray-700">
                          Qty: {cartItem.quantity}
                        </div>
                        {cartItem.addOns && cartItem.addOns.length > 0 && (
                          <div className="text-xs text-amber-700">
                            Add-ons:{' '}
                            {cartItem.addOns.map((a: any) => a.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-amber-700">
                        ₹
                        {(
                          cartItem.price * cartItem.quantity +
                          (cartItem.addOns?.reduce(
                            (sum: number, a: any) => sum + a.price,
                            0,
                          ) || 0) *
                            cartItem.quantity
                        ).toFixed(2)}
                      </span>
                      <button
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                        onClick={() => removeFromCart(cartItem.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-lg text-amber-900">
                    Total:
                  </span>
                  <span className="font-extrabold text-xl text-amber-700">
                    ₹
                    {cart
                      .reduce(
                        (total, ci) =>
                          total +
                          (ci.price * ci.quantity +
                            (ci.addOns?.reduce(
                              (sum: number, a: any) => sum + a.price,
                              0,
                            ) || 0) *
                              ci.quantity),
                        0,
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <button
                  className="w-full py-3 mt-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-secondary shdow-inner shadow-white/[0.4] border border-primary/[0.1] text-white shadow-lg hover:from-amber-700 hover:to-yellow-600 transition-all product-cart-place-order-btn"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
                {orderStatus && (
                  <div className="mt-2 text-center text-green-700 font-bold animate-fadein-card">
                    {orderStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="flex w-full pb-5 flex-row justify-center items-center product-add-to-order-row"
        style={{ zIndex: 30, position: 'relative' }}
      >
        <button
          className={`w-[95%] max-w-md py-4 shadow-inner shadow-white/[0.5] rounded-2xl font-extrabold text-lg tracking-wide font-inter relative overflow-hidden transition-all duration-300 product-add-to-order-btn ${
            item.available
              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600 text-white hover:scale-[1.02]'
              : 'bg-gray-300 cursor-not-allowed text-gray-500'
          }`}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto',
          }}
          disabled={!item.available}
          onClick={handleAddToCart}
        >
          {/* Add shine effect for available items */}
          {item.available && (
            <span className="absolute inset-0 overflow-hidden">
              <span className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine"></span>
            </span>
          )}

          <div className="flex items-center justify-center">
            {item.available ? (
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
                Add to Order
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
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Currently Unavailable
              </>
            )}
          </div>
        </button>
      </div>
      {/* Enhanced background image when no video is available */}
      {!item.videoUrl && item.imageURLs && item.imageURLs.length > 0 && (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <Image
            src={item.imageURLs[currentImageIndex]}
            alt={item.name}
            fill
            className="object-cover blur-md brightness-[0.65] scale-110 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-[1.5px]" />
          {/* Ambient particles effect */}
          <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
        </div>
      )}
      {/* Enhanced decorative elements */}
      <div className="absolute top-8 right-8 z-30 animate-float">
        <FiCoffee className="text-amber-300 text-5xl md:text-6xl opacity-40" />
      </div>
      <div className="absolute bottom-8 left-8 z-30 animate-float-delay pointer-events-none">
        <FiCoffee className="text-amber-400 text-4xl md:text-5xl opacity-30" />
      </div>
      {/* Additional decorative elements */}
      <div className="absolute top-1/4 left-12 z-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-12 z-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
      {/* Enhanced responsive and animation styles */}
      <style jsx global>{`
        /* Responsive alignment for product detail page */
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
        /* Always center the Add to Order button */
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
