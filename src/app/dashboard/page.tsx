'use client'

import { Select } from 'antd'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import {
  BsArrowUpCircleFill,
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

// const historyOrders = [
//   { id: 1024, items: '2x Latte', status: 'Completed' },
//   { id: 1023, items: '1x Espresso', status: 'Completed' },
//   { id: 1022, items: '3x Croissant', status: 'Completed' },
//   { id: 1021, items: '2x Cappuccino', status: 'Completed' },
//   { id: 1020, items: '1x Sandwich', status: 'Completed' },
// ]

export default function Dashboard() {
  const router = useRouter()
  const [viewOrderModal, setViewOrderModal] = useState(false)
  const [editOrderModal, setEditOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  function useDashboardData() {
    const [stats, setStats] = React.useState({
      totalSales: 0,
      activeCustomers: 0,
      pendingOrders: 0,
      revenue: 0,
    })
    interface PendingOrder {
      id: string
      customerName?: string
      tableNumber?: string | number
      items: { name: string; quantity: number }[]
      status: string
      createdAt?: string | number | Date
    }

    interface HistoryOrder {
      id: string
      items: string
      status: string
    }
    const [historyOrders, setHistoryOrders] = React.useState<HistoryOrder[]>([])
    const [pendingOrders, setPendingOrders] = React.useState<PendingOrder[]>([])
    const [barChartData, setBarChartData] = React.useState<
      { day: string; value: number; full: string }[]
    >([])
    const [lineChartData, setLineChartData] = React.useState<
      { month: string; sales: number }[]
    >([])

    // Refetch function
    const fetchDashboardData = React.useCallback(() => {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          const orders: Array<any> = data.orders || []
          // Stats
          setStats({
            totalSales: orders.filter((o: any) => o.status === 'completed')
              .length,
            activeCustomers: new Set(orders.map((o: any) => o.customerName))
              .size,
            pendingOrders: orders.filter((o: any) =>
              ['pending', 'preparing', 'ready'].includes(o.status),
            ).length,
            revenue: orders
              .filter((o: any) => o.status === 'completed')
              .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
          })
          // History
          setHistoryOrders(
            orders.slice(0, 5).map((o: any) => ({
              id: o.id,
              items: o.items
                .map((i: any) => `${i.quantity}x ${i.name}`)
                .join(', '),
              status: o.status,
            })),
          )
          // Pending
          setPendingOrders(
            orders
              .filter((o: any) =>
                ['pending', 'preparing', 'ready'].includes(o.status),
              )
              .slice(0, 5),
          )

          // Line chart: monthly sales trend
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ]
          const monthlySales: { [key: string]: number } = {}
          orders.forEach((order: any) => {
            if (order.status === 'completed') {
              const date = new Date(order.createdAt || order.time)
              const month = monthNames[date.getMonth()]
              monthlySales[month] =
                (monthlySales[month] || 0) + (order.totalAmount || 0)
            }
          })
          const lineData = monthNames.map((month) => ({
            month,
            sales: monthlySales[month] || 0,
          }))
          setLineChartData(lineData)

          // Bar chart: weekly sales trend
          const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
          const fullDayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ]
          const weeklySales: { [key: number]: number } = {}
          orders.forEach((order: any) => {
            if (order.status === 'completed') {
              const date = new Date(order.createdAt || order.time)
              const day = date.getDay()
              weeklySales[day] =
                (weeklySales[day] || 0) + (order.totalAmount || 0)
            }
          })
          const barData = dayNames.map((day, idx) => ({
            day,
            value: weeklySales[idx] || 0,
            full: fullDayNames[idx],
          }))
          setBarChartData(barData)
        })
    }, [])

    React.useEffect(() => {
      fetchDashboardData()
    }, [fetchDashboardData])

    return {
      stats,
      historyOrders,
      pendingOrders,
      barChartData,
      lineChartData,
      fetchDashboardData,
    }
  }
  // Example: Replace this with your real dashboard data source
  // const dashboardData = [
  //   {
  //     header: 'Total Sales',
  //     value: 124,
  //     description: 'Total sales made this month',
  //   },
  //   {
  //     header: 'Active Customers',
  //     value: 32,
  //     description: 'Customers active now',
  //   },
  //   {
  //     header: 'Pending Orders',
  //     value: 5,
  //     description: 'Orders waiting to be served',
  //   },
  //   { header: 'Revenue', value: '$2,340', description: 'Revenue this month' },
  // ]
  const {
    stats,
    historyOrders,
    pendingOrders,
    barChartData,
    lineChartData,
    fetchDashboardData,
  } = useDashboardData()

  const statsData = [
    {
      header: 'Total Sales',
      value: stats.totalSales,
      description: 'Total sales made this month',
    },
    {
      header: 'Active Customers',
      value: stats.activeCustomers,
      description: 'Customers active now',
    },
    {
      header: 'Pending Orders',
      value: stats.pendingOrders,
      description: 'Orders waiting to be served',
    },
    {
      header: 'Revenue',
      value: `₹${stats.revenue.toLocaleString()}`,
      description: 'Revenue this month',
    },
  ]
  // Removed unused statsData2
  return (
    <div className="flex-col  gap-4 h-[85vh] w-full flex justify-start items-start px-2 sm:px-4 md:px-6 lg:px-8 pb-3 md:pb-5 rounded-2xl bg-[#f7f7f7] overflow-y-auto custom-scrollbar relative">
      <div className=" z-20 w-full bg-[#f7f7f7] py-2 md:py-4">
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
                ? 'group gap-5 bg-gradient-to-bl from-primary to-secondary text-white p-5 rounded-2xl shadow-inner shadow-white/[.4] flex flex-col items-start justify-center border-2 border-primary/30 overflow-hidden min-h-[170px] transition-all duration-500'
                : 'group gap-5 bg-white p-5 rounded-2xl flex flex-col items-start justify-center min-h-[170px] transition-all duration-500'
            }
          >
            <p
              className={`${index === 0 ? 'text-white/90' : 'text-black'} flex items-center justify-between w-full text-md md:text-lg`}
            >
              {stat.header}
              <span className="relative w-10 h-8 flex items-center justify-center">
                {index === 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <BsArrowUpRightCircleFill
                      className="text-3xl transition-transform duration-500 group-hover:opacity-0 group-hover:scale-75 group-hover:rotate-12"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        margin: 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                    <BsArrowUpCircleFill
                      className="text-3xl transition-transform duration-500 opacity-0 scale-75 rotate-12 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        margin: 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </span>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <BsArrowUpRightCircle
                      className="text-3xl transition-transform duration-500 group-hover:opacity-0 group-hover:scale-75 group-hover:rotate-12"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        margin: 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                    <BsArrowUpCircleFill
                      className="text-3xl transition-transform duration-500 opacity-0 scale-75 rotate-12 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        margin: 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </span>
                )}
              </span>
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
          {barChartData && barChartData.some((d) => d.value > 0) ? (
            <DashboardBarChart data={barChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
              <BsArrowUpRightCircle className="text-5xl mb-2" />
              <span className="text-lg font-semibold">
                No sales data for this week
              </span>
            </div>
          )}
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
            {historyOrders && historyOrders.length > 0 ? (
              <ul className="space-y-2">
                {historyOrders.map((order) => {
                  let bgClass = 'bg-gray-50'
                  if (order.status.toLowerCase() === 'completed') {
                    bgClass = 'bg-green-400/[0.1]'
                  } else if (order.status.toLowerCase() === 'pending') {
                    bgClass = 'bg-yellow-400/[0.1]'
                  } else if (order.status.toLowerCase() === 'cancelled') {
                    bgClass = 'bg-red-400/[0.1]'
                  }
                  return (
                    <li
                      key={order.id}
                      className={`${bgClass} rounded-xl p-2 sm:p-3 flex flex-col`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-gray-900">
                          {order.items}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                <BsClockHistory className="text-5xl mb-2" />
                <span className="text-lg font-semibold">
                  No order history yet
                </span>
              </div>
            )}
          </div>
          <div className="flex w-full pt-2 px-1 sm:px-2 justify-center items-center ">
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="text-white w-full flex-nowrap whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm bg-gradient-to-tr from-secondary to-primary shadow-white/[.4] border border-primary/[0.1] shadow-inner py-2 rounded-2xl px-3 sm:px-5"
            >
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
                {pendingOrders.length}
              </h2>
              <span className="text-xs sm:text-sm text-[#ffc300]">
                Orders waiting to be served
              </span>
            </div>
            <BsArrowUpRightCircle className="text-2xl sm:text-3xl text-gray-400" />
          </div>

          {/* Order list with actions */}
          <div className="w-full flex-1 overflow-y-auto mt-3 custom-scrollbar">
            {pendingOrders && pendingOrders.length > 0 ? (
              <div className="space-y-3 custom-scrollbar">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-gray-50 rounded-xl p-2 sm:p-3  ${
                      order.status.toLowerCase() === 'ready'
                        ? 'bg-green-400/[0.1]'
                        : order.status.toLowerCase() === 'preparing'
                          ? 'bg-yellow-400/[0.1]'
                          : 'bg-gray-400/[0.1]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {order.items
                              .map(
                                (item: any) =>
                                  `${item.quantity} x ${item.name}`,
                              )
                              .join(', ')}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {order.tableNumber}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {order.customerName || '-'} •{' '}
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-md ${
                          order.status.toLowerCase() === 'ready'
                            ? 'bg-green-50 text-green-600'
                            : order.status.toLowerCase() === 'preparing'
                              ? 'bg-yellow-50 text-yellow-600'
                              : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>

                    <div className="pl-1">
                      {order.items.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center text-xs text-gray-600"
                        >
                          <span>
                            • {item.quantity}x {item.name}{' '}
                            {item.size && `(${item.size})`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                      <div className="flex gap-1">
                        <button
                          className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 hover:bg-gray-50"
                          onClick={() => {
                            setSelectedOrder(order)
                            setViewOrderModal(true)
                          }}
                        >
                          View
                        </button>
                        <button
                          className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 hover:bg-gray-50"
                          onClick={() => {
                            setSelectedOrder(order)
                            setEditOrderModal(true)
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      <button
                        className={`text-xs px-2 py-1 rounded ${
                          order.status.toLowerCase() === 'ready'
                            ? 'bg-primary text-white'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                        onClick={async () => {
                          // Update order status: Ready -> Completed, Pending/Preparing -> Ready
                          let nextStatus:
                            | 'pending'
                            | 'preparing'
                            | 'ready'
                            | 'completed'
                            | 'cancelled' = 'ready'
                          if (order.status.toLowerCase() === 'ready')
                            nextStatus = 'completed'
                          else if (order.status.toLowerCase() === 'preparing')
                            nextStatus = 'ready'
                          else if (order.status.toLowerCase() === 'pending')
                            nextStatus = 'preparing'
                          // Dynamically import orderService
                          const { orderService } = await import(
                            '@/services/orderService'
                          )
                          await orderService.updateOrderStatus({
                            id: order.id,
                            status: nextStatus,
                          })
                          // Refetch dashboard data to update UI immediately
                          fetchDashboardData()
                        }}
                      >
                        {order.status.toLowerCase() === 'ready'
                          ? 'Serve'
                          : order.status.toLowerCase() === 'preparing'
                            ? 'Prepared'
                            : 'Prepare'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                <BsArrowUpRightCircle className="text-5xl mb-2" />
                <span className="text-lg font-semibold">No pending orders</span>
              </div>
            )}
          </div>

          <div className="w-full pt-3 mt-auto">
            <div className="flex justify-between mb-2">
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
          {lineChartData && lineChartData.some((d) => d.sales > 0) ? (
            <DashboardLineChart data={lineChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
              <BsArrowUpRightCircle className="text-5xl mb-2" />
              <span className="text-lg font-semibold">No sales trend data</span>
            </div>
          )}
        </div>
      </div>
      {viewOrderModal && selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex custom-scrollbar items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={() => setViewOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                {/* Use an icon similar to MenuItemForm, e.g. BsX */}
                <span style={{ fontSize: 24 }}>&times;</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="mb-2">
                <b>Order ID:</b> {selectedOrder.id}
              </div>
              <div className="mb-2">
                <b>Customer:</b> {selectedOrder.customerName}
              </div>
              <div className="mb-2">
                <b>Table:</b> {selectedOrder.tableNumber || '-'}
              </div>
              <div className="mb-2">
                <b>Status:</b> {selectedOrder.status}
              </div>
              <div className="mb-2">
                <b>Items:</b>{' '}
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx}>
                    {item.quantity}x {item.name}
                  </div>
                ))}
              </div>
              <div className="mb-2">
                <b>Total:</b> ₹{selectedOrder.totalAmount}
              </div>
              <div className="mb-2">
                <b>Created At:</b>{' '}
                {selectedOrder.createdAt
                  ? new Date(selectedOrder.createdAt).toLocaleString()
                  : '-'}
              </div>
              <div className="mb-2">
                <b>Notes:</b> {selectedOrder.notes || '-'}
              </div>
              <div className="flex justify-end mt-8 space-x-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setViewOrderModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {editOrderModal && selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex custom-scrollbar items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Edit Order</h2>
              <button
                onClick={() => setEditOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <span style={{ fontSize: 24 }}>&times;</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const notes = formData.get('notes') as string
                  const { orderService } = await import(
                    '@/services/orderService'
                  )
                  await orderService.updateOrderStatus({
                    id: selectedOrder.id,
                    status: selectedOrder.status,
                    notes,
                  })
                  setEditOrderModal(false)
                  router.refresh()
                }}
              >
                <div className="mb-2">
                  <label className="block font-medium mb-1">Status</label>
                  {/* Use state to manage status value */}
                  <Select
                    defaultValue={selectedOrder.status}
                    className="w-full rounded-xl"
                    size="large"
                    style={{ borderRadius: 12 }}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'preparing', label: 'Preparing' },
                      { value: 'ready', label: 'Ready' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    value={selectedOrder.status}
                    onChange={(value) => {
                      setSelectedOrder((prev: any) => ({
                        ...prev,
                        status: value,
                      }))
                    }}
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={selectedOrder.notes || ''}
                    className="w-full border rounded-xl px-2 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end mt-8 space-x-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setEditOrderModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-medium shadow-inner shadow-white/[0.5] border border-yellow-900/[0.1] hover:scale-105 transition flex items-center gap-2"
                  >
                    Save
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
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
