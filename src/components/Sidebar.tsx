'use client'

import {
  BarChartOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react'
import { BiHelpCircle } from 'react-icons/bi'
import { SlBadge } from 'react-icons/sl'

const menuSections = [
  {
    title: 'MENU',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <DashboardOutlined /> },
      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: <ShoppingCartOutlined />,
      },
      { label: 'Menu', href: '/dashboard/menu', icon: <CoffeeOutlined /> },
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: <BarChartOutlined />,
      },
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
      { label: 'Logout', href: '/dashboard/logout', icon: <LogoutOutlined /> },
    ],
  },
]

const Sidebar: React.FC = () => {
  const pathname = usePathname()
  return (
    <aside className="h-[95vh] relative mt-5 rounded-2xl w-64 mx-5 bg-[#f7f7f7] borderborder-gray-600/[0.1] flex flex-col p-4">
      <div className="flex flex-col items-center justify-center w-full mb-8">
        <div className="flex items-center justify-start gap-3 w-full">
          <Image
            src="/workbrewLogo.jpg"
            alt="logo"
            className="rounded-xl border border-black/[0.5] bg-primary p-1"
            unoptimized
            height={50}
            width={50}
          />
          <h2 className="text-xl tracking-tighter font-inter-semibold pt-1">
            Work Brew
          </h2>
        </div>
      </div>
      {menuSections.map((section) => (
        <nav
          key={section.title}
          className={`flex flex-col ${section.title === 'GENERAL' ? 'pt-10' : 'pt-7'} gap-2`}
        >
          <h1 className="text-sm font-inter text-gray-500">{section.title}</h1>
          {section.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center tracking-tight gap-3 px-3 py-2 rounded transition-colors font-inter-semibold
                hover:bg-gray-100 
                ${pathname === item.href ? 'text-black' : 'text-gray-400'}
              `}
            >
              {pathname === item.href && (
                <p className="h-[35px] absolute left-0 rounded-tr-lg rounded-br-lg w-[6px] shadow-inner shadow-white/[0.5] border-[#ffc300]/[0.1] border-r  border-t border-b bg-[#ffc300]"></p>
              )}
              <span
                className={`text-xl ${pathname === item.href ? 'text-[#ffc300]' : 'text-gray-400'} ${section.title === 'MENU' && pathname === item.href ? 'font-bold' : ''}`}
              >
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>
      ))}
      <div className="w-full h-[250px] px-5 py-5 absolute bottom-3 left-0 flex items-center justify-center">
        <div
          className="flex flex-col items-center justify-between h-full w-full rounded-3xl overflow-hidden shadow-lg"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrBYl1cBdZnCt1-V9e75Klm4Xy3s-m92VY3IXzOzB5pDKW1-jZhCvD0juPWM7dr9xeYysKaL6Vj_UP4woA8Uw2523MpdrojIzisb-b23-7fTjZmz3_gzzQFwmaDQOqqVX4HnHc=s680-w680-h510-rw')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col items-start w-full h-full bg-black/[0.6] rounded-3xl p-4">
            <div className="bg-white rounded-full p-2 mb-2 w-fit">
              <SlBadge className="text-yellow-600" style={{ fontSize: 20 }} />
            </div>
            <h1 className="text-white text-lg font-inter mb-1">
              Powered By <br />{' '}
              <span className="text-white/80 mb-1">Okay Bills</span>
            </h1>
            <p className="text-white pt-1 text-xs font-inter-regular font-light mb-4">
              Get easy in another way
            </p>
            <div className="flex w-full justify-center items-end ">
              <button className="text-white text-sm bg-primary shadow-white/[.6] border border-primary/[0.1] shadow-inner  py-2.5 rounded-full w-full">
                Visit Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
