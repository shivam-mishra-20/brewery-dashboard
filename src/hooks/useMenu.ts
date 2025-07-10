import { useEffect, useState } from 'react'
import { MenuItem, MenuItemFormData } from '@/models/MenuItem'
import {
  addMenuItem,
  deleteMenuItem,
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

  const loadMenuItemsByCategory = async (category: string) => {
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
  }

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

      await deleteMenuItem(id)
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

  // Load menu items on mount
  useEffect(() => {
    loadMenuItems()
  }, [])

  return {
    menuItems,
    loading,
    error,
    categories,
    loadMenuItems,
    loadMenuItemsByCategory,
    addMenuItem: addNewMenuItem,
    updateMenuItem: updateExistingMenuItem,
    deleteMenuItem: removeMenuItem,
    toggleAvailability,
  }
}
