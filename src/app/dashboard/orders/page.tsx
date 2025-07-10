'use client'

import React from 'react'
import {
  BsCheck2Circle,
  BsClockHistory,
  BsSearch,
  BsXCircle,
} from 'react-icons/bs'
import { CiCircleMore } from 'react-icons/ci'

const orders = [
  {
    id: 'ORD-1001',
    table: 'Table 2',
    customer: 'John Doe',
    time: '2 min ago',
    status: 'Preparing',
    items: [
      { name: 'Latte', qty: 2, size: 'M' },
      { name: 'Croissant', qty: 1, size: 'L' },
    ],
    total: 320,
  },
  {
    id: 'ORD-1002',
    table: 'Table 5',
    customer: 'Maria Smith',
    time: '5 min ago',
    status: 'Ready',
    items: [
      { name: 'Espresso', qty: 1, size: 'S' },
      { name: 'Sandwich', qty: 1, size: 'L' },
    ],
    total: 210,
  },
  {
    id: 'ORD-1003',
    table: 'Takeaway',
    customer: 'Alex M.',
    time: '8 min ago',
    status: 'Completed',
    items: [
      { name: 'Mocha', qty: 2, size: 'M' },
      { name: 'Cookies', qty: 4, size: 'S' },
    ],
    total: 400,
  },
  {
    id: 'ORD-1004',
    table: 'Table 1',
    customer: 'Sarah P.',
    time: '12 min ago',
    status: 'Cancelled',
    items: [{ name: 'Americano', qty: 1, size: 'L' }],
    total: 120,
  },
]

const statusColors: Record<string, string> = {
  Preparing: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Ready: 'bg-green-100 text-green-700 border-green-300',
  Completed: 'bg-primary/20 text-primary border-primary/40',
  Cancelled: 'bg-red-100 text-red-600 border-red-300',
}

export default function OrdersPage() {
  return (
    <div className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#f7f7f7] rounded-2xl shadow-inner custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-black">
            Orders
          </h1>
          <p className="text-gray-600 text-xs md:text-sm mt-1">
            Track, manage, and update all cafe orders in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              className="w-full py-2 pl-10 pr-4 rounded-xl border border-primary/30 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-primary outline-none transition"
              placeholder="Search orders, customers, tables..."
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
              <BsSearch className="text-xl" />
            </span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-secondary to-primary text-white font-medium shadow-inner border border-primary/20 text-sm">
            <BsClockHistory className="text-lg" /> History
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 flex-1 flex flex-col gap-4 min-h-[60vh]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-inter-semibold text-gray-900">
            All Orders
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-secondary to-primary text-white font-medium shadow-inner border border-primary/20 text-sm">
            <CiCircleMore className="text-xl" /> More
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-[#f7f7f7] text-gray-700">
                <th className="px-4 py-2 text-left rounded-tl-2xl">Order ID</th>
                <th className="px-4 py-2 text-left">Table</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Items</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-b-0 hover:bg-[#fffde7] transition"
                >
                  <td className="px-4 py-3 font-semibold text-secondary">
                    {order.id}
                  </td>
                  <td className="px-4 py-3">{order.table}</td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="text-gray-800">
                            {item.qty}x {item.name}
                          </span>
                          <span className="text-gray-400">({item.size})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${statusColors[order.status]}`}
                    >
                      {order.status === 'Preparing' && (
                        <BsClockHistory className="text-yellow-500" />
                      )}
                      {order.status === 'Ready' && (
                        <BsCheck2Circle className="text-green-500" />
                      )}
                      {order.status === 'Completed' && (
                        <BsCheck2Circle className="text-primary" />
                      )}
                      {order.status === 'Cancelled' && (
                        <BsXCircle className="text-red-500" />
                      )}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    ₹{order.total}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg bg-gradient-to-tr from-secondary to-primary text-white text-xs font-semibold shadow border border-primary/20 hover:scale-105 transition">
                        View
                      </button>
                      <button className="px-3 py-1 rounded-lg bg-white border border-primary/30 text-primary text-xs font-semibold shadow hover:bg-[#fff9c4] transition">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
