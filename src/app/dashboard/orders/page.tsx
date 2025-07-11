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
import React, { useEffect, useState } from 'react'
import { BsPlusLg, BsSearch } from 'react-icons/bs'
import { CiCircleMore } from 'react-icons/ci'
import NewOrderForm from '@/components/NewOrderForm'
import { useOrder } from '@/hooks/useOrder'
import { MenuItemIngredient } from '@/models/InventoryItem'
import { OrderItem } from '@/models/OrderModel'

const { Title, Text } = Typography
const { Option } = Select

// Status colors for different order statuses
const statusColors = {
  pending: 'gold',
  preparing: 'processing',
  ready: 'green',
  completed: 'success',
  cancelled: 'error',
}

export default function OrdersPage() {
  const { orders, isLoading, error, fetchOrders, updateOrderStatus } =
    useOrder()
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

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
        (order.tableNumber && order.tableNumber.toLowerCase().includes(query))
      )
    }

    return true
  })

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
      render: (tableNumber: string) =>
        tableNumber || <Text type="secondary">-</Text>,
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
      render: (amount: number) => <Text strong>${amount.toFixed(2)}</Text>,
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
          <Input
            placeholder="Search orders..."
            prefix={<BsSearch className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />
          <Button
            type="primary"
            icon={<BsPlusLg />}
            onClick={() => setShowNewOrderForm(true)}
            className="bg-gradient-to-tr from-primary to-secondary"
          >
            New Order
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="mb-4">
          <Select
            value={filter}
            onChange={(value) => setFilter(value)}
            style={{ width: 140 }}
          >
            <Option value="all">All Orders</Option>
            <Option value="pending">Pending</Option>
            <Option value="preparing">Preparing</Option>
            <Option value="ready">Ready</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            <p className="font-semibold">Error loading orders</p>
            <p className="text-sm mt-1">Please try refreshing the page.</p>
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className="custom-table"
          />
        ) : (
          <Empty
            description={
              <span className="text-gray-500">
                No orders found.{' '}
                {filter !== 'all' && 'Try changing the filter or '}
                Create a new order to get started.
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
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
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          selectedOrder && (
            <Tag
              color={
                statusColors[
                  selectedOrder.status as keyof typeof statusColors
                ] || 'default'
              }
            >
              {selectedOrder.status.charAt(0).toUpperCase() +
                selectedOrder.status.slice(1)}
            </Tag>
          )
        }
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Customer">
                {selectedOrder.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Table">
                {selectedOrder.tableNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Order Time">
                {format(new Date(selectedOrder.createdAt), 'PPpp')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong>${selectedOrder.totalAmount.toFixed(2)}</Text>
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="Notes">
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">Order Items</Divider>

            {selectedOrder.items.map((item: OrderItem, index: number) => (
              <Card
                size="small"
                className="mb-2"
                key={index}
                title={
                  <div className="flex justify-between items-center">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <Text strong>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </div>
                }
                extra={
                  <Text type="secondary">${item.price.toFixed(2)} each</Text>
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
                          <Tag key={idx} color="blue">
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
              </Card>
            ))}

            <Divider />

            <div className="mt-4">
              <Space>
                <Button
                  type="primary"
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
        title="Place New Order"
        open={showNewOrderForm}
        footer={null}
        onCancel={() => setShowNewOrderForm(false)}
        width={800}
      >
        <NewOrderForm
          onSuccess={handleOrderSuccess}
          onCancel={() => setShowNewOrderForm(false)}
        />
      </Modal>
    </div>
  )
}
