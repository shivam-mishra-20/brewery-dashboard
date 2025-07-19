'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import { HiOutlineBell, HiOutlineEnvelope } from 'react-icons/hi2'
import { IoMdClose } from 'react-icons/io'
import { IoLogInOutline } from 'react-icons/io5'
import { useAuth } from '@/context/AuthContext'

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (searchQuery.trim()) {
      // Determine which page we're on to route appropriately
      if (pathname === '/orders') {
        router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        // General search across dashboard
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  // Initialize search query from URL if present
  useEffect(() => {
    const search = searchParams.get('search') || searchParams.get('q')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  // Handle Escape key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchFocused) {
        setSearchQuery('')
        searchInputRef.current?.blur()
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchFocused])

  return (
    <header className="w-full   mt-5 px-4 sm:px-6 py-4 mb-3 border border-gray-200 dark:border-gray-300/[0.1] rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#f7f7f7] dark:bg-[#f7f7f7] gap-4 flex-shrink-0">
      {/* Hamburger for sidebar (mobile only, left side) */}
      <div className="flex w-full items-center justify-between sm:hidden mb-2">
        <button
          className="flex items-center justify-center bg-white rounded-full text-black border border-gray-200"
          style={{ width: 48, height: 48 }}
          aria-label="Open sidebar"
          onClick={() => window.dispatchEvent(new Event('openSidebar'))}
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex gap-3 items-center">
          <HiOutlineEnvelope
            className="font-bold bg-white p-3 rounded-full text-black"
            style={{ fontSize: 40 }}
          />
          <HiOutlineBell
            className="font-bold bg-white p-3 rounded-full text-black"
            style={{ fontSize: 40 }}
          />
          <Image
            src="/avatar.svg"
            alt="User Avatar"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full"
          />
        </div>
      </div>
      <form
        onSubmit={handleSearch}
        className="flex w-full sm:max-w-[300px] relative items-center order-2 sm:order-1"
      >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200">
          <CiSearch
            className={`font-bold ${isSearchFocused ? 'text-blue-500' : 'text-black'}`}
            style={{ fontSize: 24 }}
          />
        </span>
        <input
          ref={searchInputRef}
          className={`bg-white border-none text-gray-800 py-3 ring-2 ${isSearchFocused ? 'ring-blue-300' : 'ring-transparent'} outline-none active:outline-none pl-12 pr-12 rounded-full w-full text-sm sm:text-base transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-md`}
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <IoMdClose style={{ fontSize: 20 }} />
          </button>
        )}
        <button
          type="submit"
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full ${
            searchQuery.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          } transition-colors`}
          disabled={!searchQuery.trim()}
          aria-label="Search"
        >
          <CiSearch className="text-white" style={{ fontSize: 16 }} />
        </button>
      </form>
      <div className="hidden sm:flex gap-5 flex-row w-auto items-center justify-end order-1 sm:order-2">
        <HiOutlineEnvelope
          className="font-bold bg-white p-3 rounded-full text-black"
          style={{ fontSize: 48 }}
        />
        <HiOutlineBell
          className="font-bold bg-white p-3 rounded-full text-black"
          style={{ fontSize: 48 }}
        />
        <div className="flex items-center">
          <Image
            src="/avatar.svg"
            alt="User Avatar"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full"
          />
          <div className="hidden sm:flex flex-col ml-3">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : user ? (
              <>
                <h1 className="text-sm sm:text-base font-medium">
                  {user.name}
                </h1>
                <div className="flex items-center  space-x-3 text-xs sm:text-sm">
                  <p className="font-inter-regular text-gray-500">
                    {user.email}
                  </p>
                  <button
                    onClick={logout}
                    className="text-blue-500 hover:underline"
                  >
                    <IoLogInOutline className="text-2xl" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-sm sm:text-base">Not logged in</h1>
                <p className="text-xs sm:text-sm font-inter-regular">
                  <Link href="/login" className="text-blue-500 hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
