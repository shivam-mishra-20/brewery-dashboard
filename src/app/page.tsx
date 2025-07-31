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
      className="bg-[#0B3D2E] bg-[url('/bg-image.png')] bg-cover bg-center bg-no-repeat bg-fixed relative overflow-hidden font-serif"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 to-transparent"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#FFC600]/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#FFC600]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFC600]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-6">
        <div className="bg-[#23272F]/80 backdrop-blur-xl border border-[#FFC600]/20 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col items-center max-w-xs sm:max-w-md md:max-w-lg w-full mx-auto">
          {/* Icon and main heading */}
          <div className="relative mb-2 md:mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-[#FFC600]/20 rounded-full blur-2xl animate-pulse"></div>
            <FiCoffee className="relative text-[#FFC600] text-4xl sm:text-5xl md:text-6xl animate-bounce" />
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-center mb-3">
            <span className="text-white font-serif">Welcome to</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFC600] via-[#FFD700] to-[#FFC600] mt-1 inline-block font-serif">
              The Brewery
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-yellow-100/80 mb-4 md:mb-6 text-center max-w-sm leading-relaxed px-2">
            Advanced Café Management Dashboard for Modern Coffee Shops
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 w-full mb-4 md:mb-6">
            <div className="bg-[#FFC600]/10 border border-[#FFC600]/20 rounded-xl p-2 md:p-3 text-center hover:bg-[#FFC600]/20 transition-all duration-300">
              <FiTrendingUp className="text-[#FFC600] text-lg md:text-xl mx-auto mb-1" />
              <span className="text-[#FFD700] text-xs font-medium font-serif">
                Sales Analytics
              </span>
            </div>
            <div className="bg-[#FFC600]/10 border border-[#FFC600]/20 rounded-xl p-2 md:p-3 text-center hover:bg-[#FFC600]/20 transition-all duration-300">
              <FiShield className="text-[#FFC600] text-lg md:text-xl mx-auto mb-1" />
              <span className="text-[#FFD700] text-xs font-medium font-serif">
                Order Management
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="w-full space-y-2 md:space-y-3 mb-4 md:mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-[#FFC600] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFC600] text-[#23272F] font-bold py-3 md:py-4 px-4 md:px-6 rounded-2xl shadow-xl hover:shadow-[#FFC600]/25 transform hover:scale-[1.01] transition-all duration-300 ease-out border border-[#FFC600]/50 font-serif"
            >
              <span className="text-sm md:text-base font-serif">
                Access Dashboard
              </span>
              <div className="text-xs opacity-90 mt-1 font-serif">
                View café analytics & orders
              </div>
            </button>

            <button
              onClick={() => router.push('/menu')}
              className="w-full bg-gradient-to-r from-[#23272F] to-[#18382D] hover:from-[#23272F]/80 hover:to-[#18382D]/80 text-[#FFC600] font-bold py-3 md:py-4 px-4 md:px-6 rounded-2xl shadow-xl hover:shadow-[#23272F]/25 transform hover:scale-[1.01] transition-all duration-300 ease-out border border-[#23272F]/50 font-serif"
            >
              <span className="text-sm md:text-base font-serif">
                Browse Menu
              </span>
              <div className="text-xs opacity-90 mt-1 font-serif">
                View our coffee & food selection
              </div>
            </button>
          </div>

          {/* Coming soon banner */}
          <div className="w-full bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border border-amber-400/30 rounded-2xl p-3 md:p-4 backdrop-blur-sm hover:from-amber-600/30 hover:to-yellow-600/30 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 text-center">
              <FiTruck className="text-[#FFC600] text-xl md:text-2xl flex-shrink-0 animate-bounce" />
              <div>
                <div className="font-bold text-[#FFD700] text-sm md:text-base font-serif">
                  Delivery & Takeaway
                </div>
                <div className="text-[#FFC600]/80 text-xs font-serif">
                  Coming soon to The Brewery!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer tagline */}
        <div className="mt-4 md:mt-6 text-center px-4">
          <p className="text-[#FFC600]/60 text-xs font-serif">
            Your favorite spot for coffee, comfort, and creativity
          </p>
        </div>
      </div>
    </div>
  )
}
