'use client'

import {
  CoffeeOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { BiHelpCircle } from 'react-icons/bi'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { LuUsers } from 'react-icons/lu'
import { MdOutlineInventory, MdOutlineTableBar } from 'react-icons/md'
import { SlBadge } from 'react-icons/sl'
import { useAuth } from '@/context/AuthContext'

const menuSections = [
  {
    title: 'MENU',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <DashboardOutlined /> },
      {
        label: 'Inventory',
        href: '/dashboard/inventory',
        icon: <MdOutlineInventory />,
      },
      {
        label: 'Suppliers',
        href: '/dashboard/inventory/suppliers',
        icon: <LuUsers />,
      },

      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: <ShoppingCartOutlined />,
      },
      {
        label: 'Tables',
        href: '/dashboard/tables',
        icon: <MdOutlineTableBar />,
      },
      { label: 'Menu', href: '/dashboard/menu', icon: <CoffeeOutlined /> },
    ],
  },
  {
    title: 'GENERAL',
    items: [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: <SettingOutlined />,
      },
      { label: 'Help', href: '/dashboard/help', icon: <BiHelpCircle /> },
      { label: 'Logout', href: '/login', icon: <LogoutOutlined /> },
    ],
  },
]

const sidebarVariants = {
  open: {
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  closed: {
    x: '-100%',
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
}

const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('MENU')
  const { logout } = useAuth() // <-- Use AuthContext logout

  // Listen for custom event from Navbar to open sidebar
  React.useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('openSidebar', handler)
    return () => window.removeEventListener('openSidebar', handler)
  }, [])

  const handleSectionToggle = (title: string) => {
    setExpandedSection((prev) => (prev === title ? null : title))
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-[95vh] relative mt-5 rounded-2xl w-64 mx-5 bg-[#F9FAFB] border border-[#E0E0E0] flex-col p-4 overflow-hidden">
        <div className="flex flex-col items-center justify-center w-full -mb-20">
          <div className="flex items-center justify-center w-full">
            <Image
              src="/The Brewery Logo 1.png"
              alt="logo"
              className="-mt-10 pb-10"
              unoptimized
              height={200}
              width={200}
            />
          </div>
        </div>
        {menuSections.map((section) => (
          <div
            key={section.title}
            className={`flex flex-col ${section.title === 'GENERAL' ? '' : ''} gap-2`}
          >
            <button
              type="button"
              className="flex items-start gap-2 px-3 py-2 w-full text-sm font-inter text-[#4D4D4D] focus:outline-none"
              onClick={() => handleSectionToggle(section.title)}
              aria-expanded={expandedSection === section.title}
            >
              {expandedSection === section.title ? (
                <FiChevronDown className="text-lg" />
              ) : (
                <FiChevronRight className="text-lg" />
              )}
              {section.title}
            </button>
            <AnimatePresence initial={false}>
              {expandedSection === section.title && (
                <motion.div
                  key={section.title + '-items'}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {section.items.map((item) => (
                    <div key={item.href}>
                      {item.label === 'Logout' ? (
                        <button
                          className={`flex items-center tracking-tight gap-3 px-3 py-2 rounded transition-colors font-inter-semibold hover:bg-[#e6f9f0] text-[#4D4D4D] w-full`}
                          onClick={() => {
                            logout()
                          }}
                        >
                          <span className="text-xl text-[#4D4D4D]">
                            {item.icon}
                          </span>
                          {item.label}
                        </button>
                      ) : (
                        <a
                          href={item.href}
                          className={`flex items-center tracking-tight gap-3 px-3 py-2 rounded transition-colors font-inter-semibold
                            hover:bg-[#e6f9f0] 
                            ${pathname === item.href ? 'text-[#1A1A1A]' : 'text-[#4D4D4D]'}
                          `}
                        >
                          {pathname === item.href && (
                            <p className="h-[35px] absolute left-0 rounded-tr-lg rounded-br-lg w-[6px] shadow-inner shadow-white/[0.5] border-[#04B851]/[0.1] border-r border-t border-b bg-[#04B851]"></p>
                          )}
                          <span
                            className={`text-xl ${pathname === item.href ? 'text-[#04B851]' : 'text-[#4D4D4D]'} ${section.title === 'MENU' && pathname === item.href ? 'font-bold' : ''}`}
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </a>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        <div className="w-full absolute bottom-0 left-0 flex items-center justify-center px-4 pb-3">
          <div
            className="flex flex-col items-center justify-between rounded-3xl overflow-hidden shadow-lg w-full border border-[#E0E0E0]"
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              backgroundImage:
                "url('https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrBYl1cBdZnCt1-V9e75Klm4Xy3s-m92VY3IXzOzB5pDKW1-jZhCvD0juPWM7dr9xeYysKaL6Vj_UP4woA8Uw2523MpdrojIzisb-b23-7fTjZmz3_gzzQFwmaDQOqqVX4HnHc=s680-w680-h510-rw')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minWidth: '80px',
              minHeight: '80px',
              maxWidth: '95%',
              maxHeight: '100%',
            }}
          >
            <div className="flex relative flex-col items-start w-full h-full bg-black/[0.6] rounded-3xl p-3">
              <div className="bg-white rounded-full p-2 mb-1 w-fit">
                <SlBadge style={{ color: '#04B851', fontSize: 18 }} />
              </div>
              <h1 className="text-white text-2xl font-inter mb-1">
                Powered By <br />
                <span className="text-white/80 mb-1">Okay Bills</span>
              </h1>
              <p className="text-white pt-1 text-xs font-inter-regular font-light mb-2">
                Get easy in another way
              </p>
              <div className="flex absolute bottom-5 left-0 w-full justify-center items-end ">
                <button className="text-white w-4/5 text-xs bg-gradient-to-tr from-[#04B851] to-[#039f45] shadow-white/[.4] border border-[#04B851]/10 shadow-inner py-2 rounded-2xl ">
                  Visit Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* Mobile sidebar with framer-motion */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed top-0 left-0 z-50 h-screen w-64 bg-[#F9FAFB] border border-[#E0E0E0] flex flex-col p-4 shadow-2xl lg:hidden"
          >
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow border border-[#E0E0E0]"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
            <div className="flex flex-col items-center justify-center w-full mb-8 mt-8">
              <div className="flex items-center justify-start gap-3 w-full">
                <Image
                  src="/workbrewLogo.jpg"
                  alt="logo"
                  className="rounded-xl border border-[#04B851]/60 bg-[#e6f9f0] p-1"
                  unoptimized
                  height={50}
                  width={50}
                />
                <h2 className="text-xl tracking-tighter font-inter-semibold pt-1 text-[#04B851]">
                  Work Brew
                </h2>
              </div>
            </div>
            {menuSections.map((section) => (
              <div
                key={section.title}
                className={`flex flex-col ${section.title === 'GENERAL' ? 'pt-10' : 'pt-7'} gap-2`}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 w-full text-sm font-inter text-[#4D4D4D] focus:outline-none"
                  onClick={() =>
                    setExpandedSection((prev) =>
                      prev === section.title ? null : section.title,
                    )
                  }
                  aria-expanded={expandedSection === section.title}
                >
                  {expandedSection === section.title ? (
                    <FiChevronDown className="text-lg" />
                  ) : (
                    <FiChevronRight className="text-lg" />
                  )}
                  {section.title}
                </button>
                <AnimatePresence initial={false}>
                  {expandedSection === section.title && (
                    <motion.div
                      key={section.title + '-items-mobile'}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {section.items.map((item) => (
                        <div key={item.href}>
                          {item.label === 'Logout' ? (
                            <button
                              className="flex items-center tracking-tight gap-3 px-3 py-2 rounded transition-colors font-inter-semibold hover:bg-[#e6f9f0] text-[#4D4D4D] w-full"
                              onClick={() => {
                                setOpen(false)
                                logout()
                              }}
                            >
                              <span className="text-xl text-[#4D4D4D]">
                                {item.icon}
                              </span>
                              {item.label}
                            </button>
                          ) : (
                            <a
                              href={item.href}
                              className={`flex items-center tracking-tight gap-3 px-3 py-2 rounded transition-colors font-inter-semibold
                                hover:bg-[#e6f9f0] 
                                ${pathname === item.href ? 'text-[#1A1A1A]' : 'text-[#4D4D4D]'}
                              `}
                              onClick={() => setOpen(false)}
                            >
                              {pathname === item.href && (
                                <p className="h-[35px] absolute left-0 rounded-tr-lg rounded-br-lg w-[6px] shadow-inner shadow-white/[0.5] border-[#04B851]/[0.1] border-r border-t border-b bg-[#04B851]"></p>
                              )}
                              <span
                                className={`text-xl ${pathname === item.href ? 'text-[#04B851]' : 'text-[#4D4D4D]'} ${section.title === 'MENU' && pathname === item.href ? 'font-bold' : ''}`}
                              >
                                {item.icon}
                              </span>
                              {item.label}
                            </a>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            <div className=" bottom-0 w-full absolute left-0  h-[220px] px-2 py-2 mt-5 flex items-center justify-center">
              <div
                className="flex w-[90%] flex-col items-center justify-between h-full rounded-3xl overflow-hidden shadow-lg border border-[#E0E0E0]"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrBYl1cBdZnCt1-V9e75Klm4Xy3s-m92VY3IXzOzB5pDKW1-jZhCvD0juPWM7dr9xeYysKaL6Vj_UP4woA8Uw2523MpdrojIzisb-b23-7fTjZmz3_gzzQFwmaDQOqqVX4HnHc=s680-w680-h510-rw')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="flex flex-col items-start w-full h-full bg-black/[0.6] rounded-3xl p-4">
                  <div className="bg-white rounded-full p-2 mb-2 w-fit">
                    <SlBadge style={{ color: '#04B851', fontSize: 20 }} />
                  </div>
                  <h1 className="text-white text-lg font-inter mb-1">
                    Powered By <br />
                    <span className="text-white/80 mb-1">Okay Bills</span>
                  </h1>
                  <p className="text-white pt-1 text-xs font-inter-regular font-light mb-4">
                    Get easy in another way
                  </p>
                  <div className="flex w-full justify-center items-end ">
                    <button className="text-white text-sm bg-gradient-to-tr from-[#04B851] to-[#039f45] shadow-white/[.4] border border-[#04B851]/10 shadow-inner py-2.5 rounded-2xl w-full">
                      Visit Us
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
