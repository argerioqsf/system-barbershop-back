import { DetailedSale } from '@/repositories/sale-repository'

export interface PaySaleDTO {
  saleId: string
  userId: string
}

export interface PaySaleOutput {
  sale: DetailedSale
}
