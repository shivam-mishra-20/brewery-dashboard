'use client'

import Image from 'next/image'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart()

  const total = cart.reduce(
    (sum, item) =>
      sum +
      (item.price * item.quantity +
        (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) * item.quantity),
    0,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50 pt-8 pb-24">
      <h1 className="text-3xl font-bold text-amber-900 text-center mb-8">
        Your Cart
      </h1>
      {cart.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          Your cart is empty.
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
                  <div className="font-bold text-amber-900">{item.name}</div>
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="text-xs text-amber-700">
                      Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    className="px-2 py-1 bg-amber-100 rounded-full text-amber-700 font-bold"
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
                    className="px-2 py-1 bg-amber-100 rounded-full text-amber-700 font-bold"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1, item.addOns)
                    }
                  >
                    +
                  </button>
                </div>
                <span className="font-bold text-amber-700">
                  ₹
                  {(
                    item.price * item.quantity +
                    (item.addOns?.reduce((s, a) => s + a.price, 0) || 0) *
                      item.quantity
                  ).toFixed(2)}
                </span>
                <button
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                  onClick={() => removeFromCart(item.id, item.addOns)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between mt-6">
            <span className="font-bold text-lg text-amber-900">Total:</span>
            <span className="font-extrabold text-xl text-amber-700">
              ₹{total.toFixed(2)}
            </span>
          </div>
          <button
            className="w-full py-3 mt-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-lg hover:from-amber-700 hover:to-yellow-600 transition-all"
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  )
}
