import { useCallback, useEffect, useState } from 'react'
import { MenuItem, MenuItemFormData } from '@/models/MenuItem'
import {
  addMenuItem,
  deleteMenuItem as deleteMenuItems,
  getAllMenuItems,
  getMenuItemsByCategory,
  toggleMenuItemAvailability,
  updateMenuItem,
} from '@/services/menuService'

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>(['All'])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const items = await getAllMenuItems()
      setMenuItems(items)

      // Extract unique categories
      const uniqueCategories = [
        'All',
        ...Array.from(new Set(items.map((item) => item.category))),
      ]
      setCategories(uniqueCategories)
    } catch (err) {
      setError('Failed to load menu items')
      console.error('Error loading menu items:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMenuItemsByCategory = useCallback(
    async (category: string) => {
      try {
        setLoading(true)
        setError(null)

        if (category === 'All') {
          await loadMenuItems()
          return
        }

        const items = await getMenuItemsByCategory(category)
        setMenuItems(items)
      } catch (err) {
        setError(`Failed to load ${category} menu items`)
        console.error('Error loading menu items by category:', err)
      } finally {
        setLoading(false)
      }
    },
    [], // Empty dependency array since we don't use any external variables
  )

  const addNewMenuItem = async (
    formData: MenuItemFormData,
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await addMenuItem(formData)
      await loadMenuItems() // Refresh the list
      return true
    } catch (err) {
      setError('Failed to add menu item')
      console.error('Error adding menu item:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateExistingMenuItem = async (
    id: string,
    formData: MenuItemFormData,
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await updateMenuItem(id, formData)
      await loadMenuItems() // Refresh the list
      return true
    } catch (err) {
      setError('Failed to update menu item')
      console.error('Error updating menu item:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeMenuItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await deleteMenuItems(id)
      await loadMenuItems() // Refresh the list
      return true
    } catch (err) {
      setError('Failed to delete menu item')
      console.error('Error deleting menu item:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (
    id: string,
    available: boolean,
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await toggleMenuItemAvailability(id, available)

      // Update state without refetching
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, available } : item,
        ),
      )

      return true
    } catch (err) {
      setError('Failed to update availability')
      console.error('Error updating availability:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getMenuItemById = async (id: string): Promise<MenuItem | null> => {
    try {
      console.log('Fetching menu item with ID:', id)
      const response = await fetch(`/api/menu/items/${id}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch menu item')
      }

      const data = await response.json()
      console.log('Menu item data received:', data)
      return data.menuItem
    } catch (error) {
      console.error('Error in getMenuItemById:', error)
      throw error
    }
  }

  // Load menu items on mount
  useEffect(() => {
    loadMenuItems()
  }, [])

  // Memoize the fetchMenuItems for components that need it
  const fetchMenuItems = useCallback(() => {
    return loadMenuItems()
  }, [])

  return {
    menuItems,
    loading,
    isLoading: loading, // Added alias for consistency with other hooks
    error,
    categories,
    fetchMenuItems,
    loadMenuItems,
    loadMenuItemsByCategory,
    addMenuItem: addNewMenuItem,
    updateMenuItem: updateExistingMenuItem,
    deleteMenuItem: removeMenuItem,
    toggleAvailability,
    getMenuItemById,
  }
}
