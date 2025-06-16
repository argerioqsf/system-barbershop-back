import { describe, it, expect, beforeEach } from 'vitest'
import { TransactionType } from '@prisma/client'
import { CreateTransactionService } from '../src/services/transaction/create-transaction'
import {
  FakeTransactionRepository,
  FakeBarberUsersRepository,
  FakeCashRegisterRepository,
  FakeProfilesRepository,
  FakeUnitRepository,
  FakeOrganizationRepository,
} from './helpers/fake-repositories'
import { defaultUser } from './helpers/default-values'

function setup(options?: {
  userBalance?: number
  unitBalance?: number
  organizationBalance?: number
  allowsLoan?: boolean
}) {
  const transactionRepo = new FakeTransactionRepository()
  const barberRepo = new FakeBarberUsersRepository()
  const cashRepo = new FakeCashRegisterRepository()
  const profileRepo = new FakeProfilesRepository()
  const organization = {
    id: 'org-1',
    name: 'Org',
    slug: 'org',
    ownerId: null,
    totalBalance: options?.organizationBalance ?? 0,
    createdAt: new Date(),
  }
  const organizationRepo = new FakeOrganizationRepository(organization)
  const unit = {
    id: 'unit-1',
    name: 'Unit',
    slug: 'unit',
    organizationId: 'org-1',
    totalBalance: options?.unitBalance ?? 0,
    allowsLoan: options?.allowsLoan ?? false,
  }
  const unitRepo = new FakeUnitRepository(unit)

  const createTransaction = new CreateTransactionService(
    transactionRepo,
    barberRepo,
    cashRepo,
    profileRepo,
    unitRepo,
    organizationRepo,
  )

  const profile = {
    id: 'profile-user',
    phone: '',
    cpf: '',
    genre: '',
    birthday: '',
    pix: '',
    role: 'BARBER' as any,
    commissionPercentage: 100,
    totalBalance: options?.userBalance ?? 0,
    userId: defaultUser.id,
    user: { ...defaultUser },
    createdAt: new Date(),
  }
  profileRepo.profiles.push(profile)

  const user = { ...defaultUser, profile, unit }
  barberRepo.users.push(user)

  cashRepo.session = {
    id: 'session-1',
    openedById: defaultUser.id,
    unitId: unit.id,
    openedAt: new Date(),
    closedAt: null,
    initialAmount: 0,
    transactions: [],
    sales: [],
    finalAmount: null,
  }

  return {
    transactionRepo,
    barberRepo,
    cashRepo,
    profileRepo,
    unitRepo,
    organizationRepo,
    createTransaction,
    user,
  }
}

