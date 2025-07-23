import { Button, Input, message, Modal } from 'antd'
import React, { useState } from 'react'

interface CategoryManagerModalProps {
  open: boolean
  categories: string[]
  onClose: () => void
  onAdd: (name: string) => Promise<void>
  onEdit: (oldName: string, newName: string) => Promise<void>
  onDelete: (name: string) => Promise<void>
}

export default function CategoryManagerModal({
  open,
  categories,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}: CategoryManagerModalProps) {
  const [newCategory, setNewCategory] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!newCategory.trim()) return
    setLoading(true)
    try {
      await onAdd(newCategory.trim())
      setNewCategory('')
      message.success('Category added')
    } catch {
      message.error('Failed to add category')
    }
    setLoading(false)
  }

  const handleEdit = async (oldName: string) => {
    if (!editValue.trim() || editValue === oldName) {
      setEditing(null)
      return
    }
    setLoading(true)
    try {
      await onEdit(oldName, editValue.trim())
      message.success('Category updated')
    } catch {
      message.error('Failed to update category')
    }
    setEditing(null)
    setLoading(false)
  }

  const handleDelete = async (name: string) => {
    setLoading(true)
    try {
      await onDelete(name)
      message.success('Category deleted')
    } catch {
      message.error('Failed to delete category')
    }
    setLoading(false)
  }

  return (
    <Modal
      open={open}
      title="Manage Categories"
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onPressEnter={handleAdd}
          disabled={loading}
        />
        <Button type="primary" onClick={handleAdd} loading={loading}>
          Add
        </Button>
      </div>
      <div>
        {categories
          .filter((cat) => cat !== 'All')
          .map((cat) => (
            <div key={cat} className="flex items-center gap-2 mb-2">
              {editing === cat ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onPressEnter={() => handleEdit(cat)}
                    disabled={loading}
                  />
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleEdit(cat)}
                    loading={loading}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setEditing(null)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{cat}</span>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(cat)
                      setEditValue(cat)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDelete(cat)}
                    loading={loading}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          ))}
      </div>
    </Modal>
  )
}
