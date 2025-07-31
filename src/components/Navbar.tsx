'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredPages, setFilteredPages] = useState<any[]>([])

  // List of available dashboard pages
  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Orders', path: '/dashboard/orders' },
    { name: 'Tables', path: '/dashboard/tables' },
    { name: 'Menu', path: '/dashboard/menu' },
    { name: 'Settings', path: '/dashboard/settings' },
    { name: 'Suppliers', path: '/dashboard/inventory/suppliers' },
    { name: 'Inventory', path: '/dashboard/inventory' },
  ]
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (filteredPages.length > 0) {
      router.push(filteredPages[0].path)
      setShowDropdown(false)
      setSearchQuery('')
    }
  }

  // Handle input change for dashboard page search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value.trim() === '') {
      setFilteredPages([])
      setShowDropdown(false)
      return
    }
    const filtered = pages.filter((page) =>
      page.name.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredPages(filtered)
    setShowDropdown(filtered.length > 0)
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
    <header className="w-full mt-5 px-4 sm:px-6 py-4 mb-3 border border-[#E0E0E0] rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#F9FAFB] gap-4 flex-shrink-0">
      {/* Hamburger for sidebar (mobile only, left side) */}
      <div className="flex w-full items-center justify-between sm:hidden mb-2">
        <button
          className="flex items-center justify-center bg-white rounded-full text-[#1A1A1A] border border-[#E0E0E0]"
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
            className="font-bold bg-white p-3 rounded-full text-[#04B851] border border-[#E0E0E0]"
            style={{ fontSize: 40 }}
          />
          <HiOutlineBell
            className="font-bold bg-white p-3 rounded-full text-[#04B851] border border-[#E0E0E0]"
            style={{ fontSize: 40 }}
          />
          <Image
            src="/avatar.svg"
            alt="User Avatar"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full border border-[#E0E0E0]"
          />
        </div>
      </div>
      <form
        onSubmit={handleSearch}
        className="flex w-full sm:max-w-[300px] relative items-center order-2 sm:order-1"
      >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4D4D4D] pointer-events-none transition-all duration-200">
          <CiSearch
            className={`font-bold ${isSearchFocused ? 'text-[#04B851]' : 'text-[#1A1A1A]'}`}
            style={{ fontSize: 24 }}
          />
        </span>
        <input
          ref={searchInputRef}
          className={`bg-white border-none text-[#1A1A1A] py-3 ring-2 ${isSearchFocused ? 'ring-[#04B851]' : 'ring-transparent'} outline-none active:outline-none pl-12 pr-12 rounded-full w-full text-sm sm:text-base transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-md`}
          style={{
            boxShadow: isSearchFocused ? '0 0 0 2px #04B851' : undefined,
            borderColor: '#04B851',
          }}
          placeholder="Search pages..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            setIsSearchFocused(true)
            if (filteredPages.length > 0) setShowDropdown(true)
          }}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
          autoComplete="off"
        />
        {/* Dropdown for dashboard page search */}
        {showDropdown && (
          <div className="absolute left-0 top-12 w-full bg-white border border-[#04B851] rounded-xl shadow-lg z-50">
            {filteredPages.map((page) => (
              <button
                key={page.path}
                className="w-full text-left px-4 py-2 hover:bg-[#e6f9f0] focus:bg-[#e6f9f0] focus:outline-none text-base text-[#1A1A1A]"
                tabIndex={0}
                style={{ color: '#1A1A1A' }}
                onMouseDown={() => {
                  router.push(page.path)
                  setShowDropdown(false)
                  setSearchQuery('')
                }}
              >
                {page.name}
              </button>
            ))}
            {filteredPages.length === 0 && (
              <div className="px-4 py-2 text-[#4D4D4D]">No pages found</div>
            )}
          </div>
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-[#4D4D4D] hover:text-[#04B851] transition-colors"
            aria-label="Clear search"
          >
            <IoMdClose style={{ fontSize: 20 }} />
          </button>
        )}
        <button
          type="submit"
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full ${
            searchQuery.trim()
              ? 'bg-[#04B851] hover:bg-[#039f45]'
              : 'bg-[#E0E0E0]'
          } transition-colors`}
          style={
            searchQuery.trim()
              ? { background: '#04B851', borderColor: '#04B851' }
              : {}
          }
          disabled={!searchQuery.trim()}
          aria-label="Search"
        >
          <CiSearch className="text-white" style={{ fontSize: 16 }} />
        </button>
      </form>
      <div className="hidden sm:flex gap-5 flex-row w-auto items-center justify-end order-1 sm:order-2">
        <HiOutlineEnvelope
          className="font-bold bg-white p-3 rounded-full text-[#04B851] border border-[#E0E0E0]"
          style={{ fontSize: 48 }}
        />
        <HiOutlineBell
          className="font-bold bg-white p-3 rounded-full text-[#04B851] border border-[#E0E0E0]"
          style={{ fontSize: 48 }}
        />
        <div className="flex items-center">
          <Image
            src="/avatar.svg"
            alt="User Avatar"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full border border-[#E0E0E0]"
          />
          <div className="hidden sm:flex flex-col ml-3">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : user ? (
              <>
                <h1 className="text-sm sm:text-base font-medium text-[#1A1A1A]">
                  {user.name}
                </h1>
                <div className="flex items-center space-x-3 text-xs sm:text-sm">
                  <p className="font-inter-regular text-[#4D4D4D]">
                    {user.email}
                  </p>
                  <button
                    onClick={logout}
                    className="text-[#04B851] hover:underline"
                  >
                    <IoLogInOutline className="text-2xl" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-sm sm:text-base text-[#1A1A1A]">
                  Not logged in
                </h1>
                <p className="text-xs sm:text-sm font-inter-regular">
                  <Link
                    href="/login"
                    className="text-[#04B851] hover:underline"
                  >
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
