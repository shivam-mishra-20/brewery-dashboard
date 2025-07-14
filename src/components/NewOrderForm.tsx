import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import React, { useEffect, useState } from 'react'
import { useMenu } from '@/hooks/useMenu'
import { useOrder } from '@/hooks/useOrder'
import { MenuItem } from '@/models/MenuItem'

const { Text } = Typography
const { Option } = Select

interface NewOrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ onSuccess, onCancel }) => {
  const { menuItems, isLoading: menuLoading, fetchMenuItems } = useMenu()
  const { placeOrder, isLoading: orderLoading } = useOrder()
  const [form] = Form.useForm()

  const [selectedMenuItems, setSelectedMenuItems] = useState<
    Map<string, MenuItem>
  >(new Map())
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<any[]>([])
  const [tablesLoading, setTablesLoading] = useState(false)

  useEffect(() => {
    fetchMenuItems()
    // Fetch tables
    setTablesLoading(true)
    fetch('/api/tables')
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || [])
      })
      .catch(() => setTables([]))
      .finally(() => setTablesLoading(false))
  }, [fetchMenuItems])

  // Get available tables (status: available)
  const availableTables = tables.filter((t) => t.status === 'available')
  // Get available menu items (only show items that are available)
  const availableMenuItems = menuItems?.filter((item) => item.available) || []

  const handleMenuItemChange = (menuItemId: string) => {
    // Store selected menu item data for reference
    const menuItem = availableMenuItems.find((item) => item.id === menuItemId)
    if (menuItem) {
      setSelectedMenuItems((prev) => {
        const newMap = new Map(prev)
        newMap.set(menuItemId, menuItem)
        return newMap
      })

      // We get the current form items to find out which field triggered this
      const items = form.getFieldValue('items') || []
      const fieldIndex = items.findIndex(
        (item: any) => item.menuItemId === menuItemId,
      )

      // Initialize the selectedAddOns array for this item if it has add-ons
      if (fieldIndex !== -1) {
        const currentItems = [...items]
        if (currentItems[fieldIndex]) {
          currentItems[fieldIndex].selectedAddOns = []
          form.setFieldsValue({ items: currentItems })
          forceUpdate({})
        }
      }
    }
  }

  const handleSubmit = async (values: any) => {
    setError(null)

    try {
      // Place order
      const result = await placeOrder({
        customerName: values.customerName.trim(),
        tableId: values.tableId,
        items: values.items || [],
        notes: values.notes?.trim() || undefined,
      })

      if (result.success) {
        // Reset form
        form.resetFields()
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to place order')
      }
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred')
    }
  }

  const getMenuItemIngredients = (menuItemId: string) => {
    // First try selectedMenuItems for performance
    const menuItem =
      selectedMenuItems.get(menuItemId) ||
      availableMenuItems.find((item) => item.id === menuItemId)
    return menuItem?.ingredients || []
  }

  // Calculate order total
  const calculateOrderTotal = () => {
    const items = form.getFieldValue('items') || []
    let total = 0

    items.forEach((item: any) => {
      if (item.menuItemId && item.quantity) {
        // Always get menuItem from availableMenuItems
        const menuItem = availableMenuItems.find(
          (mi) => mi.id === item.menuItemId,
        )
        if (menuItem) {
          // Base price
          let itemTotal = menuItem.price * item.quantity

          // Add selected add-ons price (each add-on price * add-on quantity * menu item quantity)
          if (item.selectedAddOns && item.selectedAddOns.length > 0) {
            const addOnTotal = item.selectedAddOns.reduce(
              (sum: number, addOn: any) =>
                sum + (addOn.price || 0) * (addOn.quantity || 1),
              0,
            )
            itemTotal += addOnTotal * item.quantity
          }

          total += itemTotal
        }
      }
    })

    return total.toFixed(2)
  }

  // Update total when form changes
  const [, forceUpdate] = useState({})

  // Use onValuesChange to force update on any form value change
  const handleFormValuesChange = () => {
    forceUpdate({})

    // Re-populate selectedMenuItems for any menu items in the form that aren't in the map
    const items = form.getFieldValue('items') || []
    items.forEach((item: any) => {
      if (item && item.menuItemId && !selectedMenuItems.has(item.menuItemId)) {
        const menuItem = availableMenuItems.find(
          (mi) => mi.id === item.menuItemId,
        )
        if (menuItem) {
          setSelectedMenuItems((prev) => {
            const newMap = new Map(prev)
            newMap.set(item.menuItemId, menuItem)
            return newMap
          })
        }
      }
    })
  }

  return (
    <Spin spinning={menuLoading || tablesLoading}>
      <div className="p-4">
        {error && (
          <Alert message={error} type="error" showIcon className="mb-4" />
        )}

        {/* Debug view - uncomment to debug form values */}
        {/* <div className="bg-gray-50 p-2 mb-4 rounded text-xs overflow-auto max-h-20">
          <pre>{JSON.stringify(form.getFieldsValue(true), null, 2)}</pre>
        </div> */}

        {availableMenuItems.length === 0 ? (
          <Empty
            description="No menu items available. Add some menu items first."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ items: [{ menuItemId: undefined, quantity: 1 }] }}
            onValuesChange={handleFormValuesChange}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[
                  { required: true, message: 'Please enter customer name' },
                ]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>

              <Form.Item
                name="tableId"
                label="Table"
                rules={[{ required: true, message: 'Please select a table' }]}
              >
                <Select
                  placeholder={
                    availableTables.length === 0
                      ? 'No available tables'
                      : 'Select a table'
                  }
                  disabled={availableTables.length === 0}
                  showSearch
                  optionLabelProp="label"
                >
                  {availableTables.map((table) => (
                    <Option
                      key={table._id}
                      value={table._id}
                      label={`Table ${table.number} (${table.name})`}
                    >
                      <div className="flex justify-between">
                        <span>{`Table ${table.number} (${table.name})`}</span>
                        <Text type="secondary">Capacity: {table.capacity}</Text>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Divider orientation="left">Order Items</Divider>

            <Form.List name="items">
              {(fields: any, { add, remove }: { add: any; remove: any }) => (
                <>
                  {fields.map((field: any) => (
                    <Card
                      size="small"
                      key={field.key}
                      className="mb-4"
                      bodyStyle={{ padding: '16px' }}
                      extra={
                        fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        )
                      }
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 w-full">
                          <Form.Item
                            {...field}
                            name={[field.name, 'menuItemId']}
                            label="Menu Item"
                            rules={[
                              {
                                required: true,
                                message: 'Please select a menu item',
                              },
                            ]}
                            className="mb-2"
                          >
                            <Select
                              placeholder="Select a menu item"
                              onChange={(value: any) =>
                                handleMenuItemChange(value)
                              }
                              showSearch
                              filterOption={(input: any, option: any) =>
                                (option?.label as string)
                                  ?.toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              optionLabelProp="label"
                            >
                              {availableMenuItems.map((item) => (
                                <Option
                                  key={item.id}
                                  value={item.id}
                                  label={item.name}
                                >
                                  <div className="flex justify-between">
                                    <span>{item.name}</span>
                                    <Text type="secondary">
                                      ${Number(item.price).toFixed(2)}
                                    </Text>
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>{' '}
                          {/* Show ingredients for selected item */}
                          {form.getFieldValue([
                            'items',
                            field.name,
                            'menuItemId',
                          ]) && (
                            <div className="mb-3">
                              <Text type="secondary" className="text-xs">
                                Ingredients:
                              </Text>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {getMenuItemIngredients(
                                  form.getFieldValue([
                                    'items',
                                    field.name,
                                    'menuItemId',
                                  ]),
                                ).map((ing: any, idx: number) => (
                                  <Tag
                                    key={idx}
                                    color="blue"
                                    className="text-xs"
                                  >
                                    {ing.inventoryItemName}: {ing.quantity}{' '}
                                    {ing.unit}
                                  </Tag>
                                ))}
                                {getMenuItemIngredients(
                                  form.getFieldValue([
                                    'items',
                                    field.name,
                                    'menuItemId',
                                  ]),
                                ).length === 0 && (
                                  <Text type="secondary" className="text-xs">
                                    No ingredients listed
                                  </Text>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Show available add-ons for the selected item */}
                          {form.getFieldValue([
                            'items',
                            field.name,
                            'menuItemId',
                          ]) && (
                            <div className="mb-3">
                              {(() => {
                                const menuItemId = form.getFieldValue([
                                  'items',
                                  field.name,
                                  'menuItemId',
                                ])
                                // Try selectedMenuItems first, then availableMenuItems
                                const menuItem =
                                  selectedMenuItems.get(menuItemId) ||
                                  availableMenuItems.find(
                                    (item) => item.id === menuItemId,
                                  )
                                const addOns = menuItem?.addOns || []

                                if (addOns.length === 0) return null

                                return (
                                  <>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-sm font-medium text-gray-700">
                                        Add-ons:
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        (click to select)
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {addOns.map((addon: any, idx: number) => {
                                        // Check if this add-on is selected
                                        const currentItems =
                                          form.getFieldValue('items') || []
                                        const currentItem =
                                          currentItems[field.name] || {}
                                        const selectedAddOns =
                                          currentItem.selectedAddOns || []
                                        const isSelected = selectedAddOns.some(
                                          (selected: any) =>
                                            selected.name === addon.name,
                                        )
                                        // Find selected add-on object
                                        const selectedAddOnObj =
                                          selectedAddOns.find(
                                            (selected: any) =>
                                              selected.name === addon.name,
                                          )

                                        return (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2 mb-1"
                                          >
                                            <Tag
                                              color={
                                                isSelected ? 'green' : 'default'
                                              }
                                              className={`text-xs cursor-pointer flex items-center gap-1 px-2 py-1 ${isSelected ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
                                              onClick={() => {
                                                const items =
                                                  form.getFieldValue('items') ||
                                                  []
                                                const item =
                                                  items[field.name] || {}
                                                let selectedAddOns =
                                                  item.selectedAddOns || []
                                                if (isSelected) {
                                                  selectedAddOns =
                                                    selectedAddOns.filter(
                                                      (selected: any) =>
                                                        selected.name !==
                                                        addon.name,
                                                    )
                                                } else {
                                                  selectedAddOns = [
                                                    ...selectedAddOns,
                                                    {
                                                      name: addon.name,
                                                      price: addon.price,
                                                      quantity: addon.quantity,
                                                      unit: addon.unit,
                                                      inventoryItemId:
                                                        addon.inventoryItemId,
                                                    },
                                                  ]
                                                }
                                                items[field.name] = {
                                                  ...item,
                                                  selectedAddOns,
                                                }
                                                form.setFieldsValue({ items })
                                                forceUpdate({})
                                              }}
                                            >
                                              <span
                                                className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-600 text-white' : 'border-gray-300'}`}
                                              >
                                                {isSelected && '✓'}
                                              </span>
                                              <span>
                                                {addon.name}: +₹
                                                {addon.price.toFixed(2)}
                                                <span className="ml-1 text-gray-500">
                                                  ({addon.quantity} {addon.unit}
                                                  )
                                                </span>
                                              </span>
                                            </Tag>
                                            {/* If selected, show quantity input for this add-on */}
                                            {isSelected && (
                                              <>
                                                <InputNumber
                                                  min={1}
                                                  value={
                                                    selectedAddOnObj?.quantity ||
                                                    addon.quantity
                                                  }
                                                  onChange={(val) => {
                                                    const items =
                                                      form.getFieldValue(
                                                        'items',
                                                      ) || []
                                                    const item =
                                                      items[field.name] || {}
                                                    let selectedAddOns =
                                                      item.selectedAddOns || []
                                                    selectedAddOns =
                                                      selectedAddOns.map(
                                                        (selected: any) =>
                                                          selected.name ===
                                                          addon.name
                                                            ? {
                                                                ...selected,
                                                                quantity: val,
                                                              }
                                                            : selected,
                                                      )
                                                    items[field.name] = {
                                                      ...item,
                                                      selectedAddOns,
                                                    }
                                                    // Use setTimeout to ensure the state update completes
                                                    setTimeout(() => {
                                                      form.setFieldsValue({
                                                        items,
                                                      })
                                                      forceUpdate({})
                                                    }, 0)
                                                  }}
                                                  size="small"
                                                  className="w-16 ml-2"
                                                />
                                                <span className="ml-1 text-xs text-gray-500">
                                                  {addon.unit}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </div>

                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="Quantity"
                          rules={[
                            {
                              required: true,
                              message: 'Please enter quantity',
                            },
                          ]}
                          className="mb-0 w-24"
                        >
                          <InputNumber
                            min={1}
                            className="w-full"
                            onChange={(value) => {
                              // Directly update the form field
                              const items = form.getFieldValue('items') || []
                              if (items[field.name]) {
                                items[field.name].quantity = value
                                form.setFieldsValue({ items })
                                // Force re-render to update total
                                forceUpdate({})
                              }
                            }}
                          />
                        </Form.Item>
                      </div>
                    </Card>
                  ))}

                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({ menuItemId: undefined, quantity: 1 })
                      }
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Another Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea
                placeholder="Special instructions or notes for this order"
                rows={3}
              />
            </Form.Item>

            <Divider />

            <div className="flex justify-between items-center mb-4">
              <div>
                <Text className="text-base font-medium">Total:</Text>
                <Text
                  className="text-lg font-bold ml-2 inline-block min-w-[5rem] text-right"
                  type="danger"
                >
                  ${calculateOrderTotal()}
                </Text>
              </div>
              <div className="text-right">
                <Text type="secondary">
                  {(form.getFieldValue('items') || []).length} item
                  {(form.getFieldValue('items') || []).length !== 1 ? 's' : ''}
                </Text>
              </div>
            </div>

            <Form.Item className="mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={orderLoading}
                  className="bg-gradient-to-tr from-primary to-secondary"
                >
                  Place Order
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </div>
    </Spin>
  )
}

export default NewOrderForm
