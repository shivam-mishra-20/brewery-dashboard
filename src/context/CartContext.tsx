'use client'

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  addOns?: Array<{ name: string; price: number }>
  image?: string
  instructions?: string
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
  updateInstructions: (
    id: string,
    instructions: string,
    addOns?: Array<{ name: string; price: number }>,
  ) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

// Helper function to normalize add-ons for consistent comparison
const normalizeAddOns = (addOns?: { name: string; price: number }[]) => {
  if (!addOns || addOns.length === 0) return ''
  return addOns
    .map((a) => `${a.name}:${a.price}`)
    .sort()
    .join('|')
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cart')
        // Ensure all items have valid quantities when loading from storage
        const parsedCart = stored ? JSON.parse(stored) : []
        return parsedCart.map((item: CartItem) => ({
          ...item,
          quantity: Math.max(1, parseInt(String(item.quantity)) || 1), // Ensure valid quantity
        }))
      } catch (error) {
        console.error('Error loading cart from storage:', error)
        return []
      }
    }
    return []
  })

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart))

      // Debug cart state whenever it changes
      console.log(
        'Cart updated:',
        cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          addOns: item.addOns,
        })),
      )
    }
  }, [cart])

  const addToCart = (item: CartItem) => {
    // Make sure quantity is a valid number
    const quantityToAdd = Math.max(1, parseInt(String(item.quantity)) || 1)

    // Create a clean item with validated quantity
    const cleanItem = {
      ...item,
      quantity: quantityToAdd,
    }

    // Log the operation
    console.log(`Adding to cart: ${cleanItem.name}, Quantity: ${quantityToAdd}`)

    setCart((previousCart) => {
      // Create a unique key for this item configuration (ID + add-ons)
      const itemKey = `${cleanItem.id}|${normalizeAddOns(cleanItem.addOns)}`

      // Log existing cart items
      console.log(
        'Previous cart items:',
        previousCart.map(
          (i) =>
            `${i.name} (${i.id}): ${i.quantity} - AddOns: ${normalizeAddOns(i.addOns)}`,
        ),
      )

      // Find existing item index
      const existingIndex = previousCart.findIndex((cartItem) => {
        const cartItemKey = `${cartItem.id}|${normalizeAddOns(cartItem.addOns)}`
        return cartItemKey === itemKey
      })

      // If item doesn't exist in cart
      if (existingIndex === -1) {
        console.log(
          `Item not in cart. Adding as new with quantity ${quantityToAdd}`,
        )
        return [...previousCart, cleanItem]
      }

      // If item exists, create a new cart array
      const updatedCart = [...previousCart]

      // Calculate the new quantity
      const existingQuantity = updatedCart[existingIndex].quantity
      const newTotalQuantity = existingQuantity + quantityToAdd

      console.log(
        `Item found in cart at index ${existingIndex}. Current quantity: ${existingQuantity}`,
      )
      console.log(
        `Adding ${quantityToAdd} more for new total: ${newTotalQuantity}`,
      )

      // Update the existing item
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newTotalQuantity,
      }

      return updatedCart
    })
  }

  const removeFromCart = (
    id: string,
    addOns?: Array<{ name: string; price: number }>,
  ) => {
    setCart((prev) => {
      const removeKey = `${id}|${normalizeAddOns(addOns)}`

      return prev.filter((ci) => {
        const ciKey = `${ci.id}|${normalizeAddOns(ci.addOns)}`
        return ciKey !== removeKey
      })
    })
  }

  const clearCart = () => setCart([])

  const updateQuantity = (
    id: string,
    quantity: number,
    addOns?: Array<{ name: string; price: number }>,
  ) => {
    setCart((prev) => {
      const updateKey = `${id}|${normalizeAddOns(addOns)}`

      return prev.map((ci) => {
        const ciKey = `${ci.id}|${normalizeAddOns(ci.addOns)}`
        return ciKey === updateKey ? { ...ci, quantity } : ci
      })
    })
  }

  const updateInstructions = (
    id: string,
    instructions: string,
    addOns?: Array<{ name: string; price: number }>,
  ) => {
    setCart((prev) => {
      const updateKey = `${id}|${normalizeAddOns(addOns)}`
      return prev.map((ci) => {
        const ciKey = `${ci.id}|${normalizeAddOns(ci.addOns)}`
        return ciKey === updateKey ? { ...ci, instructions } : ci
      })
    })
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        updateInstructions,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
