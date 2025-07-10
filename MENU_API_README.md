# Menu Management System

This system allows for complete management of a café's menu items including adding, editing, deleting, and toggling the availability of items. The system uses Firebase Firestore for data storage and Firebase Storage for image uploads.

## Features

- Complete CRUD operations for menu items
- Image upload to Firebase Storage
- Category management with custom category creation
- AI-powered menu item description generation using Groq API
- Responsive design with Ant Design components
- Real-time updates for availability toggling

## API Endpoints

### 1. Add Menu Item

**Endpoint:** `POST /api/menu/add-item`  
**Content-Type:** `multipart/form-data`  
**Description:** Creates a new menu item with image upload support.

**Request Parameters:**

- `name` (string) - Name of the menu item
- `description` (string) - Description of the menu item
- `price` (number) - Price of the menu item
- `category` (string) - Category of the menu item
- `available` (boolean) - Whether the item is available
- `image` (File, optional) - Image file for the menu item

**Response:**

```json
{
  "success": true,
  "id": "item-id",
  "message": "Menu item created successfully"
}
```

### 2. Update Menu Item

**Endpoint:** `POST /api/menu/update-item`  
**Content-Type:** `multipart/form-data`  
**Description:** Updates an existing menu item with image upload support.

**Request Parameters:**

- `id` (string) - ID of the menu item to update
- `name` (string) - Name of the menu item
- `description` (string) - Description of the menu item
- `price` (number) - Price of the menu item
- `category` (string) - Category of the menu item
- `available` (boolean) - Whether the item is available
- `image` (File, optional) - New image file for the menu item

**Response:**

```json
{
  "success": true,
  "id": "item-id",
  "message": "Menu item updated successfully"
}
```

### 3. Delete Menu Item

**Endpoint:** `DELETE /api/menu/delete-item?id=<item-id>`  
**Description:** Deletes a menu item and its associated image.

**Request Parameters:**

- `id` (string, query parameter) - ID of the menu item to delete

**Response:**

```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

### 4. Toggle Item Availability

**Endpoint:** `POST /api/menu/toggle-availability`  
**Content-Type:** `application/json`  
**Description:** Toggles the availability status of a menu item.

**Request Body:**

```json
{
  "id": "item-id",
  "available": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Availability updated successfully"
}
```

### 5. Get Menu Items

**Endpoint:** `GET /api/menu/get-items`  
**Description:** Retrieves all menu items or filters by category.

**Query Parameters:**

- `category` (string, optional) - Filter items by category

**Response:**

```json
{
  "items": [
    {
      "id": "item-id",
      "name": "Item Name",
      "description": "Item Description",
      "price": 10.99,
      "category": "Category",
      "image": "image-name.jpg",
      "imageURL": "https://storage.url/image-path",
      "available": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### 6. Generate Item Description

**Endpoint:** `POST /api/menu/generate-description`  
**Content-Type:** `application/json`  
**Description:** Generates an AI description for a menu item using Groq API.

**Request Body:**

```json
{
  "itemName": "Item Name",
  "category": "Category",
  "additionalInfo": "Optional additional info"
}
```

**Response:**

```json
{
  "description": "AI-generated description for the menu item"
}
```

## Frontend Implementation

The menu management system is fully integrated with the frontend, providing a seamless user experience. The main components are:

1. **MenuPage** - Main page for listing and managing menu items
2. **MenuItemCard** - Card component for displaying menu items
3. **MenuItemForm** - Form for adding and editing menu items
4. **ConfirmationDialog** - Dialog for confirming actions like deletion
5. **useMenu** - Custom hook for menu CRUD operations

## File Upload Implementation

Image uploads are handled using the `FormData` API to send files to the server, which then uploads them to Firebase Storage. Each image is given a unique filename to prevent collisions.
