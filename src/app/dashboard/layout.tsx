'use client'

import { ConfigProvider } from 'antd'
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
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#ffc300',
            colorPrimaryHover: '#fede31',
            colorBorder: '#e5e7eb',
            colorBgContainer: '#fff',
            borderRadius: 12,
            controlHeight: 40,
            fontFamily: 'Inter, inter, sans-serif',
          },
          components: {
            Select: {
              borderRadius: 12,
              controlHeight: 40,
              fontSize: 15,
              colorPrimary: '#ffc300',
              colorPrimaryHover: '#fede31',
              colorBgContainer: '#fff',
              colorBorder: '#e5e7eb',
              colorText: '#1e293b',
              colorTextPlaceholder: '#bdbdbd',
              fontFamily: 'Inter, inter, sans-serif',
            },
          },
        }}
      >
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
      </ConfigProvider>
    </ThemeProvider>
  )
}
