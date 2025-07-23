'use client'

import { message } from 'antd'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { MenuItem, MenuItemFormData } from '@/models/MenuItem'
import {
  addMenuCategory,
  deleteMenuCategory,
  editMenuCategory,
  getMenuCategories,
} from '@/services/menuService'

export type MenuContextType = {
  menuItems: MenuItem[]
  loading: boolean
  error: string | null
  categories: string[]
  selectedMenuItem: MenuItem | null // <-- Add this line
  setSelectedMenuItem: (item: MenuItem | null) => void // <-- Add this line
  loadMenuItemsByCategory: (category: string) => Promise<void>
  loadMenuItemById: (id: string) => Promise<void>
  addMenuItem: (formData: MenuItemFormData) => Promise<void>
  updateMenuItem: (id: string, formData: MenuItemFormData) => Promise<void>
  deleteMenuItem: (id: string) => Promise<void>
  toggleAvailability: (id: string, available: boolean) => Promise<void>
  addCategory: (name: string) => Promise<void>
  editCategory: (oldName: string, newName: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>
  loadCategories: () => Promise<void>
  // ...other properties
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null,
  )
  const [categories, setCategories] = useState<string[]>(['All'])

  // Load menu items by category
  const loadMenuItemsByCategory = useCallback(async (category: string) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading menu items for category:', category)

      const res = await fetch('/api/menu/get-items')

      if (!res.ok) {
        throw new Error(`Error loading menu items: ${res.status}`)
      }

      const data = await res.json()
      console.log('API response:', data) // Log entire response

      // Handle all possible response formats
      let itemsArray = []

      if (data.items && Array.isArray(data.items)) {
        console.log('Found items array in response')
        itemsArray = data.items
      } else if (data.menuItems && Array.isArray(data.menuItems)) {
        console.log('Found menuItems array in response')
        itemsArray = data.menuItems
      } else {
        throw new Error('No menu items data returned')
      }

      console.log(`Processing ${itemsArray.length} menu items`)

      // Process items with consistent ID handling
      const formattedItems = itemsArray.map((item: any) => ({
        ...item,
        id:
          item.id ||
          (item._id
            ? typeof item._id === 'string'
              ? item._id
              : item._id.toString()
            : null),
        description: item.description || '',
        available: typeof item.available === 'boolean' ? item.available : true,
        imageURLs:
          item.imageURLs && Array.isArray(item.imageURLs)
            ? item.imageURLs
            : item.imageURL
              ? [item.imageURL]
              : [],
        ingredients: item.ingredients || [],
        addOns: item.addOns || [],
      }))

      // Filter by category if needed
      const filteredItems: MenuItem[] =
        category === 'All'
          ? formattedItems
          : formattedItems.filter(
              (item: MenuItem) =>
                item.category?.toLowerCase() === category.toLowerCase(),
            )

      console.log(
        `Setting ${filteredItems.length} filtered items for category '${category}'`,
      )
      setMenuItems(filteredItems)
    } catch {
      console.error('Error loading menu items')
      setError('Failed to load menu items')
      setMenuItems([]) // Reset menu items on error
    } finally {
      setLoading(false)
    }
  }, [])

  // Load a single menu item by ID
  const loadMenuItemById = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        console.log('Loading menu item with ID:', id)

        // First try to find the item in existing menuItems
        const existingItem = menuItems.find(
          (item) => item.id === id || item._id === id,
        )

        if (existingItem) {
          console.log('Found menu item in existing items:', existingItem)
          setSelectedMenuItem(existingItem)
          setLoading(false)
          return
        }

        // Otherwise, fetch all items and find the one we need
        console.log('Item not found in existing items, fetching from API')
        const res = await fetch('/api/menu/get-items')

        if (!res.ok) {
          throw new Error(`Error loading menu items: ${res.status}`)
        }

        const data = await res.json()
        console.log('API response for menu items:', data)

        // Handle all possible response formats
        let itemsArray = []

        if (data.items && Array.isArray(data.items)) {
          itemsArray = data.items
        } else if (data.menuItems && Array.isArray(data.menuItems)) {
          itemsArray = data.menuItems
        } else {
          throw new Error('No menu items data returned')
        }

        // Find the item we're looking for
        const item = itemsArray.find(
          (item: any) =>
            item.id === id ||
            (item._id && (item._id === id || item._id.toString() === id)),
        )

        if (!item) {
          throw new Error(`Menu item with ID ${id} not found`)
        }

        // Normalize the item structure
        const formattedItem = {
          ...item,
          id:
            item.id ||
            (typeof item._id === 'string' ? item._id : item._id.toString()),
          description: item.description || '',
          available:
            typeof item.available === 'boolean' ? item.available : true,
          imageURLs:
            item.imageURLs && Array.isArray(item.imageURLs)
              ? item.imageURLs
              : item.imageURL
                ? [item.imageURL]
                : [],
          ingredients: item.ingredients || [],
          addOns: item.addOns || [],
        }

        console.log('Found and formatted menu item:', formattedItem)
        setSelectedMenuItem(formattedItem)

        // Also update the menu items array with all items
        const formattedItems = itemsArray.map((item: any) => ({
          ...item,
          id:
            item.id ||
            (typeof item._id === 'string' ? item._id : item._id.toString()),
          description: item.description || '',
          available:
            typeof item.available === 'boolean' ? item.available : true,
          imageURLs:
            item.imageURLs && Array.isArray(item.imageURLs)
              ? item.imageURLs
              : item.imageURL
                ? [item.imageURL]
                : [],
          ingredients: item.ingredients || [],
          addOns: item.addOns || [],
        }))

        setMenuItems(formattedItems)
      } catch (err) {
        console.error('Error loading menu item by ID:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load menu item',
        )
        setSelectedMenuItem(null)
      } finally {
        setLoading(false)
      }
    },
    [menuItems],
  )

  // Add a new menu item
  const addMenuItem = useCallback(
    async (formData: MenuItemFormData): Promise<void> => {
      try {
        setLoading(true)

        // For file uploads, we need to use FormData instead of JSON
        const hasImageFiles = formData.images && formData.images.length > 0
        const hasVideoFile =
          formData.videoFile !== null && formData.videoFile !== undefined

        let res
        if (hasImageFiles || hasVideoFile) {
          console.log('Using FormData for file uploads')
          // Use multipart/form-data for file uploads
          const form = new FormData()

          // Add basic fields
          form.append('name', formData.name)
          form.append('description', formData.description)
          form.append('price', formData.price.toString())
          form.append('category', formData.category)
          form.append('available', formData.available.toString())

          // Add image files
          if (formData.images) {
            formData.images.forEach((file, i) => {
              form.append(`image${i}`, file)
            })
          }

          // Add video file if exists
          if (formData.videoFile) {
            form.append('video', formData.videoFile)
          }

          // Add ingredients if exists
          if (formData.ingredients && formData.ingredients.length > 0) {
            form.append('ingredients', JSON.stringify(formData.ingredients))
          }

          // Add addOns if exists
          if (formData.addOns && formData.addOns.length > 0) {
            form.append('addOns', JSON.stringify(formData.addOns))
          }

          res = await fetch('/api/menu/add-item', {
            method: 'POST',
            body: form,
          })
        } else {
          // No files to upload, use JSON
          res = await fetch('/api/menu/add-item', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          })
        }

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || 'Failed to add menu item')
        }

        message.success('Menu item added successfully')
        loadMenuItemsByCategory('All') // Refresh items
      } catch (err) {
        console.error('Error adding menu item:', err)
        message.error(
          err instanceof Error ? err.message : 'Failed to add menu item',
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadMenuItemsByCategory],
  )

  // Update a menu item
  const updateMenuItem = useCallback(
    async (id: string, formData: MenuItemFormData): Promise<void> => {
      try {
        setLoading(true)

        // Find the existing item to make sure we have all its data
        const existingItem = menuItems.find(
          (item) => item.id === id || item._id === id,
        )

        if (!existingItem) {
          console.warn('Updating item that is not in local state:', id)
        }

        // Check if we have files to upload
        const hasImageFiles = formData.images && formData.images.length > 0
        const hasVideoFile =
          formData.videoFile !== null && formData.videoFile !== undefined

        let res
        // Define mergedData before the conditional so it's always available
        const mergedData = {
          // Keep important IDs and metadata
          id: id,
          _id: existingItem?._id ?? id, // Ensure _id is always a string
          createdAt: existingItem?.createdAt,

          // The rest comes from the form data
          ...formData,

          // Ensure price is a number
          price:
            typeof formData.price === 'string'
              ? parseFloat(formData.price)
              : formData.price,

          // Make sure we have proper defaults for important fields
          available:
            formData.available !== undefined ? formData.available : true,

          // Preserve existing image URLs in imageURLs (this is what MongoDB expects)
          imageURLs: formData.imageURLs || existingItem?.imageURLs || [],

          // Handle images array properly - schema expects [String] not objects
          images: existingItem?.images || [], // Preserve existing images array

          // Ensure ingredients are properly included
          ingredients: formData.ingredients || existingItem?.ingredients || [],

          // Ensure backward compatibility with legacy fields
          imageURL: (formData.imageURLs && formData.imageURLs[0]) || '',
        }

        if (hasImageFiles || hasVideoFile) {
          console.log('Using FormData for file uploads in update')
          // Use multipart/form-data for file uploads
          const form = new FormData()

          // Add ID field
          form.append('id', id)
          if (existingItem?._id) {
            form.append('_id', existingItem._id)
          }

          // Add basic fields
          form.append('name', formData.name)
          form.append('description', formData.description)
          form.append('price', formData.price.toString())
          form.append('category', formData.category)
          form.append('available', formData.available.toString())

          // Add existing image URLs as a JSON string
          // This is critical - these URLs will be preserved alongside any new uploads
          if (formData.imageURLs && formData.imageURLs.length > 0) {
            console.log('Preserving existing image URLs:', formData.imageURLs)
            form.append('existingImageURLs', JSON.stringify(formData.imageURLs))
          }

          // Add new image files
          if (formData.images) {
            console.log(`Adding ${formData.images.length} new image files`)
            formData.images.forEach((file, i) => {
              form.append(`image${i}`, file)
            })
          }

          // Add video file if exists or existing video URL
          if (formData.videoFile) {
            form.append('video', formData.videoFile)
          } else if (formData.videoUrl) {
            form.append('existingVideoUrl', formData.videoUrl)
            if (formData.videoThumbnailUrl) {
              form.append(
                'existingVideoThumbnailUrl',
                formData.videoThumbnailUrl,
              )
            }
          }

          // Add ingredients if exists
          if (formData.ingredients && formData.ingredients.length > 0) {
            form.append('ingredients', JSON.stringify(formData.ingredients))
          }

          // Add addOns if exists
          if (formData.addOns && formData.addOns.length > 0) {
            form.append('addOns', JSON.stringify(formData.addOns))
          }

          res = await fetch(`/api/menu/update-item?id=${id}`, {
            method: 'POST', // Use POST for multipart/form-data
            body: form,
          })
        } else {
          // No files, use JSON for update
          // Use the formData directly since we're now handling proper merging in the components

          console.log('Updating menu item with merged data:', mergedData)

          res = await fetch(`/api/menu/update-item?id=${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mergedData),
          })
        }

        // Get the response data
        const responseData = await res.json()

        if (!res.ok) {
          throw new Error(
            responseData.message ||
              responseData.error ||
              'Failed to update menu item',
          )
        }

        console.log('Update successful, response:', responseData)
        console.log('Updated image URLs:', responseData.menuItem?.imageURLs)

        message.success('Menu item updated successfully')

        // Update local state with data from the API response
        const updatedItem = responseData.menuItem || {}

        // Update local state with the merged item
        setMenuItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id || item._id === id
              ? {
                  ...item,
                  ...mergedData,
                  // Use server data for critical fields
                  imageURLs:
                    updatedItem.imageURLs ||
                    mergedData.imageURLs ||
                    item.imageURLs ||
                    [],
                  images: updatedItem.images || item.images || [],
                  // Ensure price is always a number
                  price:
                    typeof mergedData.price === 'string'
                      ? parseFloat(mergedData.price)
                      : mergedData.price,
                  // Ensure ingredients are properly preserved
                  ingredients: mergedData.ingredients || item.ingredients || [],
                  // Ensure addOns have proper number values
                  addOns:
                    mergedData.addOns?.map((addon) => ({
                      ...addon,
                      price:
                        typeof addon.price === 'string'
                          ? parseFloat(addon.price as string)
                          : addon.price,
                      quantity:
                        typeof addon.quantity === 'string'
                          ? parseFloat(addon.quantity as string)
                          : addon.quantity,
                    })) || [],
                }
              : item,
          ),
        )

        // Update selected item if it's the one being edited
        if (
          selectedMenuItem &&
          (selectedMenuItem.id === id || selectedMenuItem._id === id)
        ) {
          setSelectedMenuItem({
            ...selectedMenuItem,
            ...mergedData,
            // Use server data for critical fields
            imageURLs:
              updatedItem.imageURLs ||
              mergedData.imageURLs ||
              selectedMenuItem.imageURLs ||
              [],
            images: updatedItem.images || selectedMenuItem.images || [],
            // Ensure ingredients are properly preserved
            ingredients:
              mergedData.ingredients || selectedMenuItem.ingredients || [],
            // Make sure price is a number
            price:
              typeof mergedData.price === 'string'
                ? parseFloat(mergedData.price)
                : mergedData.price,
            // Ensure addOns have proper number values
            addOns:
              mergedData.addOns?.map((addon) => ({
                ...addon,
                price:
                  typeof addon.price === 'string'
                    ? parseFloat(addon.price as string)
                    : addon.price,
                quantity:
                  typeof addon.quantity === 'string'
                    ? parseFloat(addon.quantity as string)
                    : addon.quantity,
              })) || [],
          })
        }

        // Refresh all items to ensure consistency
        loadMenuItemsByCategory('All')
      } catch (err) {
        console.error('Error updating menu item:', err)
        message.error(
          err instanceof Error ? err.message : 'Failed to update menu item',
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadMenuItemsByCategory, menuItems, selectedMenuItem],
  )

  // Delete a menu item
  const deleteMenuItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        setLoading(true)
        const res = await fetch(`/api/menu/delete-item?id=${id}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || 'Failed to delete menu item')
        }

        message.success('Menu item deleted successfully')
        loadMenuItemsByCategory('All') // Refresh items
      } catch (err) {
        console.error('Error deleting menu item:', err)
        message.error(
          err instanceof Error ? err.message : 'Failed to delete menu item',
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    [loadMenuItemsByCategory],
  )

  // Toggle item availability
  const toggleAvailability = useCallback(
    async (id: string, available: boolean): Promise<void> => {
      try {
        setLoading(true)
        const res = await fetch('/api/menu/toggle-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, available }), // <-- send both in body
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || 'Failed to update availability')
        }

        // Update local state
        setMenuItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id || item._id === id ? { ...item, available } : item,
          ),
        )

        if (
          selectedMenuItem &&
          (selectedMenuItem.id === id || selectedMenuItem._id === id)
        ) {
          setSelectedMenuItem({ ...selectedMenuItem, available })
        }

        message.success(
          `Menu item ${available ? 'available' : 'unavailable'} now`,
        )
      } catch (err) {
        console.error('Error toggling availability:', err)
        message.error(
          err instanceof Error ? err.message : 'Failed to update availability',
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    [selectedMenuItem],
  )

  // Category management
  const loadCategories = async (): Promise<void> => {
    try {
      const categoryList = await getMenuCategories()
      setCategories(['All', ...categoryList.filter((c) => c !== 'All')])
    } catch (err) {
      setCategories(['All'])
    }
  }

  const addCategory = async (name: string) => {
    await addMenuCategory(name)
    await loadCategories()
  }

  const editCategory = async (oldName: string, newName: string) => {
    await editMenuCategory(oldName, newName)
    await loadCategories()
  }

  const removeCategory = async (name: string) => {
    await deleteMenuCategory(name)
    await loadCategories()
  }

  // Load initial data
  useEffect(() => {
    loadMenuItemsByCategory('All')
    loadCategories()
  }, [loadMenuItemsByCategory])

  const value = {
    menuItems,
    categories,
    loading,
    error,
    selectedMenuItem,
    loadMenuItemsByCategory,
    loadMenuItemById,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    setSelectedMenuItem,
    addCategory,
    editCategory,
    removeCategory,
    loadCategories,
  }

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        loading,
        error,
        categories,
        selectedMenuItem,
        loadMenuItemsByCategory,
        loadMenuItemById,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleAvailability,
        setSelectedMenuItem,
        addCategory,
        editCategory,
        removeCategory,
        loadCategories,
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}
