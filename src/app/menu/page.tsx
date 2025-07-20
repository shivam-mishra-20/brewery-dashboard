'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiCoffee,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTruck,
  FiX,
} from 'react-icons/fi'
import { useCart } from '@/context/CartContext'
import { getAllMenuItems } from '@/services/menuService'

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
  const [allCategories, setAllCategories] = useState<string[]>(['all'])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalItem, setModalItem] = useState<MenuItem | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalAddOns, setModalAddOns] = useState<string[]>([])
  const { cart, addToCart } = useCart()
  const [tableInfo, setTableInfo] = useState<{
    tableId: string
    tableName: string
    tableNumber: string
  } | null>(null)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  // Helper function to normalize add-ons for consistent comparison (same as in CartContext)
  const normalizeAddOns = (addOns?: { name: string; price: number }[]) => {
    if (!addOns || addOns.length === 0) return ''
    return addOns
      .map((a) => `${a.name}:${a.price}`)
      .sort()
      .join('|')
  }

  // Process table data from URL
  useEffect(() => {
    if (tableDataParam) {
      // Import the correct decryption function from tableEncryption.ts
      import('@/utils/tableEncryption').then(({ decryptTableData }) => {
        try {
          // First URL decode the data if needed
          const decodedData = decodeURIComponent(tableDataParam)
          const tableData = decryptTableData(decodedData)

          if (tableData) {
            setTableInfo(tableData)

            // Store in session storage for use across the app
            sessionStorage.setItem('tableInfo', JSON.stringify(tableData))
          } else {
            // If decryption fails, redirect to verification page
            router.push(
              `/qr-verification?tabledata=${encodeURIComponent(tableDataParam)}`,
            )
          }
        } catch (error) {
          console.error('Error processing table data:', error)
          // Redirect to verification page on error
          router.push(
            `/qr-verification?tabledata=${encodeURIComponent(tableDataParam)}`,
          )
        }
      })
    } else {
      // Check if we have table info in session storage
      const storedTableInfo = sessionStorage.getItem('tableInfo')
      if (storedTableInfo) {
        setTableInfo(JSON.parse(storedTableInfo))
      }
    }
  }, [tableDataParam, router])

  // Fetch all menu items and categories once
  useEffect(() => {
    async function fetchAllMenu() {
      setLoadingMenu(true)
      try {
        const items = await getAllMenuItems()
        setMenuItems(items)
        const uniqueCategories = [
          'all',
          ...Array.from(new Set(items.map((item) => item.category))),
        ]
        setAllCategories(uniqueCategories)
      } catch {
        setMenuItems([])
        setAllCategories(['all'])
      } finally {
        setLoadingMenu(false)
      }
    }
    fetchAllMenu()
  }, [])

  // If no tabledata and no stored table info, show intro page
  if (!tableDataParam && !tableInfo) {
    return <IntroPage />
  }

  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)

  // Apply search filter if needed
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

  // Helper function to check if an item with specific add-ons exists in the cart
  const checkItemInCart = (
    id: string,
    selectedAddOns: string[] = [],
    itemAddOns: any[] = [],
  ) => {
    // Filter the add-ons based on selected ones
    const filteredAddOns =
      itemAddOns.filter((a) => selectedAddOns.includes(a.name)) || []

    // Create a key for the current item configuration
    const itemKey = `${id}|${normalizeAddOns(filteredAddOns)}`

    // Find matching item in cart based on exact ID and add-on configuration
    return cart.find((cartItem) => {
      const cartItemKey = `${cartItem.id}|${normalizeAddOns(cartItem.addOns)}`
      return cartItemKey === itemKey
    })
  }

  // Helper function for debugging
  const logCartState = () => {
    console.log(
      'Current cart state:',
      cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        addOns: item.addOns?.map((a) => a.name) || 'none',
      })),
    )
  }

  const handleAddToCart = () => {
    if (!modalItem) return

    // Debug cart state before adding
    console.log('Before adding to cart:')
    logCartState()

    // Check if this exact item configuration is in the cart
    const existingItem = checkItemInCart(
      modalItem.id,
      modalAddOns,
      modalItem.addOns,
    )

    if (existingItem) {
      console.log(`Item found in cart with quantity: ${existingItem.quantity}`)
      console.log(`Adding quantity: ${modalQuantity}`)
    }

    // Filter the add-ons based on selected ones
    const selectedItemAddOns =
      modalItem.addOns?.filter((a) => modalAddOns.includes(a.name)) || []

    // Add to cart with the selected quantity and add-ons
    addToCart({
      id: modalItem.id,
      name: modalItem.name,
      price: modalItem.price,
      quantity: modalQuantity, // This is the quantity user selected in the modal
      addOns: selectedItemAddOns,
      image: modalItem.imageURL || modalItem.imageURLs?.[0] || '',
    })

    // Debug cart state after adding (will be seen in the effect in CartContext)

    // Close the modal after adding to cart
    closeModal()
  }

  // Display the menu with table info in header
  return (
    <div>
      <div className=" bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50">
        {/* Header with table info */}
        <div className="sticky top-0 z-40">
          <header className="bg-white/80 backdrop-blur-lg shadow-md px-4 py-4">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-0 sm:px-2">
              {/* Brand and table info */}
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/80 to-secondary/80 rounded-full flex items-center justify-center shadow-md">
                  <FiCoffee className="text-secondary text-2xl" />
                </div>
                <div className="ml-3 flex flex-col">
                  <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    Work Brew Café
                  </h1>
                  {tableInfo && (
                    <p className="text-xs sm:text-sm text-secondary font-medium mt-0.5">
                      Table {tableInfo.tableNumber} • {tableInfo.tableName}
                    </p>
                  )}
                </div>
              </div>

              {/* Search and cart */}
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0 gap-2 sm:gap-4">
                {/* Search input */}
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-full text-sm border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white/90 shadow-sm transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                {/* Cart icon */}
                <Link
                  href={`/cart?tabledata=${tableDataParam ? encodeURIComponent(tableDataParam) : ''}`}
                  className="ml-2"
                >
                  <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-full text-white relative hover:shadow-lg transition-all duration-200">
                    <FiShoppingBag className="text-lg" />
                    {/* Cart count indicator with actual cart count */}
                    {cart.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </header>
        </div>
        {/* Example: */}
        {/* <BottomNavBar tabledata={tableDataParam} /> */}
        {/* ...existing header and category filter code... */}
      </div>
      <main className="container mx-auto px-4 py-4 relative z-10">
        {/* Categories scroll bar */}
        <div className="mb-6 overflow-x-auto pb-3 hide-scrollbar">
          <div className="flex gap-3 min-w-max">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-primary text-white shadow-lg font-medium'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium'
                }`}
              >
                {category === 'all'
                  ? 'All Items'
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu items grid */}
        {loadingMenu ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-amber-800 font-medium">Loading menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Apply search filter */}
            {filteredItems
              .filter((item) =>
                searchTerm
                  ? item.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    item.description
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  : true,
              )
              .map((item, idx) => {
                // Get image: prefer imageURLs array, fallback to imageURL, then image, then placeholder
                const imageSrc =
                  item.imageURLs?.[0] ||
                  item.imageURL ||
                  item.image ||
                  '/placeholder-food.jpg'

                // Calculate total quantity of this item in the cart (across all add-on variations)
                const totalItemQuantity = cart
                  .filter((cartItem) => cartItem.id === item.id)
                  .reduce((total, cartItem) => total + cartItem.quantity, 0)

                return (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-amber-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-fade-in group"
                  >
                    {/* Image display with category tag */}
                    <div className="w-full h-48 relative">
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={idx < 6} // Prioritize loading the first 6 images
                      />
                      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                        {item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                      </div>
                      {totalItemQuantity > 0 && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-medium animate-pulse">
                          In Cart: {totalItemQuantity}
                        </div>
                      )}
                    </div>

                    <div
                      className="p-5 relative"
                      onClick={() => {
                        // Navigate to details page on click of item info
                        window.location.href = `/menu/${item.id}${tableDataParam ? `?tabledata=${encodeURIComponent(tableDataParam)}` : ''}`
                      }}
                    >
                      {/* Decorative elements */}
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-400/10 rounded-full blur-xl"></div>
                      <div className="absolute -left-4 -top-4 w-8 h-8 bg-amber-400/10 rounded-full blur-lg"></div>

                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors leading-tight">
                          {item.name}
                        </h3>
                        <span className="font-bold text-white px-3 py-1 rounded-xl bg-gradient-to-r from-primary to-secondary shdow-inner shadow-white/[0.5] border border-primary/[0.1] flex-shrink-0 ml-2">
                          ₹{(item.price / 100).toFixed(2)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex gap-2">
                        {/* View details button */}
                        <button
                          className="flex-1 py-2.5 rounded-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 font-medium"
                          onClick={() => {
                            window.location.href = `/menu/${item.id}${tableDataParam ? `?tabledata=${encodeURIComponent(tableDataParam)}` : ''}`
                          }}
                        >
                          Details
                        </button>

                        {/* Add to cart button */}
                        <button
                          className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                            item.available
                              ? 'bg-gradient-to-r from-primary to-secondary shdow-inner shadow-white/[0.8] border border-primary/[0.1] hover:from-amber-600 hover:to-amber-500 text-white '
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
                              <FiPlus size={18} />
                              Add
                            </>
                          ) : (
                            <>Unavailable</>
                          )}
                        </button>
                      </div>

                      {/* Enhanced add-ons indicator */}
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                          {item.addOns.length} Customization
                          {item.addOns.length !== 1 ? 's' : ''} available
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 text-center shadow-md border border-amber-100 animate-fade-in">
            <div className="bg-amber-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-inner">
              <FiCoffee className="text-5xl text-amber-400" />
            </div>
            <h3 className="text-2xl font-semibold text-amber-800 mb-3">
              {searchTerm ? 'No matching items found' : 'No items available'}
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {searchTerm
                ? `We couldn't find any items matching "${searchTerm}". Try a different search term.`
                : `No menu items are currently available in the ${activeCategory === 'all' ? 'menu' : activeCategory} category.`}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl border border-amber-600 transition-colors font-medium shadow-md"
                >
                  Clear Search
                </button>
              )}
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="px-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 transition-colors font-medium"
                >
                  View All Items
                </button>
              )}
            </div>
          </div>
        )}
        {/* Enhanced Modal for quantity/add-ons selection */}
        {showModal && modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-0 animate-fade-in">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header with image background */}
              <div className="relative h-40 w-full bg-gradient-to-b from-amber-800 to-amber-600">
                <Image
                  src={
                    modalItem.imageURL ||
                    modalItem.imageURLs?.[0] ||
                    '/placeholder-food.jpg'
                  }
                  alt={modalItem.name}
                  fill
                  className="object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {modalItem.name}
                  </h2>
                  <p className="text-amber-100 font-medium line-clamp-1">
                    {modalItem.description.substring(0, 80)}
                  </p>
                </div>
                <button
                  className="absolute top-4 right-4 text-white hover:text-amber-200 rounded-full p-1 bg-black/30 hover:bg-black/50 transition-colors"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-5 bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <span className="font-bold text-amber-900">Price</span>
                  <span className="font-bold text-lg text-amber-800">
                    ₹{(modalItem.price / 100).toFixed(2)}
                  </span>
                </div>

                {/* Quantity selector */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-amber-900">
                      Quantity
                    </span>
                    <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg border border-amber-100">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                        onClick={() =>
                          setModalQuantity((q) => Math.max(1, q - 1))
                        }
                        disabled={modalQuantity <= 1}
                      >
                        <FiMinus size={18} />
                      </button>
                      <span className="font-bold text-lg px-3 text-amber-900">
                        {modalQuantity}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                        onClick={() => setModalQuantity((q) => q + 1)}
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customizations */}
                {modalItem.addOns && modalItem.addOns.length > 0 && (
                  <div className="mb-6">
                    <span className="font-semibold text-amber-900 block mb-3">
                      Customizations
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {modalItem.addOns.map((addon, idx) => (
                        <button
                          key={idx}
                          className={`py-3 px-4 rounded-xl font-medium border transition-all duration-300 flex flex-col items-center ${
                            modalAddOns.includes(addon.name)
                              ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                              : 'bg-amber-50 text-amber-900 border-amber-100 hover:bg-amber-100'
                          }`}
                          onClick={() =>
                            setModalAddOns((prev) =>
                              prev.includes(addon.name)
                                ? prev.filter((n) => n !== addon.name)
                                : [...prev, addon.name],
                            )
                          }
                        >
                          <span className="text-sm">{addon.name}</span>
                          <span
                            className={`text-xs mt-1 ${modalAddOns.includes(addon.name) ? 'text-amber-100' : 'text-amber-600'}`}
                          >
                            +₹{(addon.price / 100).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display current cart status for this exact item if it exists */}
                {modalItem && (
                  <div className="mb-4">
                    {(() => {
                      // Check if this exact configuration exists in cart
                      const existingItem = checkItemInCart(
                        modalItem.id,
                        modalAddOns,
                        modalItem.addOns,
                      )

                      if (existingItem) {
                        return (
                          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 text-amber-800 text-sm">
                            <strong>
                              Currently in cart: {existingItem.quantity}
                            </strong>{' '}
                            of this item with the same options. Adding{' '}
                            {modalQuantity} more.
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}

                {/* Total calculation */}
                <div className="bg-amber-50 p-4 rounded-xl mb-5 border border-amber-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-amber-700">Base price</span>
                    <span className="font-medium text-amber-800">
                      ₹{((modalItem.price / 100) * modalQuantity).toFixed(2)}
                    </span>
                  </div>

                  {modalAddOns.length > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-amber-700">Add-ons</span>
                      <span className="font-medium text-amber-800">
                        ₹
                        {(
                          (modalItem.addOns || [])
                            .filter((a) => modalAddOns.includes(a.name))
                            .reduce(
                              (sum, addon) => sum + addon.price / 100,
                              0,
                            ) * modalQuantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-amber-200 my-2"></div>

                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-amber-900">Total</span>
                    <span className="text-amber-800">
                      ₹
                      {(
                        (modalItem.price / 100) * modalQuantity +
                        (modalItem.addOns || [])
                          .filter((a) => modalAddOns.includes(a.name))
                          .reduce((sum, addon) => sum + addon.price / 100, 0) *
                          modalQuantity
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-secondary shdow-inner shadow-white/[0.4] border border-primary/[0.1] text-white shadow-lg hover:from-amber-700 hover:to-yellow-600 transition-all flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                >
                  <FiShoppingBag />
                  {(() => {
                    // Check if this exact configuration exists in cart
                    const existingItem = checkItemInCart(
                      modalItem.id,
                      modalAddOns,
                      modalItem.addOns,
                    )

                    if (existingItem) {
                      return `Add ${modalQuantity} More`
                    }
                    return `Add to Cart (${modalQuantity})`
                  })()}
                </button>
              </div>
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
        <div className="flex items-center text-center gap-2 bg-gradient-to-tr from-amber-500 to-amber-400 border border-amber-600/20 shadow-white/[0.5] shadow-inner rounded-xl px-4 py-3">
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
