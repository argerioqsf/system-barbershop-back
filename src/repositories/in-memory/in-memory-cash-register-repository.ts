import { Prisma, CashRegisterSession, Transaction } from '@prisma/client'
import {
  CashRegisterRepository,
  CompleteCashSession,
  DetailedCashSession,
  ResponseFindOpenByUnit,
} from '../cash-register-repository'
import { randomUUID } from 'crypto'

export class InMemoryCashRegisterRepository implements CashRegisterRepository {
  public sessions: (CompleteCashSession & { transactions: Transaction[] })[] =
    []

  async create(
    data: Prisma.CashRegisterSessionCreateInput,
  ): Promise<CashRegisterSession> {
    const session: CashRegisterSession = {
      id: randomUUID(),
      openedById: (data.user as { connect: { id: string } }).connect.id,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
      openedAt: new Date(),
      closedAt: null,
      initialAmount: data.initialAmount as number,
      finalAmount: null,
    }
    this.sessions.push({
      ...session,
      user: {
        id: session.openedById,
        name: '',
        email: '',
        password: '',
        active: true,
        organizationId: 'org-1',
        unitId: session.unitId,
        versionToken: 1,
        versionTokenInvalidate: null,
        createdAt: new Date(),
      },
      unit: {
        id: session.unitId,
        name: '',
        slug: '',
        organizationId: 'org-1',
        totalBalance: 0,
        allowsLoan: false,
        loanMonthlyLimit: 0,
        slotDuration: 60,
        appointmentFutureLimitDays: 7,
      },
      sales: [],
      transactions: [],
    } as CompleteCashSession & { unit: { organizationId: string } })
    return session
  }

  async close(
    id: string,
    data: Prisma.CashRegisterSessionUpdateInput,
  ): Promise<CashRegisterSession> {
    const index = this.sessions.findIndex((s) => s.id === id)
    if (index < 0) throw new Error('Session not found')
    const current = this.sessions[index]
    const updated = {
      ...current,
      closedAt: data.closedAt as Date,
      // finalAmount is now a running total, so we don't update it on close.
      finalAmount: current.finalAmount,
    }
    this.sessions[index] = updated
    return updated
  }

  async findMany(
    where: Prisma.CashRegisterSessionWhereInput = {},
  ): Promise<DetailedCashSession[]> {
    const filtered = this.sessions.filter((s) => {
      if (where.unitId && s.unitId !== where.unitId) return false
      if (
        where.unit &&
        'organizationId' in (where.unit as { organizationId: string })
      ) {
        const session = s as { unit?: { organizationId: string } }
        return (
          session.unit?.organizationId ===
          (where.unit as { organizationId: string }).organizationId
        )
      }
      return true
    })
    return filtered.sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
  }

  async findManyByUnit(unitId: string): Promise<DetailedCashSession[]> {
    return this.sessions
      .filter((s) => s.unitId === unitId)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
  }

  async findOpenByUser(userId: string): Promise<CashRegisterSession | null> {
    const session = this.sessions.find(
      (s) => s.openedById === userId && s.closedAt === null,
    )
    return session ?? null
  }

  async findOpenByUnit(unitId: string): Promise<ResponseFindOpenByUnit> {
    const session = this.sessions.find(
      (s) => s.unitId === unitId && s.closedAt === null,
    )
    return session
      ? {
          ...session,
          transactions: session.transactions,
          commissionCheckpoints: [],
        }
      : null
  }

  async findById(id: string): Promise<CompleteCashSession | null> {
    return this.sessions.find((s) => s.id === id) ?? null
  }

  async incrementFinalAmount(
    sessionId: string,
    amount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
  ): Promise<CashRegisterSession> {
    const sessionIndex = this.sessions.findIndex((s) => s.id === sessionId)
    if (sessionIndex < 0) {
      throw new Error('Session not found in memory')
    }
    const session = this.sessions[sessionIndex]
    session.finalAmount = (session.finalAmount ?? 0) + amount
    this.sessions[sessionIndex] = session
    return session
  }
}
