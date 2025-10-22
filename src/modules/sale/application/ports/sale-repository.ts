import type {
  SaleRepository as BaseSaleRepository,
  DetailedSale,
  DetailedSaleItem,
} from '@/repositories/sale-repository'

export type SaleRepository = BaseSaleRepository

export type { DetailedSale, DetailedSaleItem }
