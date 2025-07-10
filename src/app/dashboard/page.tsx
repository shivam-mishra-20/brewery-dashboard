'use client'

import React from 'react'
import {
  BsArrowUpRightCircle,
  BsArrowUpRightCircleFill,
  BsClockHistory,
} from 'react-icons/bs'
import { CiCircleMore } from 'react-icons/ci'
import DashboardBarChart from '@/components/DashboardBarChart'
import DashboardHeader from '@/components/DashboardHeader'
import DashboardLineChart from '@/components/DashboardLineChart'

// Placeholder for line chart
// const LineChartPlaceholder = () => (
//   <div className="w-full h-full bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center text-gray-400 text-lg font-semibold border border-primary/10">
//     Line Chart (Coming Soon)
//   </div>
// )

const historyOrders = [
  { id: 1024, items: '2x Latte', status: 'Completed' },
  { id: 1023, items: '1x Espresso', status: 'Completed' },
  { id: 1022, items: '3x Croissant', status: 'Completed' },
  { id: 1021, items: '2x Cappuccino', status: 'Completed' },
  { id: 1020, items: '1x Sandwich', status: 'Completed' },
]

export default function Dashboard() {
  // Example: Replace this with your real dashboard data source
  const dashboardData = [
    {
      header: 'Total Sales',
      value: 124,
      description: 'Total sales made this month',
    },
    {
      header: 'Active Customers',
      value: 32,
      description: 'Customers active now',
    },
    {
      header: 'Pending Orders',
      value: 5,
      description: 'Orders waiting to be served',
    },
    { header: 'Revenue', value: '$2,340', description: 'Revenue this month' },
  ]

  const statsData = dashboardData.map((item) => ({
    header: item.header,
    value: item.value,
    description: item.description,
  }))
  // Removed unused statsData2
  return (
    <div className="flex-col  gap-4 h-[85vh] w-full flex justify-start items-start px-2 sm:px-4 md:px-6 lg:px-8 pb-3 md:pb-5 rounded-2xl bg-[#f7f7f7] overflow-y-auto custom-scrollbar relative">
      <div
        className="sticky top-0 left-0 z-20 w-full bg-[#f7f7f7] py-2 md:py-4"
        style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)' }}
      >
        <DashboardHeader
          title="Dashboard"
          subtitle="Plan, prioritize, and accomplish your task with ease."
        />
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 place-content-center items-center gap-2 md:gap-3">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={
              index === 0
                ? 'gap-5 bg-gradient-to-bl  from-primary to-secondary text-white p-5 rounded-2xl shadow-inner shadow-white/[.4] flex flex-col items-start justify-center border-2 border-primary/30 overflow-hidden'
                : 'gap-5 bg-white p-5 rounded-2xl  flex flex-col items-start justify-center'
            }
          >
            <p
              className={`${index === 0 ? 'text-white/90' : 'text-black'} flex items-center justify-between w-full text-md md:text-lg  `}
            >
              {stat.header}
              {index === 0 ? (
                <BsArrowUpRightCircleFill className="text-3xl" />
              ) : (
                <BsArrowUpRightCircle className="text-3xl" />
              )}
            </p>
            <h2 className="lg:text-5xl text-2xl md:text-4xl font-bold">
              {stat.value}
            </h2>

            <span
              className={
                index === 0 ? 'text-sm text-white/80' : 'text-sm text-[#ffc300]'
              }
            >
              {stat.description}
            </span>
          </div>
        ))}
      </div>
      {/* Bento grid layout */}
      <div className="grid w-full pt-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Top left: Bar chart */}
        <div className="col-span-1 sm:col-span-2 bg-white p-3 sm:p-4 md:p-5 h-[300px] rounded-2xl shadow-inner flex flex-col items-start justify-center overflow-hidden md:col-start-1 md:col-span-2 md:row-span-1 lg:row-start-1">
          <DashboardBarChart />
        </div>
        {/* Top middle: History */}
        <div className="gap-2 sm:gap-3 bg-white p-3 sm:p-4 md:p-5 h-[300px] rounded-2xl flex flex-col items-start justify-between py-4 sm:py-6 w-full md:col-start-3 md:col-span-1 lg:row-start-1">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-base sm:text-lg font-inter-semibold text-black">
              History
            </h1>
            <button className="text-xs px-2 py-1 rounded-lg transition font-medium">
              <BsClockHistory className="text-2xl sm:text-3xl" />
            </button>
          </div>
          <div className="flex-1 w-full overflow-y-auto mt-2 custom-scrollbar">
            <ul className="space-y-2">
              {historyOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between text-xs sm:text-sm text-gray-700 bg-gray-50 rounded-lg px-2 sm:px-3 py-2 hover:bg-gray-100 transition"
                >
                  <span className="font-medium text-gray-800">
                    Order #{order.id}
                  </span>
                  <span className="text-gray-400">{order.items}</span>
                  <span className="text-gray-500 bg-green-50 px-2 py-0.5 rounded text-xs font-semibold">
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex w-full pt-2 px-1 sm:px-2 justify-center items-center ">
            <button className="text-white w-full flex-nowrap whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm bg-gradient-to-tr from-secondary to-primary shadow-white/[.4] border border-primary/[0.1] shadow-inner py-2 rounded-2xl px-3 sm:px-5">
              Get More <CiCircleMore className="text-xl sm:text-2xl" />
            </button>
          </div>
        </div>
        {/* Right: Pending Orders, spans all rows */}
        <div className="gap-2 sm:gap-3 bg-white p-3 sm:p-4 md:p-5 rounded-2xl flex flex-col items-start justify-between py-4 sm:py-8 h-[300px] md:h-[625px] md:col-start-4 md:row-span-2 lg:row-span-2 lg:col-start-4 lg:row-start-1">
          <div className="flex items-center justify-between w-full mb-2">
            <div>
              <p className="text-black flex items-center gap-2 w-full text-sm sm:text-md md:text-lg font-medium">
                Pending Orders
              </p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mt-1 text-black">
                5
              </h2>
              <span className="text-xs sm:text-sm text-[#ffc300]">
                Orders waiting to be served
              </span>
            </div>
            <BsArrowUpRightCircle className="text-2xl sm:text-3xl text-gray-400" />
          </div>

          {/* Order list with actions */}
          <div className="w-full flex-1 overflow-y-auto mt-3 custom-scrollbar">
            <div className="space-y-3 custom-scrollbar">
              {[
                {
                  id: 'PO-1245',
                  table: 'Table 4',
                  time: '3 min ago',
                  items: [
                    { name: 'Cappuccino', qty: 2, size: 'M' },
                    { name: 'Croissant', qty: 1, size: 'L' },
                  ],
                  status: 'Preparing',
                  customer: 'John D.',
                },
                {
                  id: 'PO-1244',
                  table: 'Table 7',
                  time: '5 min ago',
                  items: [
                    { name: 'Espresso', qty: 1, size: 'S' },
                    { name: 'Sandwich', qty: 1, size: 'L' },
                  ],
                  status: 'Ready',
                  customer: 'Maria S.',
                },
                {
                  id: 'PO-1243',
                  table: 'Table 2',
                  time: '8 min ago',
                  items: [
                    { name: 'Latte', qty: 2, size: 'L' },
                    { name: 'Brownies', qty: 3, size: 'M' },
                  ],
                  status: 'Preparing',
                  customer: 'Alex M.',
                },
                {
                  id: 'PO-1242',
                  table: 'Table 9',
                  time: '12 min ago',
                  items: [{ name: 'Americano', qty: 1, size: 'L' }],
                  status: 'Ready',
                  customer: 'Sarah P.',
                },
                {
                  id: 'PO-1241',
                  table: 'Takeaway',
                  time: '15 min ago',
                  items: [
                    { name: 'Mocha', qty: 2, size: 'M' },
                    { name: 'Cookies', qty: 4, size: 'S' },
                  ],
                  status: 'Pending',
                  customer: 'Mike T.',
                },
              ].map((order) => (
                <div
                  key={order.id}
                  className={`bg-gray-50 rounded-xl p-2 sm:p-3  ${
                    order.status === 'Ready'
                      ? 'bg-green-400/[0.1]'
                      : order.status === 'Preparing'
                        ? 'bg-yellow-400/[0.1]'
                        : 'bg-gray-400/[0.1]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {order.id}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {order.table}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {order.customer} • {order.time}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md ${
                        order.status === 'Ready'
                          ? 'bg-green-50 text-green-600'
                          : order.status === 'Preparing'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="pl-1">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center text-xs text-gray-600"
                      >
                        <span>
                          • {item.qty}x {item.name}
                        </span>
                        <span className="ml-1 text-gray-400">
                          ({item.size})
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <div className="flex gap-1">
                      <button className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 hover:bg-gray-50">
                        View
                      </button>
                      <button className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 hover:bg-gray-50">
                        Edit
                      </button>
                    </div>
                    <button
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === 'Ready'
                          ? 'bg-primary text-white'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.status === 'Ready' ? 'Serve' : 'Prepare'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full pt-3 mt-auto">
            <div className="flex justify-between mb-2">
              <button className="text-primary text-xs font-medium flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
                Add Order
              </button>
              <button className="text-gray-500 text-xs font-medium flex items-center gap-1">
                View All
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
            <button className="w-full bg-gradient-to-tr from-secondary to-primary text-white py-2 rounded-xl text-sm font-medium">
              Manage All Orders
            </button>
          </div>
        </div>
        {/* Bottom: Line chart */}
        <div className="col-span-1 sm:col-span-3 bg-white mt-3 p-3 sm:p-4 md:p-5 rounded-2xl flex flex-col items-start justify-center overflow-hidden md:row-start-2 md:col-start-1 md:col-span-3 lg:row-start-2 lg:col-start-1 lg:col-span-3 h-[300px]">
          <DashboardLineChart />
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f3f4f6;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #f3f4f6 transparent;
        }
      `}</style>
    </div>
  )
}
