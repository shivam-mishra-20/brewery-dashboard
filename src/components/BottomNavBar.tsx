'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FiCoffee, FiList, FiShoppingCart } from 'react-icons/fi'

const navItems = [
  { label: 'Menu', icon: <FiCoffee />, href: '/menu' },
  { label: 'Cart', icon: <FiShoppingCart />, href: '/cart' },
  { label: 'Orders', icon: <FiList />, href: '/orders' },
]

export default function BottomNavBar() {
  const searchParams = useSearchParams()
  const tableDataParam = searchParams.get('tabledata')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg shadow-lg border-t border-amber-200 flex justify-around items-center py-3">
      {navItems.map((item) => {
        const href = tableDataParam
          ? `${item.href}?tabledata=${encodeURIComponent(tableDataParam)}`
          : item.href
        return (
          <Link
            key={item.label}
            href={href}
            className="flex flex-col items-center gap-1 text-amber-700 hover:text-amber-900 transition-colors font-semibold px-4"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
