import { MenuItem, MenuItemFormData } from '@/models/MenuItem'
import axios from 'axios'

export const getAllMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await fetch(`/api/menu/get-items`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch menu items')
    }

    const data = await response.json()
    return data.items as MenuItem[]
  } catch (error) {
    console.error('Error fetching menu items:', error)
    throw error
  }
}

export const getMenuItemsByCategory = async (
  category: string,
): Promise<MenuItem[]> => {
  try {
    const response = await fetch(
      `/api/menu/get-items?category=${encodeURIComponent(category)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.error || 'Failed to fetch menu items by category',
      )
    }

    const data = await response.json()
    return data.items as MenuItem[]
  } catch (error) {
    console.error('Error fetching menu items by category:', error)
    throw error
  }
}

export const addMenuItem = async (
  formData: MenuItemFormData,
): Promise<string> => {
  try {
    // Create a FormData object for the API request
    const apiFormData = new FormData()

    // Append all fields to the form data
    apiFormData.append('name', formData.name)
    apiFormData.append('description', formData.description)
    apiFormData.append('price', formData.price.toString())
    apiFormData.append('category', formData.category)
    apiFormData.append('available', formData.available.toString())

    // Add ingredients if they exist
    if (formData.ingredients && formData.ingredients.length > 0) {
      apiFormData.append('ingredients', JSON.stringify(formData.ingredients))
    }

    // Add add-ons if they exist
    if (formData.addOns && formData.addOns.length > 0) {
      apiFormData.append('addOns', JSON.stringify(formData.addOns))
    }

    // Append up to 3 images as image0, image1, image2
    if (formData.images && formData.images.length > 0) {
      formData.images.slice(0, 3).forEach((file, idx) => {
        apiFormData.append(`image${idx}`, file)
      })
    }

    // Handle video upload if present
    if (formData.videoFile) {
      apiFormData.append('video', formData.videoFile)
    }

    // Make API request to add menu item
    const response = await fetch('/api/menu/add-item', {
      method: 'POST',
      body: apiFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to add menu item')
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error('Error adding menu item:', error)
    throw error
  }
}

export const updateMenuItem = async (
  id: string,
  formData: MenuItemFormData,
): Promise<void> => {
  try {
    // Create a FormData object for the API request
    const apiFormData = new FormData()

    // Append all fields to the form data
    apiFormData.append('id', id)
    apiFormData.append('name', formData.name)
    apiFormData.append('description', formData.description)
    apiFormData.append('price', formData.price.toString())
    apiFormData.append('category', formData.category)
    apiFormData.append('available', formData.available.toString())

    // Add ingredients if they exist
    if (formData.ingredients && formData.ingredients.length > 0) {
      apiFormData.append('ingredients', JSON.stringify(formData.ingredients))
    }

    // Add add-ons if they exist
    if (formData.addOns && formData.addOns.length > 0) {
      apiFormData.append('addOns', JSON.stringify(formData.addOns))
    }

    // Append existing imageURLs if available
    if (formData.imageURLs && formData.imageURLs.length > 0) {
      apiFormData.append(
        'existingImageURLs',
        JSON.stringify(formData.imageURLs),
      )
    }

    // Append up to 3 images as image0, image1, image2
    if (formData.images && formData.images.length > 0) {
      formData.images.slice(0, 3).forEach((file, idx) => {
        apiFormData.append(`image${idx}`, file)
      })
    }

    // Handle video upload if present
    if (formData.videoFile) {
      apiFormData.append('video', formData.videoFile)
    }

    // Add existing video URL if available (and no new video is uploaded)
    if (!formData.videoFile && formData.videoUrl) {
      apiFormData.append('existingVideoUrl', formData.videoUrl)
    }

    // Add existing video thumbnail URL if available
    if (formData.videoThumbnailUrl) {
      apiFormData.append(
        'existingVideoThumbnailUrl',
        formData.videoThumbnailUrl,
      )
    }

    // Make API request to update menu item
    const response = await fetch('/api/menu/update-item', {
      method: 'POST',
      body: apiFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update menu item')
    }
  } catch (error) {
    console.error('Error updating menu item:', error)
    throw error
  }
}

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    // Make API request to delete menu item
    const response = await fetch(`/api/menu/delete-item?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete menu item')
    }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    throw error
  }
}

export const toggleMenuItemAvailability = async (
  id: string,
  available: boolean,
): Promise<void> => {
  try {
    // Make API request to toggle availability
    const response = await fetch('/api/menu/toggle-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, available }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update availability')
    }
  } catch (error) {
    console.error('Error updating menu item availability:', error)
    throw error
  }
}

export const getMenuCategories = async (): Promise<string[]> => {
  const res = await axios.get('/api/categories?type=menu')
  return res.data.categories.map((cat: any) => cat.name)
}

export const addMenuCategory = async (name: string) => {
  await axios.post('/api/categories', { name, type: 'menu' })
}

export const editMenuCategory = async (oldName: string, newName: string): Promise<void> => {
  await axios.put('/api/categories', { oldName, newName, type: 'menu' })
}

export const deleteMenuCategory = async (name: string): Promise<void> => {
  await axios.delete('/api/categories', { data: { name, type: 'menu' } })
}
