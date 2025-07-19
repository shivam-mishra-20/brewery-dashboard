'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiCoffee, FiTruck } from 'react-icons/fi'
import { useCart } from '@/context/CartContext'
import { getAllMenuItems, getMenuItemsByCategory } from '@/services/menuService'

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
  available?: boolean
  addOns?: { name: string; price: number }[]
}

function MenuContent() {
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')

  const [activeCategory, setActiveCategory] = useState('all')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalItem, setModalItem] = useState<MenuItem | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalAddOns, setModalAddOns] = useState<string[]>([])
  const { addToCart } = useCart()

  useEffect(() => {
    async function fetchMenu() {
      setLoadingMenu(true)
      try {
        let items
        if (activeCategory === 'all') {
          items = await getAllMenuItems()
        } else {
          items = await getMenuItemsByCategory(activeCategory)
        }
        setMenuItems(items)
      } catch {
        setMenuItems([])
      } finally {
        setLoadingMenu(false)
      }
    }
    fetchMenu()
  }, [activeCategory])

  // If no tabledata, show intro page
  if (!tableDataParam) {
    return <IntroPage />
  }

  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)

  const openModal = (item: MenuItem) => {
    setModalItem(item)
    setModalQuantity(1)
    setModalAddOns([])
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalItem(null)
    setModalQuantity(1)
    setModalAddOns([])
  }

  const handleAddToCart = () => {
    if (!modalItem) return
    addToCart({
      id: modalItem.id,
      name: modalItem.name,
      price: modalItem.price,
      quantity: modalQuantity,
      addOns:
        modalItem.addOns?.filter((a) => modalAddOns.includes(a.name)) || [],
      image: modalItem.imageURL || modalItem.imageURLs?.[0] || '',
    })
    closeModal()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 relative overflow-hidden">
      {/* Beautiful BottomNavBar restored */}
      <div className="sticky top-0 z-40">
        {/* Import and render your BottomNavBar component here. Adjust import if needed. */}
        {/* Example: */}
        {/* <BottomNavBar tabledata={tableDataParam} /> */}
        {/* ...existing header and category filter code... */}
      </div>
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* ...existing menu header... */}
        {/* Enhanced menu items grid with premium styling */}
        {loadingMenu ? (
          <div className="flex flex-col items-center justify-center py-20">
            {/* ...existing loading spinner... */}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, idx) => {
              // Get image: prefer imageURLs array, fallback to imageURL, then image, then placeholder
              const imageSrc =
                item.imageURLs?.[0] ||
                item.imageURL ||
                item.image ||
                '/placeholder-food.jpg'
              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-amber-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer animate-fadein-card group"
                  onClick={() => {
                    // Navigate to /menu/[id]?tabledata=... on click
                    window.location.href = `/menu/${item.id}${tableDataParam ? `?tabledata=${encodeURIComponent(tableDataParam)}` : ''}`
                  }}
                >
                  {/* Image display */}
                  <div className="w-full h-40 relative mb-2">
                    <Image
                      src={imageSrc}
                      alt={item.name}
                      fill
                      className="object-cover rounded-t-2xl"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
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
                          openModal(item)
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
              )
            })}
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
        {/* Modal for quantity/add-ons selection */}
        {showModal && modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
              <button
                className="absolute top-3 right-3 text-amber-500 hover:text-amber-700 font-bold text-xl"
                onClick={closeModal}
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 text-center">
                Add to Cart
              </h2>
              <div className="flex flex-col items-center mb-4">
                <Image
                  src={
                    modalItem.imageURL ||
                    modalItem.imageURLs?.[0] ||
                    '/placeholder-food.jpg'
                  }
                  alt={modalItem.name}
                  width={80}
                  height={80}
                  className="rounded-xl border border-amber-200 mb-2"
                />
                <div className="font-bold text-lg text-amber-800 mb-1">
                  {modalItem.name}
                </div>
                <div className="text-amber-700 font-semibold">
                  ₹{modalItem.price.toFixed(2)}
                </div>
              </div>
              <div className="mb-4">
                <span className="font-semibold text-amber-700">Quantity:</span>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-lg"
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    disabled={modalQuantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-bold text-lg px-2">
                    {modalQuantity}
                  </span>
                  <button
                    className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-lg"
                    onClick={() => setModalQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              {modalItem.addOns && modalItem.addOns.length > 0 && (
                <div className="mb-4">
                  <span className="font-semibold text-amber-700">
                    Customizations:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {modalItem.addOns.map((addon, idx) => (
                      <button
                        key={idx}
                        className={`px-4 py-2 rounded-full font-medium border transition-all duration-200 ${
                          modalAddOns.includes(addon.name)
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                        onClick={() =>
                          setModalAddOns((prev) =>
                            prev.includes(addon.name)
                              ? prev.filter((n) => n !== addon.name)
                              : [...prev, addon.name],
                          )
                        }
                      >
                        {addon.name} (+₹{addon.price.toFixed(2)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="w-full py-3 mt-2 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-lg hover:from-amber-700 hover:to-yellow-600 transition-all"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </main>
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 z-0 animate-float-delay">
        <FiCoffee className="text-amber-300/30 text-5xl md:text-6xl" />
      </div>
      <div className="absolute bottom-10 left-10 z-0 animate-float">
        <FiCoffee className="text-amber-400/30 text-4xl md:text-5xl" />
      </div>
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

function IntroPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-white px-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 flex flex-col items-center max-w-lg w-full">
        <FiCoffee className="text-amber-600 text-6xl mb-4 animate-bounce" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 mb-2 text-center">
          Welcome to <br />
          <span className="bg-clip-text mt-4 text-transparent bg-gradient-to-r from-primary to-secondary">
            Work Brew Café
          </span>
        </h1>
        <p className="text-lg text-gray-700 mb-6 mt-3 text-center">
          Your favorite spot for coffee, comfort, and creativity.
        </p>
        <div className="flex items-center text-center gap-2 bg-gradient-to-tr from-primary to-secondary border border-primary/[0.1] shadow-white/[0.5] shadow-inner rounded-xl px-4 py-3 shadow-inner">
          <FiTruck className="text-white text-2xl" />
          <span className="font-semibold text-white text-lg">
            Delivery &amp; Takeaway options are coming soon!
          </span>
        </div>
      </div>
    </div>
  )
}

function MenuPageContent() {
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')

  // If no tabledata, show intro page
  if (!tableDataParam) {
    return <IntroPage />
  }

  return <MenuContent />
}

export default function MenuPage() {
  return <MenuPageContent />
}
