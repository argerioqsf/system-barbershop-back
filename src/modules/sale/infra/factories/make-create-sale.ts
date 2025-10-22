import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import { PrismaBarberUsersRepository } from '@/modules/sale/infra/repositories/prisma/prisma-barber-users-repository'
import { CreateSaleUseCase } from '@/modules/sale/application/use-cases/create-sale'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeCreateSale() {
  const saleRepository = new PrismaSaleRepository()
  const barberUsersRepository = new PrismaBarberUsersRepository()
  const telemetry = makeSaleTelemetry()

  return new CreateSaleUseCase(saleRepository, barberUsersRepository, telemetry)
}
