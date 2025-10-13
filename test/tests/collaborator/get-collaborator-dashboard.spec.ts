import { describe, it, expect, beforeEach } from 'vitest'
import { GetCollaboratorDashboardUseCase } from '../../../src/modules/collaborator/application/use-cases/get-collaborator-dashboard.use-case'
import {
  FakeProfilesRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
  FakeTransactionRepository,
} from '../../helpers/fake-repositories'
import {
  makeProfile,
  makeSaleWithBarber,
  makeTransaction,
  makeBalanceSale,
} from '../../helpers/default-values'
import { RoleName } from '@prisma/client'
import { CollaboratorNotFoundError } from '../../../src/modules/collaborator/application/errors/collaborator-not-found.error'
import { UnauthorizedAccessError } from '../../../src/modules/collaborator/application/errors/unauthorized-access.error'

const collaboratorId = 'collab-1'

describe('GetCollaboratorDashboardUseCase', () => {
  let profilesRepository: FakeProfilesRepository
  let saleRepository: FakeSaleRepository
  let saleItemRepository: FakeSaleItemRepository
  let transactionRepository: FakeTransactionRepository
  let useCase: GetCollaboratorDashboardUseCase

  beforeEach(() => {
    profilesRepository = new FakeProfilesRepository()
    saleRepository = new FakeSaleRepository()
    saleItemRepository = new FakeSaleItemRepository(saleRepository)
    transactionRepository = new FakeTransactionRepository()
    useCase = new GetCollaboratorDashboardUseCase(
      profilesRepository,
      saleItemRepository,
      transactionRepository,
    )
  })

  it('returns dashboard data for collaborator', async () => {
    const profile = makeProfile('profile-1', collaboratorId, 150)
    profile.role = { id: 'role-1', name: RoleName.BARBER, unitId: 'unit-1' }
    profile.user = { ...profile.user, id: collaboratorId }
    profilesRepository.profiles = [profile]

    const sale = makeSaleWithBarber()
    sale.items[0].barberId = collaboratorId
    sale.items[0].commissionPaid = false
    saleRepository.sales.push(sale)

    transactionRepository.transactions.push(
      makeTransaction({
        id: 'tx-1',
        affectedUserId: collaboratorId,
        userId: 'user-1',
        amount: 100,
        sale: makeBalanceSale(collaboratorId),
      } as any),
    )

    const result = await useCase.execute({ collaboratorId })

    expect(result.totalBalance).toBe(150)
    expect(result.saleItems).toHaveLength(1)
    expect(result.transactions).toHaveLength(1)
  })

  it('throws when collaborator profile not found', async () => {
    await expect(useCase.execute({ collaboratorId })).rejects.toBeInstanceOf(
      CollaboratorNotFoundError,
    )
  })

  it('throws when collaborator role is not allowed', async () => {
    const profile = makeProfile('profile-2', collaboratorId, 0)
    profile.role = { id: 'role-2', name: RoleName.CLIENT, unitId: 'unit-1' }
    profile.user = { ...profile.user, id: collaboratorId }
    profilesRepository.profiles = [profile]

    await expect(useCase.execute({ collaboratorId })).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    )
  })
})
