import { NextRequest, NextResponse } from 'next/server'
import { withDBRetry } from '@/lib/mongodb'
import InventoryItem from '@/models/db/InventoryItem'
import InventoryTransaction from '@/models/db/InventoryTransaction'
import { MenuItemModel } from '@/models/MenuItemModel'
import { OrderModel } from '@/models/OrderModel'

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  ingredients: Ingredient[]
  selectedAddOns?: Array<{ name: string; price: number }>
}

interface Ingredient {
  inventoryItemId: string
  inventoryItemName: string
  quantity: number
}

interface IngredientToDeduct {
  inventoryItemId: string
  quantity: number
  menuItemId: string
  menuItemName: string
  ingredientName: string
}
export async function POST(request: NextRequest) {
  try {
    const { customerName, tableId, items, notes } = await request.json()

    // Validate required fields
    if (
      !customerName ||
      !tableId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            customerName: !customerName ? 'Customer name is required' : null,
            tableId: !tableId ? 'Table ID is required' : null,
            items:
              !items || !Array.isArray(items) || items.length === 0
                ? 'At least one item is required'
                : null,
          },
        },
        { status: 400 },
      )
    }
    // Set table status to occupied
    await withDBRetry(async () => {
      await (
        await import('@/models/Table')
      ).Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        $push: {
          statusHistory: { status: 'occupied', timestamp: new Date() },
        },
      })
    })

    // Fetch menu items to get their ingredients and validate
    const menuItemIds = items.map((item) => item.menuItemId)

    const menuItems = await withDBRetry(async () => {
      return (await MenuItemModel.find({
        _id: { $in: menuItemIds },
      })) as Array<{
        _id: string
        name: string
        price: number
        ingredients?: any[]
      }>
    })

    // Check if all menu items exist
    if (menuItems.length !== menuItemIds.length) {
      const foundIds = menuItems.map((item) => (item._id as string).toString())
      const missingIds = menuItemIds.filter((id) => !foundIds.includes(id))

      return NextResponse.json(
        {
          success: false,
          error: 'Some menu items do not exist',
          details: { missingIds },
        },
        { status: 400 },
      )
    }

    // Calculate total amount and prepare the order items with ingredients
    let totalAmount = 0

    const orderItems: OrderItem[] = []
    const ingredientsToDeduct: IngredientToDeduct[] = []
    const addOnsToDeduct: IngredientToDeduct[] = []

    for (const orderItem of items) {
      const menuItem = menuItems.find(
        (mi) => mi._id.toString() === orderItem.menuItemId,
      )
      if (!menuItem) continue

      // Calculate base price
      let itemTotal = menuItem.price * orderItem.quantity

      // Calculate add-ons price if any
      let addOnTotal = 0
      if (orderItem.selectedAddOns && orderItem.selectedAddOns.length > 0) {
        addOnTotal = orderItem.selectedAddOns.reduce(
          (sum: number, addOn: { name: string; price: number }): number =>
            sum + addOn.price * orderItem.quantity,
          0,
        )
        itemTotal += addOnTotal
      }
      totalAmount += itemTotal

      // Include ingredients and selected add-ons in order item
      const itemWithIngredients: OrderItem = {
        menuItemId: orderItem.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: orderItem.quantity,
        ingredients: [],
        selectedAddOns: orderItem.selectedAddOns || [],
      }

      // If menu item has ingredients, prepare for inventory deduction
      if (menuItem.ingredients && menuItem.ingredients.length > 0) {
        itemWithIngredients.ingredients = menuItem.ingredients as Ingredient[]
        menuItem.ingredients.forEach((ingredient: Ingredient) => {
          ingredientsToDeduct.push({
            inventoryItemId: ingredient.inventoryItemId,
            quantity: ingredient.quantity * orderItem.quantity,
            menuItemId: orderItem.menuItemId,
            menuItemName: menuItem.name,
            ingredientName: ingredient.inventoryItemName,
          })
        })
      }

      // Deduct add-on quantities from inventory
      if (orderItem.selectedAddOns && orderItem.selectedAddOns.length > 0) {
        orderItem.selectedAddOns.forEach((addon: any) => {
          if (addon.inventoryItemId && addon.quantity && addon.unit) {
            addOnsToDeduct.push({
              inventoryItemId: addon.inventoryItemId,
              quantity: addon.quantity * orderItem.quantity,
              menuItemId: orderItem.menuItemId,
              menuItemName: menuItem.name,
              ingredientName: addon.name,
            })
          }
        })
      }

      orderItems.push(itemWithIngredients)
    }

    // Check if we have sufficient inventory for all ingredients and add-ons
    const allToDeduct = [...ingredientsToDeduct, ...addOnsToDeduct]
    if (allToDeduct.length > 0) {
      const inventoryCheck = await withDBRetry(async () => {
        const insufficientItems = []
        // Group by inventoryItemId
        const grouped = allToDeduct.reduce((acc: any, curr: any) => {
          if (!acc[curr.inventoryItemId]) {
            acc[curr.inventoryItemId] = {
              id: curr.inventoryItemId,
              totalQuantity: 0,
              name: curr.ingredientName,
            }
          }
          acc[curr.inventoryItemId].totalQuantity += curr.quantity
          return acc
        }, {})
        // Check inventory levels
        for (const id of Object.keys(grouped)) {
          const inventoryItem = await InventoryItem.findById(id)
          if (!inventoryItem) {
            insufficientItems.push({
              name: grouped[id].name,
              error: 'Item not found in inventory',
            })
            continue
          }
          if (inventoryItem.quantity < grouped[id].totalQuantity) {
            insufficientItems.push({
              name: inventoryItem.name,
              available: inventoryItem.quantity,
              requested: grouped[id].totalQuantity,
              unit: inventoryItem.unit,
            })
          }
        }
        return insufficientItems
      })
      if (inventoryCheck.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient inventory',
            details: inventoryCheck,
          },
          { status: 400 },
        )
      }
    }

    // Create the order
    const order = await withDBRetry(async () => {
      const newOrder = await OrderModel.create({
        customerName,
        tableId,
        items: orderItems,
        totalAmount,
        status: 'pending',
        paymentStatus: 'unpaid',
        notes,
      })

      // Now deduct inventory for ingredients and add-ons
      const allToDeduct = [...ingredientsToDeduct, ...addOnsToDeduct]
      if (allToDeduct.length > 0) {
        // Group by inventoryItemId
        const grouped = allToDeduct.reduce((acc: any, curr: any) => {
          if (!acc[curr.inventoryItemId]) {
            acc[curr.inventoryItemId] = {
              id: curr.inventoryItemId,
              totalQuantity: 0,
              menuItems: new Set<string>(),
            }
          }
          acc[curr.inventoryItemId].totalQuantity += curr.quantity
          acc[curr.inventoryItemId].menuItems.add(
            `${curr.menuItemName} (${curr.menuItemId})`,
          )
          return acc
        }, {})
        // Update inventory for each item
        for (const id of Object.keys(grouped)) {
          const inventoryItem = await InventoryItem.findById(id)
          if (!inventoryItem) continue
          const previousQuantity = inventoryItem.quantity
          const deductionAmount = grouped[id].totalQuantity
          const newQuantity = Math.max(0, previousQuantity - deductionAmount)
          // Update inventory item quantity
          inventoryItem.quantity = newQuantity
          await inventoryItem.save()
          // Create inventory transaction record
          await InventoryTransaction.create({
            inventoryItem: id,
            type: 'usage',
            quantity: deductionAmount,
            previousQuantity,
            newQuantity,
            unitCost: inventoryItem.costPerUnit,
            totalCost: deductionAmount * inventoryItem.costPerUnit,
            notes: `Used in order #${newOrder._id} for menu items: ${Array.from(grouped[id].menuItems).join(', ')}`,
            performedBy: 'System',
            orderId: newOrder._id,
          })
        }
      }

      return newOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        customerName: order.customerName,
        tableId: order.tableId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      message: 'Order placed successfully',
    })
  } catch (error) {
    console.error('Error placing order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to place order',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
