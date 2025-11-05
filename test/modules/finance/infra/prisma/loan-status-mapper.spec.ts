import { describe, expect, it } from 'vitest'
import { LoanStatus as PrismaLoanStatus } from '@prisma/client'
import {
  toPrismaLoanStatus,
  fromPrismaLoanStatus,
} from '../../../../../src/modules/finance/infra/repositories/prisma/prisma-loans-repository'

describe('Loan status mapper', () => {
  it('maps domain status to prisma enum', () => {
    expect(toPrismaLoanStatus('PENDING')).toBe(PrismaLoanStatus.PENDING)
    expect(toPrismaLoanStatus('APPROVED')).toBe(PrismaLoanStatus.APPROVED)
    expect(toPrismaLoanStatus('REJECTED')).toBe(PrismaLoanStatus.REJECTED)
    expect(toPrismaLoanStatus('CANCELED')).toBe(PrismaLoanStatus.CANCELED)
    expect(toPrismaLoanStatus('VALUE_TRANSFERRED')).toBe(
      PrismaLoanStatus.VALUE_TRANSFERRED,
    )
    expect(toPrismaLoanStatus('PAID_OFF')).toBe(PrismaLoanStatus.PAID_OFF)
  })

  it('maps prisma status to domain enum', () => {
    expect(fromPrismaLoanStatus(PrismaLoanStatus.PENDING)).toBe('PENDING')
    expect(fromPrismaLoanStatus(PrismaLoanStatus.APPROVED)).toBe('APPROVED')
    expect(fromPrismaLoanStatus(PrismaLoanStatus.REJECTED)).toBe('REJECTED')
    expect(fromPrismaLoanStatus(PrismaLoanStatus.CANCELED)).toBe('CANCELED')
    expect(fromPrismaLoanStatus(PrismaLoanStatus.VALUE_TRANSFERRED)).toBe(
      'VALUE_TRANSFERRED',
    )
    expect(fromPrismaLoanStatus(PrismaLoanStatus.PAID_OFF)).toBe('PAID_OFF')
  })
})
