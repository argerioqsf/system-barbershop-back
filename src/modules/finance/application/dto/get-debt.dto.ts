import { DebtRecord } from '../ports/debts-repository'

export type GetDebtUseCaseInput = string

export type GetDebtUseCaseOutput = DebtRecord | null
