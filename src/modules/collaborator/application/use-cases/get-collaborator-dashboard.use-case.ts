import { TransactionRepository } from '@/repositories/transaction-repository'
import { TransactionFull } from '@/repositories/prisma/prisma-transaction-repository'
import { RoleName } from '@prisma/client'
import { CollaboratorNotFoundError } from '../errors/collaborator-not-found.error'
import { UnauthorizedAccessError } from '../errors/unauthorized-access.error'
import { CollaboratorTelemetry } from '../contracts/collaborator-telemetry'
import { logger } from '@/lib/logger'
import {
  DetailedSaleItemFindMany,
  SaleItemRepository,
} from '@/repositories/sale-item-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'

interface GetCollaboratorDashboardUseCaseRequest {
  collaboratorId: string
}

interface GetCollaboratorDashboardUseCaseResponse {
  totalBalance: number
  saleItems: DetailedSaleItemFindMany[]
  transactions: TransactionFull[]
}

export class GetCollaboratorDashboardUseCase {
  constructor(
    private profilesRepository: ProfilesRepository,
    private saleItemRepository: SaleItemRepository,
    private transactionRepository: TransactionRepository,
    private telemetry?: CollaboratorTelemetry,
  ) {}

  async execute({
    collaboratorId,
  }: GetCollaboratorDashboardUseCaseRequest): Promise<GetCollaboratorDashboardUseCaseResponse> {
    logger.info('Starting GetCollaboratorDashboardUseCase', { collaboratorId })

    const profile = await this.profilesRepository.findByUserId(collaboratorId)

    if (!profile) {
      throw new CollaboratorNotFoundError()
    }

    // TODO: implemetar uma permission para esse caso e nem usar a role diretamente
    if (
      profile?.role?.name !== RoleName.BARBER &&
      profile?.role?.name !== RoleName.ADMIN
    ) {
      throw new UnauthorizedAccessError()
    }

    const saleItems = await this.saleItemRepository.findManyByBarberId(
      collaboratorId,
    )

    const transactions =
      await this.transactionRepository.findManyByAffectedUser(collaboratorId)

    this.telemetry?.record({
      operation: 'get-collaborator-dashboard',
      collaboratorId,
      metadata: {
        saleItemsCount: saleItems.length,
        transactionsCount: transactions.length,
      },
    })

    return {
      totalBalance: profile.totalBalance,
      saleItems,
      transactions,
    }
  }
}
