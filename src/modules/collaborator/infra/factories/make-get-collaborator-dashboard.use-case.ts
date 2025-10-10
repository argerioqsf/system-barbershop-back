import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { GetCollaboratorDashboardUseCase } from '../../application/use-cases/get-collaborator-dashboard.use-case'
import { makeCollaboratorTelemetry } from './make-collaborator-telemetry'

export function makeGetCollaboratorDashboardUseCase() {
  const profilesRepository = new PrismaProfilesRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const transactionRepository = new PrismaTransactionRepository()
  const telemetry = makeCollaboratorTelemetry()

  const useCase = new GetCollaboratorDashboardUseCase(
    profilesRepository,
    saleItemRepository,
    transactionRepository,
    telemetry,
  )

  return useCase
}
