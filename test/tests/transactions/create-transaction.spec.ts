import { describe, it, expect, beforeEach } from 'vitest'
import { TransactionType } from '@prisma/client'
import { CreateTransactionService } from '../../../src/services/transaction/create-transaction'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
} from '../../helpers/fake-repositories'
import { defaultUser } from '../../helpers/default-values'

function setup() {
  const transactionRepo = new FakeTransactionRepository()
  const barberRepo = new FakeBarberUsersRepository()
  const cashRepo = new FakeCashRegisterRepository()

  const service = new CreateTransactionService(
    transactionRepo,
    barberRepo,
    cashRepo,
  )

  const user = { ...defaultUser }
  barberRepo.users.push(user as any)

  cashRepo.session = {
    id: 'session-1',
    openedById: user.id,
    unitId: user.unitId,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    transactions: [],
    sales: [],
    finalAmount: null,
  }

  return { transactionRepo, barberRepo, cashRepo, service, user }
}

describe('Create transaction service', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('throws when user not found', async () => {
    await expect(
      ctx.service.execute({
        userId: 'no-user',
        type: TransactionType.ADDITION,
        description: '',
        amount: 10,
      }),
    ).rejects.toThrow('User not found')
  })

  it('throws when cash register closed', async () => {
    ctx.cashRepo.session = null

    await expect(
      ctx.service.execute({
        userId: ctx.user.id,
        type: TransactionType.ADDITION,
        description: '',
        amount: 10,
      }),
    ).rejects.toThrow('Cash register closed')
  })

  it('throws when affected user not found', async () => {
    await expect(
      ctx.service.execute({
        userId: ctx.user.id,
        affectedUserId: 'other',
        type: TransactionType.ADDITION,
        description: '',
        amount: 10,
      }),
    ).rejects.toThrow('Affected user not found')
  })

  it('creates transaction for user', async () => {
    const { transaction } = await ctx.service.execute({
      userId: ctx.user.id,
      type: TransactionType.ADDITION,
      description: 'test',
      amount: 20,
    })

    expect(transaction.userId).toBe(ctx.user.id)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('creates transaction for affected user', async () => {
    const other = { ...defaultUser, id: 'user-2', unitId: ctx.user.unitId }
    ctx.barberRepo.users.push(other as any)

    const { transaction } = await ctx.service.execute({
      userId: ctx.user.id,
      affectedUserId: other.id,
      type: TransactionType.ADDITION,
      description: '',
      amount: 15,
    })

    expect(transaction.affectedUserId).toBe(other.id)
    expect(ctx.transactionRepo.transactions).toHaveLength(1)
  })

  it('stores receipt url when provided', async () => {
    await ctx.service.execute({
      userId: ctx.user.id,
      type: TransactionType.ADDITION,
      description: '',
      amount: 5,
      receiptUrl: '/uploads/test.png',
    })

    expect(ctx.transactionRepo.transactions[0].receiptUrl).toBe('/uploads/test.png')
  })
})
