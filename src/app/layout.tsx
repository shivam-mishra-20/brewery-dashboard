import type { Metadata } from 'next'
import './globals.css'
import React, { Suspense } from 'react'
import LayoutClient from '@/components/LayoutClient'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata: Metadata = {
  title: 'Work Brew Cafe',
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
      <head>
        <link rel="icon" href="/coffee.png" type="image/png" />
      </head>
      <body>
        <div style={{ minHeight: '100vh', paddingBottom: '4.5rem' }}>
          <ThemeProvider>
            <CartProvider>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center  bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/50">
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
                      <h1 className="text-xl font-bold text-amber-800">
                        Loading menu...
                      </h1>
                    </div>
                  </div>
                }
              >
                <AuthProvider>
                  <LayoutClient>{children}</LayoutClient>
                </AuthProvider>
              </Suspense>
            </CartProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
