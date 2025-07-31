/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import {
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import { format, formatDistanceToNow } from 'date-fns'
import React, { useEffect, useRef, useState } from 'react'
import { BsPlusLg, BsSearch } from 'react-icons/bs'
import { CiCircleMore } from 'react-icons/ci'
import NewOrderForm from '@/components/NewOrderForm'
import { useOrder } from '@/hooks/useOrder'
import { MenuItemIngredient } from '@/models/InventoryItem'
import { OrderItem } from '@/models/OrderModel'

const { Title, Text } = Typography
const { Option } = Select

// Status colors for different order statuses (green palette)
const statusColors = {
  pending: '#F2C94C', // warning (unchanged)
  preparing: '#039f45', // primary hover (green)
  ready: '#04B851', // brand green
  completed: '#2ECC71', // success
  cancelled: '#EB5757', // error
}

function TableInfo({ tableId }: { tableId: string }) {
  const [table, setTable] = useState<any>(null)
  useEffect(() => {
    if (!tableId) return
    fetch(`/api/tables`)
      .then((res) => res.json())
      .then((data) => {
        const found = (data.tables || []).find((t: any) => t._id === tableId)
        setTable(found)
      })
      .catch(() => setTable(null))
  }, [tableId])
  if (!table) return <span>-</span>
  return (
    <span>
      Table {table.number} ({table.name})
      <Tag
        color={
          table.status === 'available'
            ? '#04B851'
            : table.status === 'occupied'
              ? '#EB5757'
              : '#F2C94C'
        }
        className="ml-2"
        style={{ borderRadius: 8, fontWeight: 500 }}
      >
        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
      </Tag>
    </span>
  )
}

export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders, updateOrderStatus } =
    useOrder()
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1) // <-- Add this line

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle successful order placement
  const handleOrderSuccess = () => {
    setShowNewOrderForm(false)
    fetchOrders() // Refresh the orders list
    message.success('Order placed successfully')
  }

  // Function to handle status update
  const handleStatusChange = async (
    orderId: string,
    newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled',
  ) => {
    try {
      await updateOrderStatus({
        id: orderId,
        status: newStatus,
      })
      message.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      message.error('Failed to update order status')
    }
  }

  // Function to get formatted time (relative or absolute)
  const getFormattedTime = (dateString: string) => {
    const date = new Date(dateString)
    // Show relative time if less than 1 day old
    if (Date.now() - date.getTime() < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    // Otherwise show absolute date
    return format(date, 'MMM dd, h:mm a')
  }

  // Filter orders based on status and search query
  const filteredOrders = orders?.filter((order) => {
    // Filter by status
    if (filter !== 'all' && order.status !== filter) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.customerName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.tableNumber &&
          order.tableNumber.toString().toLowerCase().includes(query))
      )
    }

    return true
  })

  // When orders change, if current page is out of range, reset to last page
  useEffect(() => {
    if (filteredOrders && filteredOrders.length > 0) {
      const totalPages = Math.ceil(filteredOrders.length / 10)
      if (currentPage > totalPages) {
        setCurrentPage(totalPages)
      }
    }
  }, [filteredOrders, currentPage])

  // Show order details in drawer
  const showOrderDetails = (order: any) => {
    setSelectedOrder(order)
    setDrawerVisible(true)
  }

  // Table columns definition
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text copyable={{ text: id }}>{id.substring(0, 8)}...</Text>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Table',
      dataIndex: 'tableNumber',
      key: 'tableNumber',
      render: (_: any, record: any) => {
        // Prefer tableId if available, else fallback to tableNumber
        if (record.tableId) {
          return <TableInfo tableId={record.tableId} />
        }
        return record.tableNumber || <Text type="secondary">-</Text>
      },
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_: any, record: any) => (
        <div>
          {record.paymentStatus ? (
            <Tag
              color={
                record.paymentStatus === 'paid'
                  ? 'green'
                  : record.paymentStatus === 'pending'
                    ? 'gold'
                    : record.paymentStatus === 'unpaid'
                      ? 'red'
                      : 'default'
              }
              style={{ marginBottom: 2 }}
            >
              {record.paymentStatus.charAt(0).toUpperCase() +
                record.paymentStatus.slice(1)}
            </Tag>
          ) : (
            <Tag color="default">N/A</Tag>
          )}
          <br />
          {record.paymentMethod ? (
            <Tag
              color={
                record.paymentMethod === 'online'
                  ? 'blue'
                  : record.paymentMethod === 'cash'
                    ? 'orange'
                    : 'default'
              }
            >
              {record.paymentMethod.charAt(0).toUpperCase() +
                record.paymentMethod.slice(1)}
            </Tag>
          ) : (
            <Tag color="default">-</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: OrderItem[]) =>
        `${items.length} item${items.length !== 1 ? 's' : ''}`,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text strong>₹ {amount.toFixed(2)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={statusColors[status as keyof typeof statusColors] || 'default'}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => getFormattedTime(date),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => {
        const nextStatus = (() => {
          switch (record.status) {
            case 'pending':
              return {
                key: 'preparing',
                label: 'Start Preparing',
                color: 'blue',
              }
            case 'preparing':
              return { key: 'ready', label: 'Mark Ready', color: 'green' }
            case 'ready':
              return { key: 'completed', label: 'Complete', color: 'success' }
            default:
              return null
          }
        })()

        return (
          <Space size="small">
            {nextStatus &&
              record.status !== 'completed' &&
              record.status !== 'cancelled' && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() =>
                    handleStatusChange(record.id, nextStatus.key as any)
                  }
                >
                  {nextStatus.label}
                </Button>
              )}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'pending',
                    label: 'Set as Pending',
                    disabled: record.status === 'pending',
                  },
                  {
                    key: 'preparing',
                    label: 'Start Preparing',
                    disabled: record.status === 'preparing',
                    style: { color: '#D97706' }, // amber-600
                  },
                  {
                    key: 'ready',
                    label: 'Mark as Ready',
                    disabled: record.status === 'ready',
                    style: { color: '#059669' }, // emerald-600
                  },
                  {
                    key: 'completed',
                    label: 'Complete Order',
                    disabled: record.status === 'completed',
                    style: { color: '#10B981' }, // emerald-500
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'cancelled',
                    label: 'Cancel Order',
                    disabled:
                      record.status === 'cancelled' ||
                      record.status === 'completed',
                    danger: true,
                  },
                ],
                onClick: ({ key }) => handleStatusChange(record.id, key as any),
              }}
            >
              <Button size="small" type="text">
                More <CiCircleMore />
              </Button>
            </Dropdown>
            <Button
              size="small"
              type="primary"
              ghost
              onClick={() => showOrderDetails(record)}
            >
              Details
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="w-full min-h-[85vh] flex flex-col gap-6 px-2 sm:px-4 md:px-8 py-4 md:py-8 bg-[#F9FAFB] rounded-2xl shadow-inner custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-inter-semibold text-[#04B851]">
            Orders
          </h1>
          <p className="text-[#4D4D4D] text-xs md:text-sm mt-1">
            Track, manage, and update all cafe orders in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search orders..."
            prefix={<BsSearch className="text-[#04B851]" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 border border-[#E0E0E0] rounded-xl bg-[#FFFFFF] text-[#1A1A1A]"
          />
          <Button
            type="primary"
            icon={<BsPlusLg />}
            onClick={() => setShowNewOrderForm(true)}
            className="bg-gradient-to-tr from-[#04B851] to-[#039f45] text-white font-inter-semibold border border-[#04B851] hover:bg-[#039f45] rounded-xl"
          >
            New Order
          </Button>
        </div>
      </div>

      <div className="bg-[#FFFFFF] p-4 rounded-xl shadow-sm border border-[#E0E0E0]">
        <div className="mb-4">
          <Select
            value={filter}
            onChange={(value) => setFilter(value)}
            style={{ width: 140 }}
            className="border border-[#E0E0E0] rounded-xl bg-[#F9FAFB] text-[#1A1A1A]"
            dropdownStyle={{ background: '#F9FAFB', borderRadius: 12 }}
          >
            <Option value="all">All Orders</Option>
            <Option value="pending">Pending</Option>
            <Option value="preparing">Preparing</Option>
            <Option value="ready">Ready</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
        </div>

        <div className="w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" className="text-[#04B851]" />
            </div>
          ) : error ? (
            <div className="col-span-full bg-[#e6f9f0] border border-[#EB5757] text-[#EB5757] p-4 rounded-xl">
              <p className="font-semibold">Error loading orders</p>
              <p className="text-sm mt-1">Please try refreshing the page.</p>
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredOrders}
              rowKey="id"
              pagination={{
                pageSize: 10,
                current: currentPage, // <-- Add this line
                onChange: (page) => setCurrentPage(page), // <-- Add this line
              }}
              className="custom-table min-w-[700px]"
              scroll={{ x: true }}
            />
          ) : (
            <Empty
              description={
                <span className="text-[#4D4D4D]">
                  No orders found.{' '}
                  {filter !== 'all' && 'Try changing the filter or '}
                  Create a new order to get started.
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>

      {/* Order Detail Drawer */}
      <Drawer
        title={
          <div>
            <Title level={5}>Order Details</Title>
            <Text type="secondary">ID: {selectedOrder?.id}</Text>
          </div>
        }
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={1} size="small" className="mb-4">
              <Descriptions.Item label="Table">
                {selectedOrder.tableId ? (
                  <TableInfo tableId={selectedOrder.tableId} />
                ) : (
                  selectedOrder.tableNumber || '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Order Time">
                {format(new Date(selectedOrder.createdAt), 'PPpp')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="Notes">
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">Order Items</Divider>

            {selectedOrder.items.map((item: OrderItem, index: number) => {
              // Calculate total add-ons price for this item
              const addOnsTotal =
                item.selectedAddOns && item.selectedAddOns.length > 0
                  ? item.selectedAddOns.reduce(
                      (sum: number, addon: any) =>
                        sum + addon.price * (addon.quantity || 1),
                      0,
                    )
                  : 0
              // Calculate total price for this item (base + add-ons)
              const itemTotal = item.price * item.quantity + addOnsTotal
              return (
                <Card
                  size="small"
                  className="mb-2"
                  key={index}
                  title={
                    <div className="flex flex-row justify-between items-center">
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <Text strong>₹{itemTotal.toFixed(2)}</Text>
                      <Text type="secondary">
                        {' '}
                        ₹{item.price.toFixed(2)} each
                      </Text>
                    </div>
                  }
                >
                  {item.ingredients && item.ingredients.length > 0 ? (
                    <div>
                      <Text type="secondary" className="block mb-1">
                        <span className="font-medium">Ingredients:</span>
                      </Text>
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.map(
                          (ing: MenuItemIngredient, idx: number) => (
                            <Tag key={idx} color="#039f45">
                              {ing.inventoryItemName}: {ing.quantity} {ing.unit}
                            </Tag>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary" italic>
                      No ingredient information
                    </Text>
                  )}
                  {/* Add-ons details */}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <div className="mt-2">
                      <Text type="secondary" className="block mb-1">
                        <span className="font-medium">Add-ons:</span>
                      </Text>
                      <div className="flex flex-wrap gap-1">
                        {item.selectedAddOns.map((addon: any, idx: number) => (
                          <Tag key={idx} color="#04B851">
                            {addon.name}: +₹{addon.price.toFixed(2)}
                            {addon.quantity && addon.unit && (
                              <span className="ml-1 text-[#1A1A1A]">
                                ({addon.quantity} {addon.unit})
                              </span>
                            )}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}

            <Divider />
            {/* Payment Information Section */}
            <Divider orientation="left">Payment Information</Divider>
            <Descriptions bordered column={1} size="small" className="mb-4">
              <Descriptions.Item label="Payment Status">
                {selectedOrder.paymentStatus ? (
                  <Tag
                    color={
                      selectedOrder.paymentStatus === 'paid'
                        ? '#04B851'
                        : selectedOrder.paymentStatus === 'pending'
                          ? '#F2C94C'
                          : selectedOrder.paymentStatus === 'unpaid'
                            ? '#EB5757'
                            : 'default'
                    }
                  >
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                      selectedOrder.paymentStatus.slice(1)}
                  </Tag>
                ) : (
                  <Text type="secondary">Not Available</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {selectedOrder.paymentMethod ? (
                  <Tag
                    color={
                      selectedOrder.paymentMethod === 'online'
                        ? '#039f45'
                        : selectedOrder.paymentMethod === 'cash'
                          ? '#F2C94C'
                          : 'default'
                    }
                  >
                    {selectedOrder.paymentMethod.charAt(0).toUpperCase() +
                      selectedOrder.paymentMethod.slice(1)}
                  </Tag>
                ) : (
                  <Text type="secondary">Not Available</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Amount Paid">
                {typeof selectedOrder.amountPaid === 'number' ? (
                  <Text strong>₹{selectedOrder.amountPaid.toFixed(2)}</Text>
                ) : (
                  <Text type="secondary">-</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong>₹{selectedOrder.totalAmount.toFixed(2)}</Text>
              </Descriptions.Item>
              {selectedOrder.razorpayOrderId && (
                <Descriptions.Item label="Razorpay Order ID">
                  <Text code copyable>
                    {selectedOrder.razorpayOrderId}
                  </Text>
                </Descriptions.Item>
              )}
              {selectedOrder.razorpayPaymentId && (
                <Descriptions.Item label="Razorpay Payment ID">
                  <Text code copyable>
                    {selectedOrder.razorpayPaymentId}
                  </Text>
                </Descriptions.Item>
              )}
              {selectedOrder.razorpaySignature && (
                <Descriptions.Item label="Razorpay Signature">
                  <Text code copyable>
                    {selectedOrder.razorpaySignature}
                  </Text>
                </Descriptions.Item>
              )}
              {selectedOrder.paymentTimestamp && (
                <Descriptions.Item label="Payment Time">
                  {format(new Date(selectedOrder.paymentTimestamp), 'PPpp')}
                </Descriptions.Item>
              )}
              {selectedOrder.paymentNotes && (
                <Descriptions.Item label="Payment Notes">
                  {selectedOrder.paymentNotes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="mt-4">
              <Space>
                <Button
                  type="primary"
                  style={{ background: '#04B851', borderColor: '#04B851' }}
                  disabled={selectedOrder.status === 'completed'}
                  onClick={() => {
                    handleStatusChange(
                      selectedOrder.id,
                      selectedOrder.status === 'pending'
                        ? 'preparing'
                        : selectedOrder.status === 'preparing'
                          ? 'ready'
                          : 'completed',
                    )
                  }}
                >
                  {selectedOrder.status === 'pending'
                    ? 'Start Preparing'
                    : selectedOrder.status === 'preparing'
                      ? 'Mark as Ready'
                      : selectedOrder.status === 'ready'
                        ? 'Complete Order'
                        : 'Completed'}
                </Button>
                <Button
                  danger
                  style={{
                    background: '#EB5757',
                    borderColor: '#EB5757',
                    color: '#fff',
                  }}
                  disabled={
                    selectedOrder.status === 'cancelled' ||
                    selectedOrder.status === 'completed'
                  }
                  onClick={() =>
                    handleStatusChange(selectedOrder.id, 'cancelled')
                  }
                >
                  Cancel Order
                </Button>
              </Space>
            </div>
          </>
        )}
      </Drawer>

      {/* New Order Modal */}
      <Modal
        title={<span style={{ color: '#04B851' }}>Place New Order</span>}
        open={showNewOrderForm}
        footer={null}
        onCancel={() => setShowNewOrderForm(false)}
        width={800}
        bodyStyle={{ background: '#F9FAFB' }}
      >
        <NewOrderForm
          onSuccess={handleOrderSuccess}
          onCancel={() => setShowNewOrderForm(false)}
        />
      </Modal>
    </div>
  )
}
