# WorkBrew Cafe Menu Management System

This document provides a comprehensive overview of the menu management system for WorkBrew Cafe. The system allows cafe staff to manage menu items, including adding, editing, deleting, and toggling availability of items.

## System Architecture

The menu management system is built using:

1. **Next.js** (Frontend & API Routes)
2. **Firebase Firestore** (Database)
3. **Firebase Storage** (Image Storage)
4. **Groq API** (AI-powered menu descriptions)

## Key Features

- **Menu Item Management**: Full CRUD operations for menu items
- **Image Upload**: Upload and manage images for menu items
- **Category Management**: Filter items by category and create new categories
- **AI-Generated Descriptions**: Generate professional descriptions using Groq API
- **Responsive UI**: Works on mobile, tablet, and desktop devices

## Implementation Details

### Backend (API Routes)

- **`/api/menu/add-item`**: Add a new menu item with image upload
- **`/api/menu/update-item`**: Update an existing menu item with image handling
- **`/api/menu/delete-item`**: Delete a menu item and its associated image
- **`/api/menu/toggle-availability`**: Toggle the availability of a menu item
- **`/api/menu/get-items`**: Get all menu items or filter by category
- **`/api/menu/generate-description`**: Generate AI descriptions using Groq

### Frontend Components

- **MenuPage**: Main page for managing menu items
- **MenuItemCard**: Card component for displaying menu items
- **MenuItemForm**: Form for adding and editing menu items
- **ConfirmationDialog**: Dialog for confirming delete actions

### Services & Hooks

- **menuService**: Service for interacting with the menu API
- **aiService**: Service for generating AI descriptions
- **useMenu**: Custom hook for menu operations

## Data Model

```typescript
interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  imageURL?: string
  available: boolean
  createdAt?: string
  updatedAt?: string
}
```

## Firebase Integration

The system uses:

- **Firestore** for storing menu item data
- **Firebase Storage** for storing images with unique IDs
- **Security Rules** to ensure only authenticated users can modify data

## Image Processing

Images are handled through a multi-step process:

1. User selects an image in the form
2. The image is previewed in the UI
3. On form submit, the image is sent to the API using FormData
4. The API uploads the image to Firebase Storage with a unique name
5. The image URL is saved with the menu item in Firestore
6. When editing, old images are replaced if a new one is uploaded

## AI-Powered Descriptions

The system integrates with Groq's API to generate professional menu item descriptions:

1. User enters item name and category
2. Optional additional info can be provided
3. On clicking "AI Generate", a request is sent to the API
4. The API calls Groq's API with a carefully crafted prompt
5. The generated description is returned and added to the form

## Category Management

Categories are dynamic and flexible:

1. Default categories are provided (Coffee, Tea, Bakery, etc.)
2. Users can create new categories by typing in the category field
3. Items can be filtered by category on the menu page
4. Categories are stored with each menu item

## Usage Instructions

1. To **add** a new menu item, click the "Add Item" button
2. To **edit** an item, click the edit icon on any menu item card
3. To **delete** an item, click the delete icon and confirm
4. To **toggle availability**, click the toggle switch on any item
5. To **filter** by category, click on any category button
6. To **search** items, use the search box at the top of the page

## Security Considerations

- API routes should include proper authentication in production
- Firebase rules should be configured to restrict access
- Image uploads should be limited in size and type

## Future Enhancements

- Add user authentication and role-based access
- Implement bulk operations (delete, toggle availability)
- Add image optimization for faster loading
- Create analytics for menu item popularity
- Implement menu item variants and options
