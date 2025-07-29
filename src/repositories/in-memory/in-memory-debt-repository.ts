import { Debt, PaymentStatus, Prisma } from '@prisma/client'
import { DebtRepository } from '../debt-repository'
import { randomUUID } from 'crypto'

export class InMemoryDebtRepository implements DebtRepository {
  constructor(public debts: Debt[] = []) {}

  async create(
    data: Prisma.DebtUncheckedCreateInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
  ): Promise<Debt> {
    const debt: Debt = {
      id: randomUUID(),
      value: data.value ?? 0,
      status: (data.status as PaymentStatus) ?? PaymentStatus.PENDING,
      planId: data.planId ?? '',
      planProfileId: data.planProfileId ?? '',
      paymentDate: data.paymentDate as Date,
      createdAt: (data.createdAt as Date) ?? new Date(),
    }
    this.debts.push(debt)
    return debt
  }

  async update(
    id: string,
    data: Prisma.DebtUncheckedUpdateInput,
  ): Promise<Debt> {
    const idx = this.debts.findIndex((d) => d.id === id)
    if (idx < 0) throw new Error('Debt not found')
    const current = this.debts[idx]
    const updated: Debt = {
      ...current,
      value: (data.value ?? current.value) as number,
      status: (data.status ?? current.status) as PaymentStatus,
      planId: (data.planId ?? current.planId) as string,
      planProfileId: (data.planProfileId ?? current.planProfileId) as string,
      paymentDate: (data.paymentDate ?? current.paymentDate) as Date,
      createdAt: (data.createdAt ?? current.createdAt) as Date,
    }
    this.debts[idx] = updated
    return updated
  }

  async findById(id: string): Promise<Debt | null> {
    return this.debts.find((d) => d.id === id) ?? null
  }

  async findMany(where: Prisma.DebtWhereInput = {}): Promise<Debt[]> {
    return this.debts.filter((d) => {
      if (where.planProfileId) {
        const eq = (where.planProfileId as Prisma.StringFilter).equals
        if (eq && d.planProfileId !== eq) return false
      }
      if (where.status) {
        const eq = (where.status as Prisma.EnumPaymentStatusFilter).equals
        if (eq && d.status !== eq) return false
      }
      return true
    })
  }

  async delete(id: string): Promise<void> {
    this.debts = this.debts.filter((d) => d.id !== id)
  }
}
