'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { FiCoffee, FiList, FiShoppingCart } from 'react-icons/fi'
import { useCart } from '@/context/CartContext'

const navItems = [
  { label: 'Menu', icon: FiCoffee, href: '/menu' },
  { label: 'Cart', icon: FiShoppingCart, href: '/cart' },
  { label: 'Orders', icon: FiList, href: '/orders' },
]

export default function BottomNavBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tableDataParam = searchParams.get('tabledata')
  const { cart } = useCart?.() || { cart: [] }

  // Calculate cart count
  const cartCount =
    cart && Array.isArray(cart)
      ? cart.reduce((total, item) => total + (item.quantity || 0), 0)
      : 0

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg shadow-lg border-t border-amber-200 flex justify-around items-center py-3">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const href = tableDataParam
          ? `${item.href}?tabledata=${encodeURIComponent(tableDataParam)}`
          : item.href
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={href}
            aria-label={item.label}
            className={`relative flex flex-col items-center gap-1 px-4 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
              ${isActive ? 'text-secondary' : 'text-amber-700 hover:text-amber-900'}`}
            tabIndex={0}
          >
            <span
              className={`text-2xl ${isActive ? 'scale-110' : ''} transition-transform`}
            >
              <Icon />
            </span>
            <span className="text-xs">{item.label}</span>
            {/* Cart badge */}
            {item.label === 'Cart' && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
