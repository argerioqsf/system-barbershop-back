import { describe, expect, it } from 'vitest'
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client'
import {
  toPrismaDebtStatus,
  fromPrismaDebtStatus,
} from '../../../../../src/modules/finance/infra/repositories/prisma/prisma-debts-repository'

describe('Debt status mapper', () => {
  it('maps domain status to prisma enum', () => {
    expect(toPrismaDebtStatus('PENDING')).toBe(PrismaPaymentStatus.PENDING)
    expect(toPrismaDebtStatus('PAID')).toBe(PrismaPaymentStatus.PAID)
  })

  it('maps prisma status to domain enum', () => {
    expect(fromPrismaDebtStatus(PrismaPaymentStatus.PENDING)).toBe('PENDING')
    expect(fromPrismaDebtStatus(PrismaPaymentStatus.PAID)).toBe('PAID')
  })
})
