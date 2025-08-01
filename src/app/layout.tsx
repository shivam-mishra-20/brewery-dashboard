import type { Metadata } from 'next'
import './globals.css'
import React, { Suspense } from 'react'
import LayoutClient from '@/components/LayoutClient'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata: Metadata = {
  title: 'The Brewery',
  description:
    'Order management, analytics, and operations for cafes & restaurants.',
  icons: {
    icon: '/coffee.png',
    shortcut: '/coffee.png',
    apple: '/coffee.png',
  },
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
                  <div className="fixed inset-0 flex items-center justify-center min-h-screen w-screen bg-gradient-to-br from-amber-100/95 via-yellow-50/90 to-orange-50/95 z-50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 md:p-12 rounded-3xl shadow-2xl flex flex-col items-center border border-amber-300/40 animate-fade-in max-w-sm w-full mx-4">
                      {/* Coffee icon with spinning effect */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150 animate-pulse"></div>
                        <div className="relative animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-amber-200 border-t-amber-500 border-r-amber-600"></div>
                        <div className="absolute inset-2 sm:inset-3 bg-amber-50 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>

                      <div className="text-center space-y-3">
                        <h1 className="text-xl sm:text-2xl font-bold text-amber-900 animate-pulse">
                          Loading WorkBrew
                        </h1>
                        <p className="text-amber-700/80 text-sm sm:text-base">
                          Brewing your experience...
                        </p>

                        {/* Loading dots */}
                        <div className="flex justify-center space-x-1 mt-4">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
                <AuthProvider>
                  <LayoutClient>
                    <div
                      className=""
                      style={{
                        backgroundColor: 'transparent',
                        width: '',
                      }}
                    >
                      {children}
                    </div>
                  </LayoutClient>
                </AuthProvider>
              </Suspense>
            </CartProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
