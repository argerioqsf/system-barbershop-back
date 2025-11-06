export interface CollaboratorTransactionUserProfile {
  id: string
  name: string | null
}

export interface CollaboratorTransactionUser {
  id: string
  name: string | null
  profile?: CollaboratorTransactionUserProfile | null
}

export interface CollaboratorTransactionDiscount {
  id: string
  amount: number
  type: string
  origin: string | null
  order: number | null
}

export interface CollaboratorTransactionSaleItem {
  id: string
  price: number | null
  customPrice?: number | null
  service?: {
    id: string
    name: string | null
  } | null
  product?: {
    id: string
    name: string | null
  } | null
  barber?: {
    id: string
    profile?: CollaboratorTransactionUserProfile | null
  } | null
  discounts: CollaboratorTransactionDiscount[]
}

export interface CollaboratorTransactionSale {
  id: string
  coupon?: {
    id: string
    code: string | null
  } | null
  items: CollaboratorTransactionSaleItem[]
  user?: CollaboratorTransactionUser | null
}

export interface CollaboratorTransaction {
  id: string
  amount: number
  reason: string
  description?: string | null
  createdAt: Date
  saleId?: string | null
  saleItemId?: string | null
  sale?: CollaboratorTransactionSale | null
  user?: CollaboratorTransactionUser | null
  affectedUser?: CollaboratorTransactionUser | null
}

export interface CollaboratorTransactionsRepository {
  findManyByCollaborator(
    collaboratorId: string,
  ): Promise<CollaboratorTransaction[]>
}
