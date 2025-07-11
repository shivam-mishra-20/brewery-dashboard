import { Button, Input, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { BsPlusCircle, BsTrash } from 'react-icons/bs'
import { InventoryItem, MenuItemIngredient } from '@/models/InventoryItem'

interface IngredientsManagerProps {
  inventoryItems: InventoryItem[]
  ingredients: MenuItemIngredient[]
  onChange: (ingredients: MenuItemIngredient[]) => void
}

const IngredientsManager: React.FC<IngredientsManagerProps> = ({
  inventoryItems,
  ingredients,
  onChange,
}) => {
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Reset quantity when a different inventory item is selected
  useEffect(() => {
    setQuantity('')
    setError(null)
  }, [selectedItem])

  const handleAddIngredient = () => {
    // Validate inputs
    if (!selectedItem) {
      setError('Please select an ingredient')
      return
    }

    const numQuantity = parseFloat(quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    // Find the selected inventory item
    const inventoryItem = inventoryItems.find(
      (item) => item.id === selectedItem,
    )
    if (!inventoryItem) {
      setError('Selected item not found')
      return
    }

    // Check if the ingredient is already in the list
    if (ingredients.some((ing) => ing.inventoryItemId === selectedItem)) {
      setError('This ingredient is already added')
      return
    }

    // Add the ingredient
    const newIngredient: MenuItemIngredient = {
      inventoryItemId: inventoryItem.id,
      inventoryItemName: inventoryItem.name,
      quantity: numQuantity,
      unit: inventoryItem.unit,
    }

    onChange([...ingredients, newIngredient])

    // Reset the form
    setSelectedItem('')
    setQuantity('')
    setError(null)
  }

  const handleRemoveIngredient = (id: string) => {
    onChange(ingredients.filter((ing) => ing.inventoryItemId !== id))
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium mb-3">Ingredients</h3>

      {/* Current ingredients list */}
      <div className="mb-4">
        {ingredients.length === 0 ? (
          <p className="text-gray-500 text-sm">No ingredients added yet</p>
        ) : (
          <div className="space-y-2">
            {ingredients.map((ing) => (
              <div
                key={ing.inventoryItemId}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <div>
                  <span className="font-medium">{ing.inventoryItemName}</span>
                  <span className="text-gray-600 text-sm ml-2">
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<BsTrash />}
                  onClick={() => handleRemoveIngredient(ing.inventoryItemId)}
                  style={{ padding: 0 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new ingredient form */}
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-6">
          <label className="block text-sm text-gray-600 mb-1">
            Select Ingredient
          </label>
          <Select
            showSearch
            value={selectedItem || undefined}
            onChange={(value) => setSelectedItem(value)}
            placeholder="Select an item"
            className="w-full rounded-xl !h-10"
            size="large"
            style={{ borderRadius: 12 }}
            optionFilterProp="children"
            filterOption={(input, option) =>
              typeof option?.children === 'string' &&
              (option.children as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {inventoryItems.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {item.name} ({item.quantity} {item.unit} available)
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="col-span-4">
          <label className="block text-sm text-gray-600 mb-1">Quantity</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={0.01}
            step={0.01}
            placeholder="Quantity"
            className="w-full rounded-xl !h-10"
            size="large"
            style={{ borderRadius: 12 }}
          />
        </div>

        <div className="col-span-2">
          <Button
            type="primary"
            icon={<BsPlusCircle />}
            onClick={handleAddIngredient}
            className="w-full rounded-xl !h-10 flex items-center justify-center"
            size="large"
            style={{ background: '#FFD600', color: '#222', borderRadius: 12 }}
          >
            Add
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}

export default IngredientsManager
