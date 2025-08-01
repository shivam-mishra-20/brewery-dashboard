import Link from 'next/link'
import React from 'react'
import { MdErrorOutline } from 'react-icons/md'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100 px-4">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl shadow-lg bg-white/80 border border-yellow-200">
        <MdErrorOutline className="text-[#ffc300] text-6xl mb-2 animate-bounce" />
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-500 mb-4 max-w-md text-center">
          Oops! The page you are looking for does not exist or has been moved.
          <br />
          Please check the URL or return to the dashboard.
        </p>
        <Link
          href="/"
          className="bg-[#ffc300] hover:bg-yellow-400 text-white font-bold py-2 px-6 rounded-xl shadow transition-all duration-200"
        >
          Go to Home
        </Link>
      </div>
      <div className="mt-10 text-gray-400 text-sm">
        The Brewery Café Dashboard
      </div>
    </div>
  )
}
