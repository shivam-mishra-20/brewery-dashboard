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
      title={
        <span style={{ color: '#04B851', fontWeight: 600 }}>
          Manage Categories
        </span>
      }
      onCancel={onClose}
      footer={null}
      destroyOnClose
      bodyStyle={{ background: '#F9FAFB', borderRadius: 16 }}
      style={{ borderRadius: 18 }}
    >
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onPressEnter={handleAdd}
          disabled={loading}
          style={{
            borderColor: '#E0E0E0',
            background: '#FFFFFF',
            color: '#1A1A1A',
            borderRadius: 12,
          }}
        />
        <Button
          type="primary"
          onClick={handleAdd}
          loading={loading}
          style={{
            background: '#04B851',
            borderColor: '#04B851',
            color: '#fff',
            borderRadius: 12,
          }}
        >
          Add
        </Button>
      </div>
      <div>
        {categories
          .filter((cat) => cat !== 'All')
          .map((cat) => (
            <div
              key={cat}
              className="flex items-center gap-2 mb-2 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-3 py-2"
            >
              {editing === cat ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onPressEnter={() => handleEdit(cat)}
                    disabled={loading}
                    style={{
                      borderColor: '#E0E0E0',
                      background: '#e6f9f0',
                      color: '#1A1A1A',
                      borderRadius: 10,
                    }}
                  />
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleEdit(cat)}
                    loading={loading}
                    style={{
                      background: '#04B851',
                      borderColor: '#04B851',
                      color: '#fff',
                      borderRadius: 10,
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setEditing(null)}
                    disabled={loading}
                    style={{
                      borderRadius: 10,
                      color: '#4D4D4D',
                      borderColor: '#E0E0E0',
                      background: '#e6f9f0',
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[#1A1A1A]">{cat}</span>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(cat)
                      setEditValue(cat)
                    }}
                    style={{
                      borderRadius: 10,
                      color: '#04B851',
                      borderColor: '#04B851',
                      background: '#e6f9f0',
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDelete(cat)}
                    loading={loading}
                    style={{
                      borderRadius: 10,
                      color: '#EB5757',
                      borderColor: '#EB5757',
                      background: '#fff',
                    }}
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
