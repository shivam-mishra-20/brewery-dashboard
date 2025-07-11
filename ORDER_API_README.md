# Order API Documentation

This document provides information about the Order API endpoints for managing customer orders in the WorkBrew Cafe system.

## Overview

The Order API allows for:

1. Placing new customer orders
2. Fetching existing orders with optional filtering
3. Updating order status

When an order is placed, the system automatically deducts inventory based on the ingredients required for each menu item in the order.

## API Endpoints

### 1. Place Order

**Endpoint:** `POST /api/orders/place-order`  
**Content-Type:** `application/json`  
**Description:** Creates a new customer order and deducts ingredients from inventory.

**Request Body:**

```json
{
  "customerName": "John Doe",
  "tableNumber": "Table 5",
  "items": [
    {
      "menuItemId": "menuitem-id-1",
      "quantity": 2
    },
    {
      "menuItemId": "menuitem-id-2",
      "quantity": 1
    }
  ],
  "notes": "No sugar in the coffee please"
}
```

**Response:**

```json
{
  "success": true,
  "order": {
    "id": "order-id",
    "customerName": "John Doe",
    "tableNumber": "Table 5",
    "status": "pending",
    "totalAmount": 29.97,
    "createdAt": "2023-06-15T14:30:00Z"
  },
  "message": "Order placed successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Insufficient inventory",
  "details": [
    {
      "name": "Coffee Beans",
      "available": 200,
      "requested": 300,
      "unit": "g"
    }
  ]
}
```

### 2. Get Orders

**Endpoint:** `GET /api/orders`  
**Description:** Retrieves orders with optional filtering by status, table number, or customer name.

**Query Parameters:**

- `status` (string, optional) - Filter by order status ('pending', 'preparing', 'ready', 'completed', 'cancelled')
- `tableNumber` (string, optional) - Filter by table number
- `customerName` (string, optional) - Filter by customer name (partial match)

**Response:**

```json
{
  "success": true,
  "orders": [
    {
      "id": "order-id-1",
      "customerName": "John Doe",
      "tableNumber": "Table 5",
      "items": [
        {
          "menuItemId": "menuitem-id-1",
          "name": "Cappuccino",
          "price": 4.99,
          "quantity": 2,
          "ingredients": [
            {
              "inventoryItemId": "inventory-id-1",
              "inventoryItemName": "Coffee Beans",
              "quantity": 20,
              "unit": "g"
            },
            {
              "inventoryItemId": "inventory-id-2",
              "inventoryItemName": "Milk",
              "quantity": 200,
              "unit": "ml"
            }
          ]
        }
      ],
      "totalAmount": 9.98,
      "status": "pending",
      "notes": "No sugar",
      "createdAt": "2023-06-15T14:30:00Z",
      "updatedAt": "2023-06-15T14:30:00Z"
    }
  ]
}
```

### 3. Update Order Status

**Endpoint:** `POST /api/orders/update-status`  
**Content-Type:** `application/json`  
**Description:** Updates the status of an existing order.

**Request Body:**

```json
{
  "id": "order-id",
  "status": "preparing",
  "notes": "Starting preparation now"
}
```

**Response:**

```json
{
  "success": true,
  "order": {
    "id": "order-id",
    "customerName": "John Doe",
    "status": "preparing",
    "updatedAt": "2023-06-15T14:35:00Z"
  },
  "message": "Order status updated successfully"
}
```

## Inventory Management

When an order is placed, the system:

1. Retrieves the complete menu item data including ingredients
2. Calculates the total quantity needed for each inventory item across all ordered items
3. Verifies that sufficient inventory is available
4. Deducts the required quantities from inventory
5. Creates inventory transaction records for tracking purposes

If there is insufficient inventory for any ingredient, the order will not be placed and an error will be returned.

## Order Status Flow

Orders follow this status progression:

1. `pending` - Initial state when order is first placed
2. `preparing` - Staff has started preparing the order
3. `ready` - Order is ready for pickup/delivery
4. `completed` - Order has been delivered to the customer
5. `cancelled` - Order was cancelled
