'use client'

import { motion } from 'framer-motion'
import React from 'react'
import { BsBell, BsLock, BsPalette, BsPerson, BsSave } from 'react-icons/bs'

const settingsSections = [
  {
    icon: <BsPerson className="text-xl text-[#04B851]" />,
    title: 'Profile',
    description: 'Update your name, email, and profile picture.',
    content: (
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-[#1A1A1A]">Name</label>
        <input
          className="rounded-xl border border-[#E0E0E0] px-4 py-2 text-[#1A1A1A] bg-[#FFFFFF] focus:ring-2 focus:ring-[#04B851] outline-none"
          placeholder="Your Name"
        />
        <label className="text-sm font-medium text-[#1A1A1A] mt-2">Email</label>
        <input
          className="rounded-xl border border-[#E0E0E0] px-4 py-2 text-[#1A1A1A] bg-[#FFFFFF] focus:ring-2 focus:ring-[#04B851] outline-none"
          placeholder="you@email.com"
        />
        <button className="mt-4 flex max-w-[300px] justify-center items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-[#04B851] to-[#039f45] text-white font-medium shadow-inner border border-[#04B851]/[0.1] shadow-[#e6f9f0]/[0.5] text-sm hover:scale-105 transition">
          <BsSave /> Save Changes
        </button>
      </div>
    ),
  },
  {
    icon: <BsPalette className="text-xl text-[#04B851]" />,
    title: 'Appearance',
    description: 'Switch between light and dark mode.',
    content: (
      <div className="flex gap-4 mt-2">
        <button className="px-4 py-2 rounded-xl border border-[#E0E0E0] bg-[#e6f9f0] text-[#04B851] font-semibold shadow hover:bg-[#F9FAFB] transition">
          Light
        </button>
        <button className="px-4 py-2 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] text-[#1A1A1A] font-semibold shadow hover:bg-[#e6f9f0] transition">
          Dark
        </button>
      </div>
    ),
  },
  {
    icon: <BsBell className="text-xl text-[#04B851]" />,
    title: 'Notifications',
    description: 'Manage order and system notifications.',
    content: (
      <div className="flex flex-col gap-2 mt-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-[#04B851]" defaultChecked />
          Order Updates
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-[#04B851]" />
          Promotions
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-[#04B851]" defaultChecked />
          System Alerts
        </label>
      </div>
    ),
  },
  {
    icon: <BsLock className="text-xl text-[#04B851]" />,
    title: 'Security',
    description: 'Change your password and manage access.',
    content: (
      <div className="flex flex-col gap-3 mt-2">
        <label className="text-sm font-medium text-[#1A1A1A]">
          Current Password
        </label>
        <input
          type="password"
          className="rounded-xl border border-[#E0E0E0] px-4 py-2 text-[#1A1A1A] bg-[#FFFFFF] focus:ring-2 focus:ring-[#04B851] outline-none"
          placeholder="••••••••"
        />
        <label className="text-sm font-medium text-[#1A1A1A] mt-2">
          New Password
        </label>
        <input
          type="password"
          className="rounded-xl border border-[#E0E0E0] px-4 py-2 text-[#1A1A1A] bg-[#FFFFFF] focus:ring-2 focus:ring-[#04B851] outline-none"
          placeholder="••••••••"
        />
        <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-[#04B851] to-[#039f45] text-white font-medium shadow-inner border border-[#04B851]/[0.1] text-sm hover:scale-105 transition">
          <BsSave /> Update Password
        </button>
      </div>
    ),
  },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#F9FAFB] rounded-2xl shadow-inner custom-scrollbar"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-[#04B851] drop-shadow-sm">
            Settings
          </h1>
          <p className="text-[#4D4D4D] text-xs md:text-sm mt-1">
            Manage your account, appearance, notifications, and security
            settings.
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <div className="flex md:flex-col gap-2 md:w-64 w-full">
          {settingsSections.map((section, idx) => (
            <motion.button
              key={section.title}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition shadow-sm backdrop-blur-md w-full text-left ${
                activeSection === idx
                  ? 'bg-gradient-to-tr from-[#04B851] to-[#039f45] shadow-inner text-white border-[#04B851]/[0.1] shadow-[#e6f9f0]/[.5]'
                  : 'bg-[#FFFFFF] text-[#1A1A1A] border-[#E0E0E0] hover:bg-[#e6f9f0]'
              }`}
              onClick={() => setActiveSection(idx)}
            >
              {section.icon}
              <span>{section.title}</span>
            </motion.button>
          ))}
        </div>
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 bg-[#FFFFFF] rounded-2xl shadow-lg p-6 border-2 border-[#E0E0E0] min-h-[350px] flex flex-col gap-2"
        >
          <h2 className="text-xl font-inter-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
            {settingsSections[activeSection].icon}
            {settingsSections[activeSection].title}
          </h2>
          <p className="text-[#4D4D4D] text-sm mb-4">
            {settingsSections[activeSection].description}
          </p>
          {settingsSections[activeSection].content}
        </motion.div>
      </div>
    </motion.div>
  )
}
