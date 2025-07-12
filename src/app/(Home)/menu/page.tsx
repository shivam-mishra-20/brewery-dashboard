'use client'

import CryptoJS from 'crypto-js'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { BiSolidFoodMenu } from 'react-icons/bi'
import { FiCoffee, FiShoppingBag } from 'react-icons/fi'
import { MdOutlineTableRestaurant } from 'react-icons/md'

interface TableData {
  name: string
  number: number
  capacity: number
  status: string
  location?: string
  _id?: string
  timestamp?: number
  [key: string]: any // For any other properties
}

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

const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'your-very-secret-key'

function MenuContent() {
  const searchParams = useSearchParams()
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true)

  useEffect(() => {
    // Get table data from URL
    const tableDataParam = searchParams.get('tabledata')

    if (tableDataParam) {
      try {
        // Decrypt and parse the table data
        const decrypted = CryptoJS.AES.decrypt(
          decodeURIComponent(tableDataParam),
          QR_SECRET,
        ).toString(CryptoJS.enc.Utf8)
        const decodedData = JSON.parse(decrypted)
        setTableData(decodedData)
      } catch (err) {
        console.error('Error parsing table data:', err)
        setError('Invalid table data in QR code')
      }
    }

    // Fetch menu items
    fetchMenuItems()
  }, [searchParams])

  // Fetch menu items from API
  const fetchMenuItems = async () => {
    try {
      setLoadingMenu(true)
      // Fetch from real API
      const response = await fetch('/api/menu/get-items')

      if (!response.ok) {
        throw new Error('Failed to fetch menu items')
      }

      const data = await response.json()

      // Map API response to our MenuItem interface
      const apiMenuItems: MenuItem[] = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || '',
        imageURL: item.imageURL || '',
        images: item.images || [],
        imageURLs: item.imageURLs || [],
        videoUrl: item.videoUrl || '',
        videoThumbnailUrl: item.videoThumbnailUrl || '',
        available: item.available,
        ingredients: item.ingredients || [],
        addOns: item.addOns || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))

      setMenuItems(apiMenuItems)
      setLoadingMenu(false)
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setLoadingMenu(false)

      // Fallback to empty array if API fails
      setMenuItems([])
    }
  }

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map((item) => item.category))]

  // Filter menu items by category
  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-500">Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute top-1/4 left-12 z-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-12 z-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-noise opacity-[0.01]"></div>

      {/* Enhanced header with logo and table info */}
      <header className="relative bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="relative">
                <FiCoffee className="text-amber-600 text-3xl relative z-10" />
                <div className="absolute -inset-1 bg-amber-100 rounded-full blur-sm z-0"></div>
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600">
                Work Brew Café
              </h1>
            </div>

            <div className="flex items-center gap-2 text-sm bg-white/90 backdrop-blur-sm px-5 py-3 rounded-xl shadow-md border border-amber-100 animate-fadein">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <MdOutlineTableRestaurant className="text-amber-600" />
              </div>
              <span className="font-semibold text-gray-700">
                {tableData.name} - Table #{tableData.number}
              </span>
              <span className="mx-1 text-amber-300">•</span>
              {tableData.location && (
                <span className="text-gray-500">{tableData.location}</span>
              )}
              <span className="mx-1 text-amber-300">•</span>
              <span className="text-gray-500">{tableData.capacity} people</span>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced main content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Menu header with premium styling */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600">
              <div className="relative">
                <BiSolidFoodMenu className="text-amber-500 text-3xl" />
                <div className="absolute -inset-1 bg-amber-100 rounded-full blur-sm -z-10"></div>
              </div>
              Our Menu
            </h2>
            <p className="text-gray-600 mt-1 pl-9">
              Fresh and delicious offerings made with love
            </p>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full mt-2 ml-9"></div>
          </div>

          {/* Enhanced order button */}
          <button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-md transition-all duration-300 hover:scale-105 transform">
            <FiShoppingBag className="text-amber-200" />
            <span>Start Order</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Enhanced category filters */}
        <div className="mb-10 overflow-x-auto pb-3 px-2 -mx-2">
          <div className="flex gap-3 min-w-max">
            {categories.map((category, index) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 animate-fadein shadow-sm ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md scale-105'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-amber-100/80 hover:text-amber-800 border border-amber-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced menu items grid with premium styling */}
        {loadingMenu ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-amber-300 opacity-30 blur-sm"></div>
            </div>
            <p className="mt-4 text-amber-800 font-medium">
              Loading menu items...
            </p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-amber-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer animate-fadein-card group"
                onClick={() => {
                  const tableDataParam = searchParams.get('tabledata')
                  let url = `/menu/${item.id}`
                  if (tableDataParam) {
                    url += `?tabledata=${encodeURIComponent(tableDataParam)}`
                  }
                  window.location.href = url
                }}
              >
                {/* Enhanced media container with premium styling */}
                <div className="relative h-56 w-full bg-amber-50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
                  <Image
                    src={
                      item.imageURL ||
                      item.imageURLs?.[0] ||
                      '/placeholder-food.jpg'
                    }
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority={idx < 6} // Prioritize loading for first 6 items
                  />

                  {/* Unavailable overlay with improved styling */}
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-sm">
                      <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/20">
                        <span className="text-white font-bold text-lg">
                          Currently Unavailable
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced category badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-amber-700 shadow-md border border-amber-100 z-20">
                    {item.category}
                  </div>

                  {/* Enhanced video indicator */}
                  {item.videoUrl && (
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white flex items-center gap-1.5 z-20 border border-white/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Watch Video
                    </div>
                  )}

                  {/* Enhanced image gallery indicator */}
                  {item.imageURLs && item.imageURLs.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white flex items-center gap-1.5 z-20 border border-white/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {item.imageURLs.length} Photos
                    </div>
                  )}
                </div>

                {/* Enhanced content with premium styling */}
                <div className="p-5 relative">
                  {/* Decorative element */}
                  <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-amber-400/10 rounded-full blur-xl"></div>

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-bold text-white px-3 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 shadow-sm">
                      ₹{(item.price / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Premium add to order button */}
                  <button
                    className={`w-full font-medium py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                      item.available
                        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-800 border border-amber-200 shadow-sm hover:shadow'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (item.available) {
                        // Add to order logic
                      }
                    }}
                    disabled={!item.available}
                  >
                    {item.available ? (
                      <>
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
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Add to Order
                      </>
                    ) : (
                      <>
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
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Unavailable
                      </>
                    )}
                  </button>

                  {/* Enhanced add-ons indicator */}
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                      {item.addOns.length} Customizations available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 text-center shadow-md border border-amber-100">
            <div className="bg-amber-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <FiCoffee className="text-4xl text-amber-400" />
            </div>
            <h3 className="text-2xl font-semibold text-amber-800 mb-2">
              No items found
            </h3>
            <p className="text-gray-600">
              No menu items are available in this category
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className="mt-4 px-6 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-colors"
            >
              View all items
            </button>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 z-0 animate-float-delay">
          <FiCoffee className="text-amber-300/30 text-5xl md:text-6xl" />
        </div>
        <div className="absolute bottom-10 left-10 z-0 animate-float">
          <FiCoffee className="text-amber-400/30 text-4xl md:text-5xl" />
        </div>
      </main>

      {/* Enhanced footer */}

      {/* Add animations and styles */}
      <style jsx global>{`
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

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
            <h1 className="text-xl font-bold text-amber-800">
              Loading menu...
            </h1>
          </div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  )
}
