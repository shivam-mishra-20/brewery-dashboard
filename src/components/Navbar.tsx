'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import { HiOutlineBell, HiOutlineEnvelope } from 'react-icons/hi2'

const Navbar: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/user')
        const data = await res.json()
        if (res.ok && Array.isArray(data.users) && data.users.length > 0) {
          // For demo, just use the first user
          setUser(data.users[0])
        }
      } catch {}
    }
    fetchUser()
  }, [])

  return (
    <header className="w-full mt-5 px-4 sm:px-6 py-4 mb-3 border border-gray-200 dark:border-gray-300/[0.1] rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#f7f7f7] dark:bg-[#f7f7f7] gap-4 flex-shrink-0">
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
      <div className="flex w-full sm:max-w-[15vw] relative items-center order-2 sm:order-1">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <CiSearch className="font-bold text-black" style={{ fontSize: 24 }} />
        </span>
        <input
          className="bg-white border-none text-gray-800 py-2 ring-transparent outline-none active:outline-none pl-12 pr-5 rounded-full w-full text-sm sm:text-base"
          placeholder="Search..."
        />
      </div>
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
            <h1 className="text-sm sm:text-base">
              {user ? user.name : 'Loading...'}
            </h1>
            <p className="text-xs sm:text-sm font-inter-regular text-gray-500">
              {user ? user.email : ''}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
