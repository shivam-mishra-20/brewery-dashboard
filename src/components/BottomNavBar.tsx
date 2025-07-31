'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { MdReceiptLong, MdShoppingCart } from 'react-icons/md'
import { PiForkKnifeBold } from 'react-icons/pi'
import { useCart } from '@/context/CartContext'

const navItems = [
  { label: 'Menu', icon: PiForkKnifeBold, href: '/menu' },
  { label: 'Cart', icon: MdShoppingCart, href: '/cart' },
  { label: 'Orders', icon: MdReceiptLong, href: '/orders' },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/20 backdrop-blur-xs shadow-2xl flex justify-around items-center py-3 px-2"
      style={{
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #232323',
      }}
    >
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
            className={`relative flex flex-col items-center gap-1 px-4 font-serif font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
              ${isActive ? 'text-[#FFC600]' : 'text-[#CFCFCF] hover:text-[#FFC600]'}
            `}
            tabIndex={0}
            style={{
              minWidth: 70,
            }}
          >
            <span
              className={`text-3xl mb-1 ${isActive ? 'scale-110' : ''} transition-transform`}
              style={{
                color: isActive ? '#FFC600' : '#CFCFCF',
                filter: isActive
                  ? 'drop-shadow(0 2px 8px #FFC60033)'
                  : undefined,
              }}
            >
              <Icon />
            </span>
            <span
              className={`text-xs font-serif font-medium tracking-wide ${isActive ? 'text-[#FFC600]' : 'text-[#CFCFCF]'}`}
              style={{ letterSpacing: 0.5 }}
            >
              {item.label}
            </span>
            {/* Cart badge */}
            {item.label === 'Cart' && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#FFC600] text-[#121212] text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-[#232323] shadow">
                {cartCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
