'use client'

import { FiCoffee, FiTruck } from 'react-icons/fi'

export default function HomeIntro() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-white px-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 flex flex-col items-center max-w-lg w-full">
        <FiCoffee className="text-amber-600 text-6xl mb-4 animate-bounce" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 mb-2 text-center">
          Welcome to <br />
          <span className="bg-clip-text mt-4 text-transparent bg-gradient-to-r from-primary to-secondary">
            Work Brew Café
          </span>
        </h1>
        <p className="text-lg text-gray-700 mb-6 mt-3 text-center">
          Your favorite spot for coffee, comfort, and creativity.
        </p>
        <div className="flex items-center text-center gap-2 bg-gradient-to-tr from-primary to-secondary border border-primary/[0.1] shadow-white/[0.5] shadow-inner rounded-xl px-4 py-3 shadow-inner">
          <FiTruck className="text-white text-2xl" />
          <span className="font-semibold text-white text-lg">
            Delivery &amp; Takeaway options are coming soon!
          </span>
        </div>
      </div>
    </div>
  )
}
