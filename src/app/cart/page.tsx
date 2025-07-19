'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 pt-8 pb-32 px-2 sm:px-0">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary text-center mb-8 tracking-tight">
        Your Cart
      </h1>
      {cart.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <div className="mb-6">
            <DotLottieReact
              src="https://lottie.host/2ffcbed2-9837-494e-8f6e-5744e35e1c65/arpXHdZRfb.lottie"
              loop
              height={300}
              width={300}
              autoplay
            />
          </div>
          <div className="text-xl font-semibold mb-2">Your cart is empty.</div>
          <div className="mb-6 text-sm text-gray-400">
            Add some delicious items to your cart!
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={menuHref}
              className="px-6 py-3 bg-primary/90 text-gray-900 rounded-xl font-bold shadow hover:bg-primary transition-colors border border-primary/30"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white rounded-xl shadow-md p-4 border border-amber-100"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={item.image || '/placeholder-food.jpg'}
                  alt={item.name}
                  width={56}
                  height={56}
                  className="rounded-lg border border-amber-200"
                />
                <div>
                  <div className="font-bold text-amber-900 text-base sm:text-lg">
                    {item.name}
                  </div>
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="text-xs text-amber-700 mt-1">
                      Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    className="px-2 py-1 bg-primary/10 rounded-full text-primary font-bold text-lg hover:bg-primary/20 transition-colors"
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        Math.max(1, item.quantity - 1),
                        item.addOns,
                      )
                    }
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-bold text-lg px-2">
                    {item.quantity}
                  </span>
                  <button
                    className="px-2 py-1 bg-primary/10 rounded-full text-primary font-bold text-lg hover:bg-primary/20 transition-colors"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1, item.addOns)
                    }
                  >
                    +
                  </button>
                </div>
                <span className="font-bold text-amber-700 text-base">
                  ₹
                  {(
                    item.price * item.quantity +
                    (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) *
                      item.quantity
                  ).toFixed(2)}
                </span>
                <button
                  className="text-xs text-red-500 hover:text-red-700 mt-1 underline underline-offset-2"
                  onClick={() => removeFromCart(item.id, item.addOns)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="font-bold text-lg text-amber-900">Total:</span>
            <span className="font-extrabold text-xl text-amber-700">
              ₹{total.toFixed(2)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 px-2">
            <Link
              href={menuHref}
              className="flex-1 px-4 py-3 rounded-xl bg-primary/90 text-gray-900 font-bold shadow hover:bg-primary transition-colors border border-primary/30 text-center"
            >
              Continue Shopping
            </Link>
            <button
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-white font-bold shadow hover:from-primary hover:to-secondary transition-colors border border-secondary/30 text-center"
              onClick={() => alert('Proceed to checkout (implement logic)')}
            >
              Checkout
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl bg-red-100 text-red-700 font-bold shadow hover:bg-red-200 transition-colors border border-red-200 text-center"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
      {/* Sticky footer for actions on mobile */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-amber-100 shadow-lg flex sm:hidden gap-2 px-4 py-3 animate-fadein">
          <Link
            href={menuHref}
            className="flex-1 px-3 py-2 rounded-lg bg-primary/90 text-gray-900 font-bold shadow hover:bg-primary transition-colors border border-primary/30 text-center text-sm"
          >
            Menu
          </Link>
          <button
            className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-white font-bold shadow hover:from-primary hover:to-secondary transition-colors border border-secondary/30 text-center text-sm"
            onClick={() => alert('Proceed to checkout (implement logic)')}
          >
            Checkout
          </button>
          <button
            className="flex-1 px-3 py-2 rounded-lg bg-red-100 text-red-700 font-bold shadow hover:bg-red-200 transition-colors border border-red-200 text-center text-sm"
            onClick={clearCart}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
