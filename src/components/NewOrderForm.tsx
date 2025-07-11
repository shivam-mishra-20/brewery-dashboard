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

  useEffect(() => {
    fetchMenuItems()
  }, [fetchMenuItems])

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
    }
  }

  const handleSubmit = async (values: any) => {
    setError(null)

    try {
      // Place order
      const result = await placeOrder({
        customerName: values.customerName.trim(),
        tableNumber: values.tableNumber?.trim() || undefined,
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
    const menuItem = selectedMenuItems.get(menuItemId)
    return menuItem?.ingredients || []
  }

  // Calculate order total
  const calculateOrderTotal = () => {
    const items = form.getFieldValue('items') || []
    let total = 0

    items.forEach((item: any) => {
      if (item.menuItemId && item.quantity) {
        const menuItem = selectedMenuItems.get(item.menuItemId)
        if (menuItem) {
          total += menuItem.price * item.quantity
        }
      }
    })

    return total.toFixed(2)
  }

  // Update total when form changes
  const [, forceUpdate] = useState({})
  useEffect(() => {
    // Set up form field watcher
    const { setFieldsValue } = form
    form.setFieldsValue = (fields: any) => {
      setFieldsValue(fields)
      forceUpdate({})
    }

    return () => {
      // Cleanup
    }
  }, [form])

  return (
    <Spin spinning={menuLoading}>
      <div className="p-4">
        {error && (
          <Alert message={error} type="error" showIcon className="mb-4" />
        )}

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

              <Form.Item name="tableNumber" label="Table Number">
                <Input placeholder="Optional table number" />
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
                        <div className="flex-1">
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
                          </Form.Item>

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
                          <InputNumber min={1} className="w-full" />
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
                <Text className="text-lg font-bold ml-2" type="danger">
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
