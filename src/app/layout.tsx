import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import { FiCoffee } from 'react-icons/fi'
import BottomNavBar from '@/components/BottomNavBar'
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
                {/* Main Content */}
                <main className="w-full mx-auto light">{children}</main>
                <footer className="bg-gradient-to-r from-amber-50/90 to-white/90 backdrop-blur-sm border-t border-amber-100 py-6 mt-12 relative z-10">
                  <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <FiCoffee className="text-amber-600" />
                        <span className="text-amber-800 font-semibold">
                          Work Brew Café
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Enjoy your meal! • Scan the QR code for your table to
                        order
                      </div>
                      <div className="flex items-center gap-4">
                        <button className="text-amber-700 hover:text-amber-800">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                          </svg>
                        </button>
                        <button className="text-amber-700 hover:text-amber-800">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        <button className="text-amber-700 hover:text-amber-800">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              </CartProvider>
              <BottomNavBar />
            </Suspense>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
