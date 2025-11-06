export const LoanStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED',
  VALUE_TRANSFERRED: 'VALUE_TRANSFERRED',
  PAID_OFF: 'PAID_OFF',
} as const

export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus]

export const DebtStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
} as const

export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus]
