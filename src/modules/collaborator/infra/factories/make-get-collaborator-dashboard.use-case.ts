import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaTransactionReadRepository } from '@/modules/finance/infra/repositories/prisma/prisma-transaction-read-repository'
import { FinanceTransactionReadAdapter } from '@/modules/collaborator/infra/repositories/transaction-read/finance-transaction-read-adapter'
import { GetCollaboratorDashboardUseCase } from '../../application/use-cases/get-collaborator-dashboard.use-case'
import { makeCollaboratorTelemetry } from './make-collaborator-telemetry'

export function makeGetCollaboratorDashboardUseCase() {
  const profilesRepository = new PrismaProfilesRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const transactionRepository = new FinanceTransactionReadAdapter(
    new PrismaTransactionReadRepository(),
  )
  const telemetry = makeCollaboratorTelemetry()

  const useCase = new GetCollaboratorDashboardUseCase(
    profilesRepository,
    saleItemRepository,
    transactionRepository,
    telemetry,
  )

  return useCase
}
