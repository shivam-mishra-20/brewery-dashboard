'use client'

import React, { createContext, ReactNode, useContext, useState } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  addOns?: Array<{ name: string; price: number }>
  image?: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (
    id: string,
    addOns?: Array<{ name: string; price: number }>,
  ) => void
  clearCart: () => void
  updateQuantity: (
    id: string,
    quantity: number,
    addOns?: Array<{ name: string; price: number }>,
  ) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
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
  }

  const removeFromCart = (
    id: string,
    addOns?: Array<{ name: string; price: number }>,
  ) => {
    setCart((prev) =>
      prev.filter(
        (ci) =>
          ci.id !== id ||
          (addOns && JSON.stringify(ci.addOns) !== JSON.stringify(addOns)),
      ),
    )
  }

  const clearCart = () => setCart([])

  const updateQuantity = (
    id: string,
    quantity: number,
    addOns?: Array<{ name: string; price: number }>,
  ) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.id === id && JSON.stringify(ci.addOns) === JSON.stringify(addOns)
          ? { ...ci, quantity }
          : ci,
      ),
    )
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}
