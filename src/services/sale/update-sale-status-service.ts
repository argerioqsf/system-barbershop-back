import { SaleRepository } from '@/repositories/sale-repository'
import { PaymentStatus, Sale } from '@prisma/client'

interface UpdateSaleStatusServiceRequest {
  saleId: string
  status: PaymentStatus
}

interface UpdateSaleStatusServiceResponse {
  sale: Sale
}

export class UpdateSaleStatusService {
  constructor(private saleRepository: SaleRepository) {}

  async execute({
    saleId,
    status,
  }: UpdateSaleStatusServiceRequest): Promise<UpdateSaleStatusServiceResponse> {
    const existingSale = await this.saleRepository.findById(saleId)

    if (!existingSale) {
      throw new Error('Sale not found.')
    }

    if (
      existingSale.status === 'COMPLETED' ||
      existingSale.status === 'CANCELLED' ||
      existingSale.paymentStatus === 'PAID'
    ) {
      throw new Error(
        'Cannot update status of a paid or completed or cancelled sale.',
      )
    }

    const sale = await this.saleRepository.updateStatus(saleId, status)
    return { sale }
  }
}
