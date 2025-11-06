import { describe, it, expect, beforeEach } from 'vitest'
import { GetCollaboratorDashboardUseCase } from '../../../src/modules/collaborator/application/use-cases/get-collaborator-dashboard.use-case'
import {
  FakeProfilesRepository,
  FakeSaleRepository,
  FakeSaleItemRepository,
} from '../../helpers/fake-repositories'
import { makeProfile, makeSaleWithBarber } from '../../helpers/default-values'
import { RoleName } from '@prisma/client'
import { CollaboratorNotFoundError } from '../../../src/modules/collaborator/application/errors/collaborator-not-found.error'
import { UnauthorizedAccessError } from '../../../src/modules/collaborator/application/errors/unauthorized-access.error'
import { FakeCollaboratorTransactionsRepository } from '../../helpers/fake-collaborator-transactions-repository'
import {
  CollaboratorTransaction,
  CollaboratorTransactionSale,
  CollaboratorTransactionSaleItem,
} from '../../../src/modules/collaborator/application/ports/collaborator-transactions-repository'

const collaboratorId = 'collab-1'

describe('GetCollaboratorDashboardUseCase', () => {
  let profilesRepository: FakeProfilesRepository
  let saleRepository: FakeSaleRepository
  let saleItemRepository: FakeSaleItemRepository
  let transactionRepository: FakeCollaboratorTransactionsRepository
  let useCase: GetCollaboratorDashboardUseCase

  beforeEach(() => {
    profilesRepository = new FakeProfilesRepository()
    saleRepository = new FakeSaleRepository()
    saleItemRepository = new FakeSaleItemRepository(saleRepository)
    transactionRepository = new FakeCollaboratorTransactionsRepository()
    useCase = new GetCollaboratorDashboardUseCase(
      profilesRepository,
      saleItemRepository,
      transactionRepository,
    )
  })

  function mapSaleToCollaboratorTransactionSale(
    sale: any,
  ): CollaboratorTransactionSale {
    return {
      id: sale.id,
      coupon: sale.coupon
        ? { id: sale.coupon.id, code: sale.coupon.code ?? null }
        : null,
      items: sale.items.map(
        (item) =>
          ({
            id: item.id,
            price: item.price ?? null,
            customPrice: item.customPrice ?? undefined,
            service: item.service
              ? { id: item.service.id, name: item.service.name ?? null }
              : null,
            product: item.product
              ? { id: item.product.id, name: item.product.name ?? null }
              : null,
            barber: item.barber
              ? {
                  id: item.barber.id,
                  profile: item.barber.profile
                    ? {
                        id: item.barber.profile.id,
                        name: item.barber.profile.name ?? null,
                      }
                    : null,
                }
              : null,
            discounts: (item.discounts ?? []).map((discount, index) => ({
              id: (discount as any).id ?? `discount-${index}`,
              amount: discount.amount ?? 0,
              type: (discount as any).type ?? 'UNKNOWN',
              origin: (discount as any).origin ?? null,
              order: (discount as any).order ?? null,
            })),
          }) as CollaboratorTransactionSaleItem,
      ),
      user: sale.user
        ? {
            id: sale.user.id,
            name: sale.user.name ?? null,
            profile: sale.user.profile
              ? {
                  id: sale.user.profile.id,
                  name: sale.user.profile.name ?? null,
                }
              : null,
          }
        : null,
    }
  }

  it('returns dashboard data for collaborator', async () => {
    const profile = makeProfile('profile-1', collaboratorId, 150)
    profile.role = { id: 'role-1', name: RoleName.BARBER, unitId: 'unit-1' }
    profile.user = { ...profile.user, id: collaboratorId }
    profilesRepository.profiles = [profile]

    const sale = makeSaleWithBarber()
    sale.items[0].barberId = collaboratorId
    sale.items[0].commissionPaid = false
    saleRepository.sales.push(sale)

    transactionRepository.transactions.push({
      id: 'tx-1',
      amount: 100,
      reason: 'PAYMENT',
      description: null,
      createdAt: new Date(),
      saleId: sale.id,
      saleItemId: sale.items[0]?.id ?? null,
      sale: mapSaleToCollaboratorTransactionSale(sale),
      user: { id: 'user-1', name: null, profile: null },
      affectedUser: { id: collaboratorId, name: null, profile: null },
    } satisfies CollaboratorTransaction)

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
