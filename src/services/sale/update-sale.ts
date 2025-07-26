import { SaleRepository, DetailedSale } from '@/repositories/sale-repository'
import { UpdateSaleRequest } from './types'
import { PaymentStatus } from '@prisma/client'
import { CannotEditPaidSaleError } from '../@errors/sale/cannot-edit-paid-sale-error'
import { prisma } from '@/lib/prisma'

interface UpdateSaleResponse {
  sale?: DetailedSale
}

export class UpdateSaleService {
  constructor(private repository: SaleRepository) {}

  private async initVerify(id: string): Promise<void> {
    if (!id) throw new Error('Sale ID is required')

    const saleCurrent = await this.repository.findById(id)
    if (!saleCurrent) throw new Error('Sale not found')
    if (saleCurrent.paymentStatus === PaymentStatus.PAID) {
      throw new CannotEditPaidSaleError()
    }
  }

  async execute({
    id,
    observation,
    method,
  }: UpdateSaleRequest): Promise<UpdateSaleResponse> {
    await this.initVerify(id)

    let saleUpdate: DetailedSale | undefined
    await prisma.$transaction(async (tx) => {
      saleUpdate = await this.repository.update(
        id,
        {
          observation,
          method,
        },
        tx,
      )
    })

    return { sale: saleUpdate }
  }
}
