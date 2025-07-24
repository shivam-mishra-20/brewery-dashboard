'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import BottomNavBar from '@/components/BottomNavBar'

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hideBottomNav =
    pathname.startsWith('/dashboard') ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname === '/not-found' ||
    pathname === '/signup'
  return (
    <>
      <main className="w-full mx-auto light">{children}</main>
      {!hideBottomNav && <BottomNavBar />}
    </>
  )
}
