import type {
  SaleItemRepository as BaseSaleItemRepository,
  DetailedSaleItemFindById,
  DetailedSaleItemFindMany,
  ReturnFindManyPendingCommission,
} from '@/repositories/sale-item-repository'

export type SaleItemRepository = BaseSaleItemRepository

export type {
  DetailedSaleItemFindById,
  DetailedSaleItemFindMany,
  ReturnFindManyPendingCommission,
}
