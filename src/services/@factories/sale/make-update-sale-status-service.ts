import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { UpdateSaleStatusService } from '../../sale/update-sale-status-service'

export function makeUpdateSaleStatusService() {
  const saleRepository = new PrismaSaleRepository()
  const service = new UpdateSaleStatusService(saleRepository)
  return service
}
