import { describe, it, expect } from 'vitest'
import { GetOpenCashSessionUseCase } from '../../../../../src/modules/finance/application/use-cases/get-open-cash-session'
import {
  TransactionsRepository,
  TransactionRecord,
  CreateTransactionInput,
} from '../../../../../src/modules/finance/application/ports/transactions-repository'
import { TransactionClient } from '../../../../../src/core/application/ports/transaction-runner'
import { Money } from '../../../../../src/core/domain/value-objects/money'
import {
  TransactionReason,
  TransactionType,
} from '../../../../../src/modules/finance/domain/entities/transaction'
import {
  CashRegisterRepositoryPort,
  CashSessionRecord,
  CreateCashSessionInput,
} from '../../../../../src/modules/finance/application/ports/cash-register-repository'

class StubTransactionsRepository implements TransactionsRepository {
  constructor(private records: TransactionRecord[] = []) {}

  async create(
    _data: CreateTransactionInput,
    _ctx?: TransactionClient,
  ): Promise<TransactionRecord> {
    throw new Error('Method not implemented.')
  }

  async findManyByUser(
    _userId: string,
    _ctx?: TransactionClient,
  ): Promise<TransactionRecord[]> {
    throw new Error('Method not implemented.')
  }

  async findManyBySession(
    _sessionId: string,
    _ctx?: TransactionClient,
  ): Promise<TransactionRecord[]> {
    return this.records
  }
}

class StubCashRegisterRepository implements CashRegisterRepositoryPort {
  constructor(private readonly openSession: CashSessionRecord | null) {}

  async create(_data: CreateCashSessionInput): Promise<CashSessionRecord> {
    throw new Error('Method not implemented.')
  }

  async close(
    _id: string,
    _finalAmount: Money,
    _closedAt: Date,
  ): Promise<CashSessionRecord> {
    throw new Error('Method not implemented.')
  }

  async findOpenByUnit(_unitId: string): Promise<CashSessionRecord | null> {
    return this.openSession
  }

  async findById(_id: string): Promise<CashSessionRecord | null> {
    throw new Error('Method not implemented.')
  }
}

describe('GetOpenCashSessionUseCase', () => {
  it('retorna sessão aberta com transações normalizadas', async () => {
    const session: CashSessionRecord = {
      id: 'session-1',
      unitId: 'unit-1',
      openedByUserId: 'user-1',
      openedAt: new Date(),
      closedAt: null,
      openingAmount: Money.from(80),
      finalAmount: Money.from(80),
      commissionCheckpoints: [
        { profileId: 'profile-1', totalBalance: Money.from(50) },
      ],
    }

    const transactionsRepository = new StubTransactionsRepository([
      {
        id: 'tx-1',
        amount: Money.from(-30),
        reason: TransactionReason.PAY_COMMISSION,
        description: 'Pagamento comissão',
        createdAt: new Date(),
        type: TransactionType.WITHDRAWAL,
        isLoan: false,
        userId: 'user-1',
        affectedUserId: 'user-2',
        saleId: null,
        saleItemId: null,
        sessionId: session.id,
        unitId: session.unitId,
        loanId: null,
        appointmentServiceId: null,
        receiptUrl: null,
      },
    ])

    const useCase = new GetOpenCashSessionUseCase(
      new StubCashRegisterRepository(session),
      transactionsRepository,
    )

    const result = await useCase.execute({ unitId: 'unit-1' })

    expect(result.session).not.toBeNull()
    expect(result.session?.id).toBe(session.id)
    expect(result.session?.transactions).toHaveLength(1)
    expect(result.session?.transactions[0].amount).toBe(30)
    expect(result.session?.commissionCheckpoints?.[0].totalBalance).toBe(50)
  })

  it('retorna sessão nula quando não houver caixa aberto', async () => {
    const useCase = new GetOpenCashSessionUseCase(
      new StubCashRegisterRepository(null),
      new StubTransactionsRepository(),
    )

    const result = await useCase.execute({ unitId: 'unit-1' })

    expect(result.session).toBeNull()
  })
})
