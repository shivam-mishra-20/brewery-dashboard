'use client'

import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import { BiSearch } from 'react-icons/bi'
import { GrPowerReset } from 'react-icons/gr'
import SupplierCard from '@/components/SupplierCard'
import SupplierForm from '@/components/SupplierForm'
import {
  addSupplier,
  deleteSupplier,
  getAllSuppliers,
  Supplier,
  SupplierFormData,
  updateSupplier,
} from '@/services/inventoryService'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(
    undefined,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadSuppliers = async () => {
    setIsLoading(true)
    try {
      const allSuppliers = await getAllSuppliers(false) // Get all suppliers including inactive ones
      setSuppliers(allSuppliers)
      setFilteredSuppliers(
        showInactive
          ? allSuppliers
          : allSuppliers.filter((supplier) => supplier.isActive),
      )
    } catch (error) {
      console.error('Failed to load suppliers:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false)
    }
  }

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  // Filter suppliers when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '' && showInactive) {
      setFilteredSuppliers(suppliers)
      return
    }

    const filtered = suppliers.filter((supplier) => {
      // Filter by search term
      const matchesSearch =
        searchTerm.trim() === '' ||
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by active status
      const matchesStatus = showInactive ? true : supplier.isActive

      return matchesSearch && matchesStatus
    })

    setFilteredSuppliers(filtered)
  }, [searchTerm, suppliers, showInactive])

  const handleAddSupplier = async (formData: SupplierFormData) => {
    setIsSubmitting(true)
    try {
      await addSupplier(formData)
      await loadSuppliers() // Refresh the list
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add supplier:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSupplier = async (formData: SupplierFormData) => {
    if (!editingSupplier) return

    setIsSubmitting(true)
    try {
      await updateSupplier(editingSupplier.id, formData)
      await loadSuppliers() // Refresh the list
      setEditingSupplier(undefined)
    } catch (error) {
      console.error('Failed to update supplier:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteSupplier(id)
      await loadSuppliers() // Refresh the list
    } catch (error) {
      console.error('Failed to delete supplier:', error)
      // Handle error (show toast, etc.)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-[85vh]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-inter-semibold text-[#04B851]">
          Suppliers
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-[#04B851] to-[#039f45] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-inter-semibold border border-[#04B851] hover:bg-[#039f45]"
        >
          <AiOutlinePlus /> Add Supplier
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 px-10 border border-[#E0E0E0] rounded-xl shadow-sm focus:ring-2 focus:ring-[#04B851] focus:border-transparent outline-none font-inter bg-[#FFFFFF] text-[#1A1A1A]"
          />
          <BiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#04B851]"
            size={20}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#04B851] hover:text-[#039f45]"
            >
              <GrPowerReset size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 text-[#04B851] focus:ring-[#04B851] border-[#E0E0E0] rounded mr-2 accent-[#04B851]"
          />
          <label htmlFor="showInactive" className="text-sm text-[#4D4D4D]">
            Show inactive suppliers
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#04B851]"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-xl shadow-sm p-8 text-center border border-[#E0E0E0]">
          <p className="text-[#4D4D4D] mb-4">No suppliers found</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-[#04B851] hover:text-[#039f45] underline font-inter-semibold"
          >
            Add your first supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={() => setEditingSupplier(supplier)}
              onDelete={() => handleDeleteSupplier(supplier.id)}
              isDeleting={deletingId === supplier.id}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddForm && (
          <SupplierForm
            onSubmit={handleAddSupplier}
            onCancel={() => setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        )}

        {editingSupplier && (
          <SupplierForm
            supplier={editingSupplier}
            onSubmit={handleUpdateSupplier}
            onCancel={() => setEditingSupplier(undefined)}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
