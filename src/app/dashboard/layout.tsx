'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar.responsive'
import { ThemeProvider } from '@/context/ThemeContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  useEffect(() => {
    // Check for JWT token in localStorage
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.replace('/login')
    }
  }, [router])
  return (
    <ThemeProvider>
      <div
        className="min-h-[95vh] overflow-x-hidden flex bg-background text-foreground"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Sidebar />
        <div
          className="flex-1 flex flex-col min-h-[95vh]"
          style={{ overflow: 'hidden' }}
        >
          <Navbar />
          <main className="flex-1 px-5 md:px-0 pb-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
