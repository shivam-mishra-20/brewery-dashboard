'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiCoffee,
  FiMinus,
  FiPlus,
  FiSearch, // <-- Add FiSearch
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
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Close search input when clicking outside
  useEffect(() => {
    if (!showSearch) return
    const handler = (e: MouseEvent) => {
      const searchBox = document.getElementById('menu-search-overlay')
      if (searchBox && !searchBox.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSearch])

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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-serif text-gray-700">Loading...</p>
      </div>
    )
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
      <div className="bg-[#0B3D2E]/90 relative border-b-1 border-white/10 ">
        {/* Header with table info */}
        <div className="fixed top-0 left-0 w-full z-50">
          <header className="bg-[#0B3D2E] backdrop-blur-lg shadow-md px-4 py-4 relative">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-0 px-0 sm:px-2">
              {/* Brand and table info */}
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
                <div className="ml-3 flex flex-col">
                  <h1 className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight leading-tight">
                    The Brewery
                  </h1>
                  {tableInfo && (
                    <p className="text-xs sm:text-sm text-[#D4C3A3] font-medium mt-0.5">
                      Table {tableInfo.tableNumber} • {tableInfo.tableName}
                    </p>
                  )}
                </div>
              </div>
              {/* Cart icon removed from header */}
            </div>
            {/* Search Icon - absolute top right */}
            <button
              className="absolute top-6 right-8 sm:right-12 z-50"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label="Open search"
              onClick={() => setShowSearch(true)}
            >
              <FiSearch size={28} className="text-white" />
            </button>
          </header>
        </div>
        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-[70px] left-0 w-full z-50 flex justify-center"
              style={{ pointerEvents: 'auto' }}
            >
              <motion.div
                id="menu-search-overlay"
                initial={{ scale: 0.98, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-lg px-4"
              >
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-amber-100 px-2 py-2 flex items-center">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full text-lg font-serif border-none focus:outline-none bg-transparent text-[#222] placeholder-gray-400"
                  />
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setShowSearch(false)
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <FiX size={22} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Example: */}
        {/* <BottomNavBar tabledata={tableDataParam} /> */}
        {/* ...existing header and category filter  `code... */}
      </div>
      <main
        className="container mx-auto px-4 py-6 pb-28 absolute z-10 bg-[#0B3D2E]/80"
        style={{
          backgroundImage: 'url("/bg-image.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 100,
        }}
      >
        {/* Categories scroll bar */}
        <div className="mb-6 mt-20 overflow-x-auto pb-3 hide-scrollbar">
          <div className="flex gap-4 min-w-max">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-serif text-md
                  ${
                    activeCategory === category
                      ? 'bg-[#FFC600] text-[#222] font-bold shadow-md border-none'
                      : 'bg-transparent text-white border border-white/40 font-normal hover:bg-white/10'
                  }
                `}
                style={{
                  boxShadow:
                    activeCategory === category
                      ? '0 2px 8px 0 rgba(255,198,0,0.10)'
                      : undefined,
                }}
              >
                {category === 'all'
                  ? 'All Items'
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <hr className="border-t border-white/20 mt-4" />
        </div>

        {/* Menu items grid */}
        {loadingMenu ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-white font-medium">Loading menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                const imageSrc =
                  item.imageURLs?.[0] ||
                  item.imageURL ||
                  item.image ||
                  '/placeholder-food.jpg'

                const totalItemQuantity = cart
                  .filter((cartItem) => cartItem.id === item.id)
                  .reduce((total, cartItem) => total + cartItem.quantity, 0)

                return (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="bg-[#18382D]/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col"
                    onClick={() => {
                      router.push(
                        `/menu/${encodeURIComponent(item.id)}${
                          tableDataParam
                            ? `?tabledata=${encodeURIComponent(tableDataParam)}`
                            : ''
                        }`,
                      )
                    }}
                  >
                    {/* Image display */}
                    <div className="w-full h-60 relative">
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        className="object-cover rounded-t-3xl"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={idx < 6}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-4">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-2">
                          {item.name}
                        </h3>
                        <p className="text-md font-serif text-gray-200 mb-4">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <span className="text-xl font-serif font-bold text-[#FFC600]">
                          ₹ {item.price.toFixed(0)}
                        </span>
                        <button
                          className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-[#FFC600] hover:bg-[#FFD700] transition-all shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (item.available) {
                              // If you want to keep modal for "+" button, keep this:
                              openModal(item)
                            }
                          }}
                          disabled={!item.available}
                        >
                          <FiPlus size={24} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div
            className="flex items-center justify-center min-h-[100vh] w-full"
            style={{
              backgroundImage: 'url("/bg-image.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              opacity: 1,
            }}
          >
            <div className="bg-[#23272F]/90 rounded-2xl shadow-2xl border border-[#FFC600]/30 px-6 py-12 flex flex-col items-center max-w-sm w-full animate-fadein justify-center">
              <div className="mb-6 flex flex-col items-center">
                <div className="bg-gradient-to-br from-[#FFC600]/80 to-[#FFD700]/60 rounded-full w-16 h-16 flex items-center justify-center border-4 border-[#FFC600] shadow-lg">
                  <FiSearch className="text-3xl text-[#FFC600]" />
                </div>
                <span className="mt-2 text-[#FFC600] font-serif font-bold text-lg">
                  No Results
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-white mb-2 text-center">
                Nothing matches your search
              </h2>
              <p className="text-md text-[#FFD700] mb-6 text-center font-serif">
                <span className="font-semibold text-[#FFC600]">
                  "{searchTerm}"
                </span>{' '}
                not found.
                <br />
                Try a different keyword or explore categories below.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="px-5 py-2 bg-gradient-to-r from-[#FFC600] to-[#FFD700] text-[#23272F] rounded-full border border-[#FFC600]/40 font-bold shadow hover:from-[#FFD700] hover:to-[#FFC600] transition-all font-serif"
              >
                Clear Search
              </button>
              <div className="mt-8 w-full flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-2 font-serif">
                  Tip: Use short keywords for better results.
                </span>
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-[#FFC600] underline text-sm font-serif hover:text-[#FFD700]"
                >
                  Browse All Items
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Enhanced Modal for quantity/add-ons selection */}
        {showModal && modalItem && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-0 animate-fade-in">
            <div
              className="bg-[#18382D] rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden animate-slide-up border border-[#FFC600]/30"
              style={{ minWidth: '320px', maxWidth: '370px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header with image background */}
              <div className="relative h-32 w-full bg-gradient-to-b from-[#FFC600]/40 to-[#18382D]">
                <Image
                  src={
                    modalItem.imageURL ||
                    modalItem.imageURLs?.[0] ||
                    '/placeholder-food.jpg'
                  }
                  alt={modalItem.name}
                  fill
                  className="object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-5 right-5">
                  <h2 className="text-xl font-bold text-white mb-1 font-serif">
                    {modalItem.name}
                  </h2>
                  <p className="text-[#FFC600] font-medium line-clamp-1 text-sm">
                    {modalItem.description.substring(0, 80)}
                  </p>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-[#FFC600] rounded-full p-1 bg-black/30 hover:bg-black/50 transition-colors"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-4 bg-[#23272F] rounded-lg p-2 border border-[#FFC600]/20">
                  <span className="font-bold text-[#FFC600] font-serif">
                    Price
                  </span>
                  <span className="font-bold text-md text-white font-serif">
                    ₹{modalItem.price.toFixed(2)}
                  </span>
                </div>

                {/* Quantity selector */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white font-serif">
                      Quantity
                    </span>
                    <div className="flex items-center gap-1 bg-[#23272F] p-1 rounded-lg border border-[#FFC600]/20">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#FFC600] hover:bg-[#23272F]/80 transition-colors"
                        onClick={() =>
                          setModalQuantity((q) => Math.max(1, q - 1))
                        }
                        disabled={modalQuantity <= 1}
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="font-bold text-md px-3 text-[#FFC600] font-serif">
                        {modalQuantity}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#FFC600] hover:bg-[#23272F]/80 transition-colors"
                        onClick={() => setModalQuantity((q) => q + 1)}
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customizations */}
                {modalItem.addOns && modalItem.addOns.length > 0 && (
                  <div className="mb-5">
                    <span className="font-semibold text-white font-serif block mb-2">
                      Customizations
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {modalItem.addOns.map((addon, idx) => (
                        <button
                          key={idx}
                          className={`py-2 px-3 rounded-lg font-medium border transition-all duration-300 flex flex-col items-center text-xs font-serif ${
                            modalAddOns.includes(addon.name)
                              ? 'bg-[#FFC600] text-[#23272F] border-[#FFC600] shadow-md'
                              : 'bg-[#23272F] text-white border-[#FFC600]/20 hover:bg-[#23272F]/80'
                          }`}
                          onClick={() =>
                            setModalAddOns((prev) =>
                              prev.includes(addon.name)
                                ? prev.filter((n) => n !== addon.name)
                                : [...prev, addon.name],
                            )
                          }
                        >
                          <span>{addon.name}</span>
                          <span
                            className={`mt-1 ${modalAddOns.includes(addon.name) ? 'text-[#23272F]' : 'text-[#FFC600]'}`}
                          >
                            +₹{addon.price.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display current cart status for this exact item if it exists */}
                {modalItem && (
                  <div className="mb-3">
                    {(() => {
                      // Check if this exact configuration exists in cart
                      const existingItem = checkItemInCart(
                        modalItem.id,
                        modalAddOns,
                        modalItem.addOns,
                      )

                      if (existingItem) {
                        return (
                          <div className="bg-[#23272F] border border-[#FFC600]/30 rounded-lg p-2 text-[#FFC600] text-xs font-serif">
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
                <div className="bg-[#23272F] p-3 rounded-lg mb-4 border border-[#FFC600]/20">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#FFC600] font-serif">
                      Base price
                    </span>
                    <span className="font-medium text-white font-serif">
                      ₹{(modalItem.price * modalQuantity).toFixed(2)}
                    </span>
                  </div>

                  {modalAddOns.length > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-[#FFC600] font-serif">Add-ons</span>
                      <span className="font-medium text-white font-serif">
                        ₹
                        {(
                          (modalItem.addOns || [])
                            .filter((a) => modalAddOns.includes(a.name))
                            .reduce((sum, addon) => sum + addon.price, 0) *
                          modalQuantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-[#FFC600]/20 my-2"></div>

                  <div className="flex justify-between font-bold text-md font-serif">
                    <span className="text-[#FFC600]">Total</span>
                    <span className="text-white">
                      ₹
                      {(
                        modalItem.price * modalQuantity +
                        (modalItem.addOns || [])
                          .filter((a) => modalAddOns.includes(a.name))
                          .reduce((sum, addon) => sum + addon.price, 0) *
                          modalQuantity
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full py-3 rounded-xl font-bold text-md bg-gradient-to-r from-[#F59E0B] to-[#FFD700] shadow-lg border border-[#FFC600]/30 text-[#23272F] hover:from-[#FFD700] hover:to-[#FFC600] transition-all flex items-center justify-center gap-2 font-serif"
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

      {/* Floating Cart Icon */}
      <Link
        href={`/cart?tabledata=${tableDataParam ? encodeURIComponent(tableDataParam) : ''}`}
        className="fixed bottom-24 right-2 z-50"
        style={{ textDecoration: 'none' }}
      >
        <div
          className="flex items-center justify-center px-5 py-2 rounded-full shadow-lg border border-[#FFD700]/40"
          style={{
            background: '#C9A227',
            boxShadow: '0 2px 12px 0 rgba(200,160,25,0.18)',
            minWidth: '90px',
            minHeight: '44px',
            fontFamily: 'serif',
          }}
        >
          <FiShoppingBag size={22} className="text-white mr-2" />
          <span className="text-white text-[1.25rem] font-serif font-normal mr-2">
            {cart.reduce((total, item) => total + item.quantity, 0)}
          </span>
          <span
            className="text-white text-[1.25rem] font-serif font-normal"
            style={{ borderLeft: '1.5px solid #e5c76b', paddingLeft: '12px' }}
          >
            ₹
            {cart.reduce(
              (total, item) =>
                total +
                (item.price * item.quantity +
                  (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) *
                    item.quantity),
              0,
            )}
          </span>
        </div>
      </Link>

      {/* Decorative elements */}

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
    <div className="min-h-screen absolute flex flex-col items-center justify-center bg-[#0B3D2E] bg-[url('/bg-image.png')] bg-cover bg-center bg-no-repeat px-4 allow-scroll font-serif">
      <div className="bg-[#23272F]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center max-w-lg w-full border border-[#FFC600]/20">
        <FiCoffee className="text-[#FFC600] text-6xl mb-4 animate-bounce" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 text-center font-serif">
          Welcome to <br />
          <span className="bg-clip-text mt-4 text-transparent bg-gradient-to-r from-[#FFC600] via-[#FFD700] to-[#FFC600] font-serif">
            The Brewery
          </span>
        </h1>
        <p className="text-lg text-[#FFD700] mb-6 mt-3 text-center font-serif">
          Your favorite spot for coffee, comfort, and creativity.
        </p>
        <div className="flex items-center text-center gap-2 bg-gradient-to-tr from-[#FFC600] to-[#FFD700] border border-[#FFC600]/20 shadow-white/[0.5] shadow-inner rounded-xl px-4 py-3">
          <FiTruck className="text-[#23272F] text-6xl" />
          <span className="font-semibold text-[#23272F] text-lg font-serif">
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
