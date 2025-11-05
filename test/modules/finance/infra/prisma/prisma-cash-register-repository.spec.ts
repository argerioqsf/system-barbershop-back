import { describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { PrismaCashRegisterRepositoryAdapter } from '../../../../../src/modules/finance/infra/repositories/prisma/prisma-cash-register-repository'
import { Money } from '../../../../../src/core/domain/value-objects/money'

describe('PrismaCashRegisterRepositoryAdapter', () => {
  it('creates a cash session converting money values and checkpoints', async () => {
    const openedAt = new Date('2024-05-01T09:00:00Z')

    const createMock = vi.fn(async ({ data, include }) => {
      expect(data.initialAmount).toBe(150)
      expect(data.finalAmount).toBe(150)
      expect(data.unit).toEqual({ connect: { id: 'unit-1' } })
      expect(data.user).toEqual({ connect: { id: 'user-1' } })
      expect(include?.commissionCheckpoints).toBe(true)
      expect(data.commissionCheckpoints?.create).toEqual([
        { profileId: 'profile-1', totalBalance: 75 },
      ])

      return {
        id: 'session-1',
        unitId: 'unit-1',
        openedById: 'user-1',
        openedAt,
        closedAt: null,
        initialAmount: data.initialAmount,
        finalAmount: data.finalAmount,
        commissionCheckpoints: [{ profileId: 'profile-1', totalBalance: 75 }],
      }
    })

    const repository = new PrismaCashRegisterRepositoryAdapter({
      cashRegisterSession: {
        create: createMock,
        update: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
    })

    const session = await repository.create({
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openedAt,
      openingAmount: Money.from(150),
      commissionCheckpoints: [
        { profileId: 'profile-1', totalBalance: Money.from(75) },
      ],
    })

    expect(createMock).toHaveBeenCalledOnce()
    expect(session.id).toBe('session-1')
    expect(session.openedByUserId).toBe('user-1')
    expect(session.openingAmount.equals(Money.from(150))).toBe(true)
    expect(session.finalAmount.equals(Money.from(150))).toBe(true)
    expect(session.commissionCheckpoints).toEqual([
      { profileId: 'profile-1', totalBalance: Money.from(75) },
    ])
  })

  it('closes a cash session updating final amounts', async () => {
    const closedAt = new Date('2024-05-02T18:00:00Z')

    const updateMock = vi.fn(async ({ where, data }) => {
      expect(where).toEqual({ id: 'session-1' })
      expect(data.finalAmount).toBe(200)
      expect(data.closedAt).toEqual(closedAt)

      return {
        id: 'session-1',
        unitId: 'unit-1',
        openedById: 'user-1',
        openedAt: new Date('2024-05-01T09:00:00Z'),
        closedAt: data.closedAt,
        initialAmount: 150,
        finalAmount: data.finalAmount,
        commissionCheckpoints: [],
      }
    })

    const repository = new PrismaCashRegisterRepositoryAdapter({
      cashRegisterSession: {
        create: vi.fn(),
        update: updateMock,
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient)

    const session = await repository.close(
      'session-1',
      Money.from(200),
      closedAt,
    )

    expect(updateMock).toHaveBeenCalledOnce()
    expect(session.finalAmount.equals(Money.from(200))).toBe(true)
    expect(session.closedAt).toEqual(closedAt)
  })
})
