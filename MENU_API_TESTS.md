# Menu API Tests

This document provides test examples for the menu API endpoints.

## Testing Add Menu Item

```javascript
// Example form data construction for adding a menu item
const formData = new FormData()
formData.append('name', 'Cappuccino')
formData.append(
  'description',
  'Rich espresso with steamed milk and velvety foam',
)
formData.append('price', '4.99')
formData.append('category', 'Coffee')
formData.append('available', 'true')

// Add image if available
// formData.append('image', fileInput.files[0]);

// Make the API request
fetch('/api/menu/add-item', {
  method: 'POST',
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error adding menu item:', error))
```

## Testing Update Menu Item

```javascript
// Example form data construction for updating a menu item
const formData = new FormData()
formData.append('id', 'existing-item-id')
formData.append('name', 'Cappuccino Grande')
formData.append(
  'description',
  'Rich espresso with extra steamed milk and velvety foam',
)
formData.append('price', '5.99')
formData.append('category', 'Coffee')
formData.append('available', 'true')

// Add new image if available
// formData.append('image', fileInput.files[0]);

// Make the API request
fetch('/api/menu/update-item', {
  method: 'POST',
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error updating menu item:', error))
```

## Testing Delete Menu Item

```javascript
const itemId = 'item-id-to-delete'

fetch(`/api/menu/delete-item?id=${itemId}`, {
  method: 'DELETE',
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error deleting menu item:', error))
```

## Testing Toggle Availability

```javascript
fetch('/api/menu/toggle-availability', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'item-id',
    available: false, // or true to make available
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error toggling availability:', error))
```

## Testing Get Menu Items

```javascript
// Get all items
fetch('/api/menu/get-items')
  .then((response) => response.json())
  .then((data) => console.log(data.items))
  .catch((error) => console.error('Error fetching menu items:', error))

// Get items by category
fetch('/api/menu/get-items?category=Coffee')
  .then((response) => response.json())
  .then((data) => console.log(data.items))
  .catch((error) =>
    console.error('Error fetching menu items by category:', error),
  )
```

## Testing Generate Description

```javascript
fetch('/api/menu/generate-description', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    itemName: 'Croissant',
    category: 'Bakery',
    additionalInfo: 'Made with French butter, flaky and buttery',
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data.description))
  .catch((error) => console.error('Error generating description:', error))
```
