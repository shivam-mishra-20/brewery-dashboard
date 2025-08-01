'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiClock,
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
      className="w-full px-4 py-6 pb-28 absolute z-10 bg-[#0B3D2E]/80"
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
          <div className="max-w-xl mx-auto flex justify-center items-center">
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
        <main className="max-w-xl mx-auto space-y-4">
          {/* Cart Items */}
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-xl bg-[#0E4938] border-[0.5px] border-white/10 shadow-lg p-5"
            >
              {/* Remove Button */}
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-[#FFC600] p-1"
                onClick={() => removeFromCart(item.id, item.addOns)}
                aria-label="Remove"
              >
                <FiX size={18} />
              </button>
              <div className="pr-4">
                <div className="font-medium text-lg text-white mb-0.5">
                  {item.name}
                </div>
                <div className="text-sm text-[#D4C3A3] mb-3">
                  {getDescription(item)}
                </div>
              </div>
              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center border border-white/10 rounded-full">
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-full text-white"
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        Math.max(1, item.quantity - 1),
                        item.addOns,
                      )
                    }
                    disabled={item.quantity <= 1}
                  >
                    <span className="text-lg">−</span>
                  </button>
                  <span className="font-medium text-sm px-3 text-white">
                    {item.quantity}
                  </span>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-full text-white"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1, item.addOns)
                    }
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>
                <span className="font-medium text-lg text-[#FFC600] ml-auto">
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
                <div className="text-xs text-[#FFC600] mb-2">
                  Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                </div>
              )}
              {/* Special Instructions */}
              <div className="mt-2">
                {editingInstructions[idx] ? (
                  <div className="bg-[#0A4435] rounded-lg p-3 flex flex-col gap-2">
                    <label className="text-[#D4C3A3] text-xs font-medium">
                      Special instructions
                    </label>
                    <textarea
                      className="w-full bg-transparent text-white text-sm border-none outline-none resize-none p-0"
                      rows={2}
                      value={instructionsDraft[idx] ?? item.instructions ?? ''}
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
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFC600] text-white font-medium text-xs"
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
                        Save
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 text-white font-medium text-xs"
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
                  <div className="bg-[#0A4435] rounded-lg p-3 flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[#D4C3A3] text-xs font-medium">
                        Special instructions
                      </span>
                      <div className="text-white text-sm mt-1">
                        {item.instructions}
                      </div>
                    </div>
                    <button
                      className="ml-2 text-[#FFC600] p-1"
                      onClick={() =>
                        setEditingInstructions((edit) => ({
                          ...edit,
                          [idx]: true,
                        }))
                      }
                      aria-label="Edit instructions"
                    >
                      <FiEdit2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      className="flex items-center gap-2 text-[#D4C3A3] text-xs hover:text-[#FFC600]"
                      onClick={() =>
                        setEditingInstructions((edit) => ({
                          ...edit,
                          [idx]: true,
                        }))
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 7v10m-5-5h10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Add special instructions
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Apply Promo Code */}
          {/* <div className="mt-4">
              <button className="flex w-full items-center justify-between bg-[#0E4938] border-[0.5px] border-white/10 rounded-xl p-4 text-[#FFC600]">
                <div className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M9 14l6-6M9.5 9a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5zm5 5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5zM4 4l16 16m0-16L4 20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-medium">Apply Promo Code</span>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M9 18l6-6-6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div> */}

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-white/70 text-sm p-2">
            <FiClock className="text-[#FFC600]" />
            <span>Estimated preparation time: ~20 min</span>
          </div>

          {/* Summary Card */}
          <div className="rounded-xl bg-[#0E4938] border-[0.5px] border-white/10 p-5 mt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-white text-sm">Table Number</span>
              <span className="bg-[#0A4435] text-white px-3 py-1 rounded-md text-sm font-medium">
                {tableDataParam ? tableDataParam.slice(-2) : '—'}
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-white/80 text-sm">Subtotal</span>
              <span className="text-white text-sm">₹{subtotal}</span>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-white/80 text-sm">Taxes & Charges</span>
              <span className="text-white text-sm">₹{taxes}</span>
            </div>
            <div className="border-t border-white/10 my-3"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium">Total</span>
              <span className="text-[#FFC600] font-medium text-lg">
                ₹{total}
              </span>
            </div>
            <Link
              href={`/checkout?tabledata=${
                tableDataParam ? encodeURIComponent(tableDataParam) : ''
              }`}
              className="block w-full mt-2 py-3 rounded-xl bg-[#F59E0B] text-white font-medium text-center text-base"
            >
              Proceed to Payment
            </Link>
          </div>
        </main>
      )}
    </div>
  )
}
