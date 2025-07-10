'use client'

import { motion } from 'framer-motion'
import React from 'react'
import {
  BsBook,
  BsChatDots,
  BsEnvelope,
  BsQuestionCircle,
  BsWhatsapp,
} from 'react-icons/bs'

const faqs = [
  {
    q: 'How do I add a new menu item?',
    a: "Go to the Menu page and click the 'Add Item' button. Fill in the details and save.",
  },
  {
    q: "How can I update an order's status?",
    a: 'Navigate to the Orders page, find the order, and use the Edit or Status buttons.',
  },
  {
    q: 'How do I change my password?',
    a: 'Visit the Settings page, go to Security, and update your password.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use the contact options below or email us at support@workbrewcafe.com.',
  },
]

export default function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#f7f7f7] rounded-2xl shadow-inner custom-scrollbar"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-black drop-shadow-sm flex items-center gap-2">
            <BsQuestionCircle className="text-yellow-500" /> Help & Support
          </h1>
          <p className="text-black text-xs md:text-sm mt-1">
            Find answers to common questions or contact our support team.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100 flex flex-col gap-4"
        >
          <h2 className="text-xl font-inter-semibold text-yellow-500 mb-2 flex items-center gap-2">
            <BsBook /> FAQs
          </h2>
          <div className="divide-y divide-yellow-100">
            {faqs.map((faq, idx) => (
              <details key={idx} className="py-3 group cursor-pointer">
                <summary className="font-semibold text-black flex items-center justify-between text-base group-open:text-yellow-600 transition">
                  {faq.q}
                  <span className="ml-2 text-yellow-400">+</span>
                </summary>
                <p className="text-gray-700 mt-2 text-sm pl-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-100 flex flex-col gap-4"
        >
          <h2 className="text-xl font-inter-semibold text-yellow-500 mb-2 flex items-center gap-2">
            <BsChatDots /> Contact Support
          </h2>
          <div className="flex flex-col gap-3">
            <a
              href="mailto:support@workbrewcafe.com"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 font-semibold shadow hover:bg-yellow-100 transition w-fit"
            >
              <BsEnvelope /> Email: support@workbrewcafe.com
            </a>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold shadow hover:bg-green-100 transition w-fit"
            >
              <BsWhatsapp /> WhatsApp: +91 99999 99999
            </a>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Our support team is available Mon-Sat, 9am-7pm. We usually respond
            within 1 hour.
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
