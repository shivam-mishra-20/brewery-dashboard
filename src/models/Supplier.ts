export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierFormData {
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  notes?: string
  isActive?: boolean
}
