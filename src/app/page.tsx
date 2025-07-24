'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { FiCoffee, FiShield, FiTrendingUp, FiTruck } from 'react-icons/fi'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabledata = searchParams.get('tabledata')

  useEffect(() => {
    // If there's tabledata in the URL, redirect to our menu page
    if (tabledata) {
      // We'll let the menu page handle decryption and verification
      router.push(`/menu?tabledata=${encodeURIComponent(tabledata)}`)
    }

    // Disable scrolling on this page
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // Cleanup function to restore scrolling when leaving this page
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [router, tabledata])

  return (
    <div
      data-page="home"
      style={{ overflow: 'hidden', height: '100vh', width: '100vw' }}
      className="bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-800 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 to-transparent"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 flex flex-col items-center max-w-xs sm:max-w-md md:max-w-lg w-full mx-auto">
          {/* Icon and main heading */}
          <div className="relative mb-2 md:mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
            <FiCoffee className="relative text-yellow-300 text-4xl sm:text-5xl md:text-6xl animate-bounce" />
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-center mb-3">
            <span className="text-white">Welcome to</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 mt-1 inline-block">
              WorkBrew Café
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-yellow-100/80 mb-4 md:mb-6 text-center max-w-sm leading-relaxed px-2">
            Advanced Café Management Dashboard for Modern Coffee Shops
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 w-full mb-4 md:mb-6">
            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-2 md:p-3 text-center hover:bg-yellow-500/20 transition-all duration-300">
              <FiTrendingUp className="text-yellow-300 text-lg md:text-xl mx-auto mb-1" />
              <span className="text-yellow-100 text-xs font-medium">
                Sales Analytics
              </span>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-2 md:p-3 text-center hover:bg-yellow-500/20 transition-all duration-300">
              <FiShield className="text-yellow-300 text-lg md:text-xl mx-auto mb-1" />
              <span className="text-yellow-100 text-xs font-medium">
                Order Management
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="w-full space-y-2 md:space-y-3 mb-4 md:mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-2xl shadow-xl hover:shadow-yellow-500/25 transform hover:scale-[1.01] transition-all duration-300 ease-out border border-yellow-500/50"
            >
              <span className="text-sm md:text-base">Access Dashboard</span>
              <div className="text-xs opacity-90 mt-1">
                View café analytics & orders
              </div>
            </button>

            <button
              onClick={() => router.push('/menu')}
              className="w-full bg-gradient-to-r from-orange-700 to-amber-800 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-2xl shadow-xl hover:shadow-orange-500/25 transform hover:scale-[1.01] transition-all duration-300 ease-out border border-orange-600/50"
            >
              <span className="text-sm md:text-base">Browse Menu</span>
              <div className="text-xs opacity-90 mt-1">
                View our coffee & food selection
              </div>
            </button>
          </div>

          {/* Coming soon banner */}
          <div className="w-full bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border border-amber-400/30 rounded-2xl p-3 md:p-4 backdrop-blur-sm hover:from-amber-600/30 hover:to-yellow-600/30 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 text-center">
              <FiTruck className="text-amber-300 text-xl md:text-2xl flex-shrink-0 animate-bounce" />
              <div>
                <div className="font-bold text-amber-100 text-sm md:text-base">
                  Delivery & Takeaway
                </div>
                <div className="text-amber-200/80 text-xs">
                  Coming soon to WorkBrew Café!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer tagline */}
        <div className="mt-4 md:mt-6 text-center px-4">
          <p className="text-yellow-300/60 text-xs">
            Your favorite spot for coffee, comfort, and creativity
          </p>
        </div>
      </div>
    </div>
  )
}
