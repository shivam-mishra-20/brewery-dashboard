import mongoose, { Document, Model, Schema } from 'mongoose'
import { MenuItemIngredient } from './InventoryItem'

// Interface for selected add-ons in an order
export interface SelectedAddOn {
  name: string
  price: number
  quantity: number
  unit: string
  inventoryItemId: string
}

// Interface for order items (menu items in an order)
export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  ingredients?: MenuItemIngredient[]
  selectedAddOns?: SelectedAddOn[] // Selected add-on items for this order item, with quantity, unit, inventory link
}

// Interface for order document
export interface IOrder extends Document {
  customerName: string
  tableId: string
  tableNumber?: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Schema for order items
const OrderItemSchema = new Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  ingredients: {
    type: [
      {
        inventoryItemId: { type: String, required: true },
        inventoryItemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    default: [],
  },
  selectedAddOns: {
    type: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        inventoryItemId: { type: String, required: true },
      },
    ],
    default: [],
  },
})

// Schema for orders
const OrderSchema: Schema<IOrder> = new Schema(
  {
    customerName: { type: String, required: true },
    tableId: { type: String, required: true },
    tableNumber: { type: String },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    notes: { type: String },
  },
  { timestamps: true },
)

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
