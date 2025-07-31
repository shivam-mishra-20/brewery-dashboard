'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiCoffee,
  FiEdit2,
  FiShoppingBag,
  FiX,
} from 'react-icons/fi'
import { useCart } from '@/context/CartContext'
import { getAllMenuItems } from '@/services/menuService'

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
    updateQuantity,
    updateInstructions,
  } = useCart()
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')

  const menuHref = tableDataParam
    ? `/menu?tabledata=${encodeURIComponent(tableDataParam)}`
    : '/menu'

  const total = cart.reduce(
    (sum, item) =>
      sum +
      (item.price * item.quantity +
        (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) * item.quantity),
    0,
  )

  // Example taxes (10% for demo)
  const taxes = Math.round(total * 0.1)
  const subtotal = total - taxes

  // Track instructions editing per item
  const [editingInstructions, setEditingInstructions] = useState<{
    [key: number]: boolean
  }>({})
  const [instructionsDraft, setInstructionsDraft] = useState<{
    [key: number]: string
  }>({})
  const [menuItems, setMenuItems] = useState<any[]>([])

  // Fetch menu items for description lookup
  useEffect(() => {
    getAllMenuItems().then(setMenuItems)
  }, [])

  // Helper to get description for a cart item
  const getDescription = (item: any) => {
    const menuItem = menuItems.find((mi) => mi.id === item.id)
    return menuItem?.description || ''
  }

  return (
    <div
      className="container mx-auto px-4 py-6 pb-28 absolute z-10 bg-[#0B3D2E]/80"
      style={{
        backgroundImage: 'url("/bg-image.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 100,
      }}
    >
      {/* Header */}
      <div className="top-0 z-0">
        <header className=" px-4 py-4">
          <div className="max-w-xl mx-auto flex items-center">
            <Link
              href={menuHref}
              className="mr-2 p-2 rounded-full bg-[#133826]/80 hover:bg-[#1c553c] transition"
            >
              <FiArrowLeft className="text-white text-xl" />
            </Link>
            <h1 className="flex-1 text-2xl sm:text-3xl font-serif font-semibold text-white text-center tracking-tight">
              Your Cart
            </h1>
          </div>
          <div className="max-w-xl mx-auto text-[#D4C3A3] text-center text-base font-normal mt-2">
            Review your items before placing your order
          </div>
        </header>
      </div>
      {/* Cart Empty */}
      {cart.length === 0 ? (
        <div className="text-center text-[#D4C3A3] py-28">
          <div className="mb-6 flex justify-center">
            <FiShoppingBag className="w-24 h-24 text-[#FFC600]/40" />
          </div>
          <div className="text-2xl font-bold mb-2 text-white">
            Your cart is empty.
          </div>
          <div className="mb-6 text-base text-[#D4C3A3]">
            Add some delicious items to your cart!
          </div>
          <Link
            href={menuHref}
            className="px-6 py-3 bg-[#F59E0B] text-white rounded-xl font-bold shadow hover:bg-[#FFD700] transition-colors border-none"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-6 relative z-50">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Cart Items */}
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl bg-white/5 border border-white/20 shadow-2xl p-6 mb-8"
                style={{
                  boxShadow: '0 12px 32px 0 rgba(0,0,0,0.12)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                {/* Remove Button */}
                <button
                  className="absolute top-6 right-6 text-white/80 hover:text-[#FFC600] rounded-full p-1"
                  onClick={() => removeFromCart(item.id, item.addOns)}
                  aria-label="Remove"
                  style={{ position: 'absolute' }}
                >
                  <FiX size={22} />
                </button>
                <div>
                  <div className="font-serif font-bold text-2xl text-white mb-1">
                    {item.name}
                  </div>
                  <div className="text-base text-[#D4C3A3] mb-4 font-serif">
                    {getDescription(item)}
                  </div>
                </div>
                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center bg-white/10 rounded-full px-2 py-1 border border-white/20">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#FFC600] bg-transparent hover:bg-[#FFC600]/20 transition"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.max(1, item.quantity - 1),
                          item.addOns,
                        )
                      }
                      disabled={item.quantity <= 1}
                    >
                      <span className="font-bold text-lg">-</span>
                    </button>
                    <span className="font-bold text-lg px-4 text-white">
                      {item.quantity}
                    </span>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#FFC600] bg-transparent hover:bg-[#FFC600]/20 transition"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1, item.addOns)
                      }
                    >
                      <span className="font-bold text-lg">+</span>
                    </button>
                  </div>
                  <span className="font-bold text-xl text-[#FFC600] ml-auto font-serif">
                    ₹
                    {(
                      item.price * item.quantity +
                      (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) *
                        item.quantity
                    ).toFixed(0)}
                  </span>
                </div>
                {/* Add-ons */}
                {item.addOns && item.addOns.length > 0 && (
                  <div className="text-xs text-[#FFC600] mb-2 font-serif">
                    Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                  </div>
                )}
                {/* Special Instructions */}
                <div className="mt-2">
                  {editingInstructions[idx] ? (
                    <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col gap-2">
                      <label className="text-[#D4C3A3] text-sm font-serif font-semibold mb-1">
                        Special instructions
                      </label>
                      <textarea
                        className="w-full bg-transparent text-white font-serif border-none outline-none resize-none p-0"
                        rows={2}
                        value={
                          instructionsDraft[idx] ?? item.instructions ?? ''
                        }
                        onChange={(e) =>
                          setInstructionsDraft((draft) => ({
                            ...draft,
                            [idx]: e.target.value,
                          }))
                        }
                        placeholder="Type instructions..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFC600] text-white font-bold text-sm shadow hover:bg-[#FFD700] transition-colors"
                          onClick={() => {
                            if (typeof updateInstructions === 'function') {
                              updateInstructions(
                                item.id,
                                instructionsDraft[idx] ?? '',
                                item.addOns,
                              )
                            }
                            setEditingInstructions((edit) => ({
                              ...edit,
                              [idx]: false,
                            }))
                          }}
                        >
                          <FiEdit2 className="text-white text-base" />
                          Save
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/20 text-white font-bold text-sm shadow hover:bg-white/30 transition-colors"
                          onClick={() => {
                            setEditingInstructions((edit) => ({
                              ...edit,
                              [idx]: false,
                            }))
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : item.instructions ? (
                    <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex items-center gap-2">
                      <div className="flex-1">
                        <span className="text-[#D4C3A3] text-sm font-serif font-semibold">
                          Special instructions
                        </span>
                        <div className="text-white text-sm font-serif mt-1">
                          {item.instructions}
                        </div>
                      </div>
                      <button
                        className="ml-2 text-[#FFC600] hover:text-[#FFD700] p-1"
                        onClick={() =>
                          setEditingInstructions((edit) => ({
                            ...edit,
                            [idx]: true,
                          }))
                        }
                        aria-label="Edit instructions"
                      >
                        <FiEdit2 className="text-[#FFC600] text-lg" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-2 text-[#D4C3A3] text-sm mt-1 hover:text-[#FFC600] font-serif"
                      onClick={() =>
                        setEditingInstructions((edit) => ({
                          ...edit,
                          [idx]: true,
                        }))
                      }
                    >
                      <FiEdit2 className="text-[#FFC600] text-base" />
                      Add special instructions
                    </button>
                  )}
                </div>
              </div>
            ))}
            {/* Summary Card */}
            <div
              className="rounded-2xl border border-[#2e6a4f]/40 bg-white/10 backdrop-blur-lg shadow-lg p-6 mt-6"
              style={{
                boxShadow: '0 12px 32px 0 rgba(0,0,0,0.12)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-white font-serif text-lg font-bold">
                  Table Number
                </span>
                <span className="bg-white/10 text-white px-4 py-1 rounded-lg font-bold text-lg font-serif">
                  {tableDataParam ? tableDataParam.slice(-2) : '—'}
                </span>
              </div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-white font-serif text-lg">Subtotal</span>
                <span className="text-white font-serif text-lg font-bold">
                  ₹{subtotal}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-white font-serif text-lg">
                  Taxes & Charges
                </span>
                <span className="text-white font-serif text-lg font-bold">
                  ₹{taxes}
                </span>
              </div>
              <div className="border-t border-white/20 my-3"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-serif font-bold text-xl">
                  Total
                </span>
                <span className="text-[#FFC600] font-serif font-bold text-2xl">
                  ₹{total}
                </span>
              </div>
              <Link
                href={`/checkout?tabledata=${
                  tableDataParam ? encodeURIComponent(tableDataParam) : ''
                }`}
                className="block w-full mt-2 py-4 rounded-xl bg-[#FFC600] text-white font-serif font-bold text-lg text-center shadow hover:bg-[#FFD700] transition-colors"
                style={{
                  letterSpacing: '0.02em',
                  fontSize: '1.25rem',
                }}
              >
                Proceed to Payment
              </Link>
            </div>
          </div>
        </main>
      )}
      {/* Remove Floating Decorative Element */}
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
      `}</style>
    </div>
  )
}
