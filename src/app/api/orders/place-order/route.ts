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
    const { customerName, tableNumber, items, notes } = await request.json()

    // Validate required fields
    if (
      !customerName ||
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
            items:
              !items || !Array.isArray(items) || items.length === 0
                ? 'At least one item is required'
                : null,
          },
        },
        { status: 400 },
      )
    }

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

    for (const orderItem of items) {
      const menuItem = menuItems.find(
        (mi) => mi._id.toString() === orderItem.menuItemId,
      )

      if (!menuItem) continue

      const itemTotal = menuItem.price * orderItem.quantity
      totalAmount += itemTotal

      // Include ingredients in order item
      const itemWithIngredients: OrderItem = {
        menuItemId: orderItem.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: orderItem.quantity,
        ingredients: [],
      }

      // If menu item has ingredients, prepare for inventory deduction
      if (menuItem.ingredients && menuItem.ingredients.length > 0) {
        itemWithIngredients.ingredients = menuItem.ingredients as Ingredient[]

        // For each ingredient in the menu item, we need to deduct (ingredient quantity × order item quantity)
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

      orderItems.push(itemWithIngredients)
    }

    // Check if we have sufficient inventory for all ingredients
    if (ingredientsToDeduct.length > 0) {
      const inventoryCheck = await withDBRetry(async () => {
        const insufficientItems = []

        // Group ingredients by ID to get total quantity needed
        const groupedIngredients = ingredientsToDeduct.reduce(
          (
            acc: {
              [key: string]: { id: string; totalQuantity: number; name: string }
            },
            curr,
          ) => {
            if (!acc[curr.inventoryItemId]) {
              acc[curr.inventoryItemId] = {
                id: curr.inventoryItemId,
                totalQuantity: 0,
                name: curr.ingredientName,
              }
            }
            acc[curr.inventoryItemId].totalQuantity += curr.quantity
            return acc
          },
          {} as {
            [key: string]: { id: string; totalQuantity: number; name: string }
          },
        )

        // Check inventory levels
        for (const id of Object.keys(groupedIngredients)) {
          const inventoryItem = await InventoryItem.findById(id)

          if (!inventoryItem) {
            insufficientItems.push({
              name: groupedIngredients[id].name,
              error: 'Item not found in inventory',
            })
            continue
          }

          if (inventoryItem.quantity < groupedIngredients[id].totalQuantity) {
            insufficientItems.push({
              name: inventoryItem.name,
              available: inventoryItem.quantity,
              requested: groupedIngredients[id].totalQuantity,
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
        tableNumber,
        items: orderItems,
        totalAmount,
        status: 'pending',
        notes,
      })

      // Now deduct inventory
      if (ingredientsToDeduct.length > 0) {
        // Group ingredients by ID to get total quantity needed
        const groupedIngredients = ingredientsToDeduct.reduce(
          (
            acc: {
              [key: string]: {
                id: string
                totalQuantity: number
                menuItems: Set<string>
              }
            },
            curr,
          ) => {
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
          },
          {} as {
            [key: string]: {
              id: string
              totalQuantity: number
              menuItems: Set<string>
            }
          },
        )

        // Update inventory for each item
        for (const id of Object.keys(groupedIngredients)) {
          const inventoryItem = await InventoryItem.findById(id)

          if (!inventoryItem) continue

          const previousQuantity = inventoryItem.quantity
          const deductionAmount = groupedIngredients[id].totalQuantity
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
            notes: `Used in order #${newOrder._id} for menu items: ${Array.from(groupedIngredients[id].menuItems).join(', ')}`,
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
        tableNumber: order.tableNumber,
        status: order.status,
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
