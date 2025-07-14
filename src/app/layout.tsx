import type { Metadata } from 'next'
import './globals.css'
import React, { Suspense } from 'react'
import LayoutClient from '@/components/LayoutClient'
import { CartProvider } from '@/context/CartContext'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Order management, analytics, and operations for cafes & restaurants.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', paddingBottom: '4.5rem' }}>
          <ThemeProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50">
                  <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
                    <h1 className="text-xl font-bold text-amber-800">
                      Loading menu...
                    </h1>
                  </div>
                </div>
              }
            >
              <CartProvider>
                <LayoutClient>{children}</LayoutClient>
              </CartProvider>
            </Suspense>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
