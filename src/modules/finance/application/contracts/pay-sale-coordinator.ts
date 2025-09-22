import { DetailedSale } from '@/repositories/sale-repository'

export interface PaySaleInput {
  saleId: string
  userId: string
}

export interface PaySaleOutput {
  sale: DetailedSale
}

export interface PaySaleCoordinator {
  execute(input: PaySaleInput): Promise<PaySaleOutput>
}