describe('Create transaction service', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => {
    ctx = setup()
  })

  it('throws when passing negative value on addition', async () => {
    await expect(
      ctx.createTransaction.execute({
        userId: ctx.user.id,
        type: TransactionType.ADDITION,
        description: '',
        amount: -10,
      }),
    ).rejects.toThrow('Negative values ​​cannot be passed on additions')
  })

  it('throws when passing negative value on withdrawal', async () => {
    await expect(
      ctx.createTransaction.execute({
        userId: ctx.user.id,
        type: TransactionType.WITHDRAWAL,
        description: '',
        amount: -10,
      }),
    ).rejects.toThrow('Negative values ​​cannot be passed on withdrawals')
  })

  it('adds value to the user himself with negative balance', async () => {
    ctx = setup({ userBalance: -50 })

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      affectedUserId: ctx.user.id,
      type: TransactionType.ADDITION,
      description: '',
      amount: 60,
    })

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(60)
    expect(ctx.organizationRepo.organization.totalBalance).toBe(60)
  })

  it('adds value to the user himself with positive balance', async () => {
    ctx = setup({ userBalance: 20 })

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      affectedUserId: ctx.user.id,
      type: TransactionType.ADDITION,
      description: '',
      amount: 30,
    })

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(50)
    expect(ctx.unitRepo.unit.totalBalance).toBe(30)
    expect(ctx.organizationRepo.organization.totalBalance).toBe(30)
  })

  it('fails to withdraw when user balance is negative', async () => {
    ctx = setup({ userBalance: -20 })

    await expect(
      ctx.createTransaction.execute({
        userId: ctx.user.id,
        type: TransactionType.WITHDRAWAL,
        description: '',
        amount: 10,
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(-20)
  })

  it('withdraws when user balance is positive', async () => {
    ctx = setup({ userBalance: 50 })

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      type: TransactionType.WITHDRAWAL,
      description: '',
      amount: 20,
    })

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(30)
  })

  it('withdraws with loan when balance insufficient and unit allows', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 100, allowsLoan: true })

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      type: TransactionType.WITHDRAWAL,
      description: '',
      amount: 30,
    })

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(-20)
    expect(ctx.unitRepo.unit.totalBalance).toBe(80)
    expect(ctx.organizationRepo.organization.totalBalance).toBe(-20)
  })

  it('fails withdrawal when balance insufficient and unit disallows loan', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 100, allowsLoan: false })

    await expect(
      ctx.createTransaction.execute({
        userId: ctx.user.id,
        type: TransactionType.WITHDRAWAL,
        description: '',
        amount: 30,
      }),
    ).rejects.toThrow('Insufficient balance for withdrawal')

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(100)
  })

  it('fails withdrawal when amount exceeds unit balance', async () => {
    ctx = setup({ userBalance: 10, unitBalance: 20, allowsLoan: true })

    await expect(
      ctx.createTransaction.execute({
        userId: ctx.user.id,
        type: TransactionType.WITHDRAWAL,
        description: '',
        amount: 50,
      }),
    ).rejects.toThrow('Withdrawal amount greater than unit balance')

    expect(ctx.profileRepo.profiles[0].totalBalance).toBe(10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
  })

  it('adds value to affected user with positive balance', async () => {
    ctx = setup()
    const affectedProfile = {
      id: 'profile-2',
      phone: '',
      cpf: '',
      genre: '',
      birthday: '',
      pix: '',
      role: 'BARBER' as any,
      commissionPercentage: 100,
      totalBalance: 20,
      userId: 'user-2',
      user: { ...defaultUser, id: 'user-2' },
      createdAt: new Date(),
    }
    ctx.profileRepo.profiles.push(affectedProfile)
    const affectedUser = {
      ...defaultUser,
      id: 'user-2',
      profile: affectedProfile,
      unit: ctx.unitRepo.unit,
    }
    ctx.barberRepo.users.push(affectedUser)

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      affectedUserId: affectedUser.id,
      type: TransactionType.ADDITION,
      description: '',
      amount: 40,
    })

    expect(affectedProfile.totalBalance).toBe(60)
    expect(ctx.unitRepo.unit.totalBalance).toBe(40)
    expect(ctx.organizationRepo.organization.totalBalance).toBe(40)
  })

  it('adds value to affected user with negative balance', async () => {
    ctx = setup()
    const affectedProfile = {
      id: 'profile-3',
      phone: '',
      cpf: '',
      genre: '',
      birthday: '',
      pix: '',
      role: 'BARBER' as any,
      commissionPercentage: 100,
      totalBalance: -30,
      userId: 'user-3',
      user: { ...defaultUser, id: 'user-3' },
      createdAt: new Date(),
    }
    ctx.profileRepo.profiles.push(affectedProfile)
    const affectedUser = {
      ...defaultUser,
      id: 'user-3',
      profile: affectedProfile,
      unit: ctx.unitRepo.unit,
    }
    ctx.barberRepo.users.push(affectedUser)

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      affectedUserId: affectedUser.id,
      type: TransactionType.ADDITION,
      description: '',
      amount: 20,
    })

    expect(affectedProfile.totalBalance).toBe(-10)
    expect(ctx.unitRepo.unit.totalBalance).toBe(20)
    expect(ctx.organizationRepo.organization.totalBalance).toBe(20)
  })

  it('withdraws from affected user with positive balance', async () => {
    ctx = setup()
    const affectedProfile = {
      id: 'profile-4',
      phone: '',
      cpf: '',
      genre: '',
      birthday: '',
      pix: '',
      role: 'BARBER' as any,
      commissionPercentage: 100,
      totalBalance: 50,
      userId: 'user-4',
      user: { ...defaultUser, id: 'user-4' },
      createdAt: new Date(),
    }
    ctx.profileRepo.profiles.push(affectedProfile)
    const affectedUser = {
      ...defaultUser,
      id: 'user-4',
      profile: affectedProfile,
      unit: ctx.unitRepo.unit,
    }
    ctx.barberRepo.users.push(affectedUser)

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      affectedUserId: affectedUser.id,
      type: TransactionType.WITHDRAWAL,
      description: '',
      amount: 30,
    })

    expect(affectedProfile.totalBalance).toBe(20)
  })

  it('withdraws from affected user with negative balance', async () => {
    ctx = setup({ unitBalance: 100, allowsLoan: true })
    const affectedProfile = {
      id: 'profile-5',
      phone: '',
      cpf: '',
      genre: '',
      birthday: '',
      pix: '',
      role: 'BARBER' as any,
      commissionPercentage: 100,
      totalBalance: -10,
      userId: 'user-5',
      user: { ...defaultUser, id: 'user-5' },
      createdAt: new Date(),
    }
    ctx.profileRepo.profiles.push(affectedProfile)
    const affectedUser = {
      ...defaultUser,
      id: 'user-5',
      profile: affectedProfile,
      unit: ctx.unitRepo.unit,
    }
    ctx.barberRepo.users.push(affectedUser)

    await ctx.createTransaction.execute({
      userId: ctx.user.id,
      affectedUserId: affectedUser.id,
      type: TransactionType.WITHDRAWAL,
      description: '',
      amount: 20,
    })

    expect(affectedProfile.totalBalance).toBe(-30)
    expect(ctx.unitRepo.unit.totalBalance).toBe(80)
    expect(ctx.organizationRepo.organization.totalBalance).toBe(-20)
  })
})
