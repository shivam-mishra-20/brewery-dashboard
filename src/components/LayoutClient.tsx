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
  const isDashboard = pathname.startsWith('/dashboard')
  return (
    <>
      <main className="w-full mx-auto light">{children}</main>
      {!isDashboard && <BottomNavBar />}
    </>
  )
}
