import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { Prisma, Transaction, TransactionType } from '@prisma/client'
import { Money } from '@/core/domain/value-objects/money'
import {
  TransactionRecord,
  TransactionsRepository,
} from '@/modules/finance/application/ports/transactions-repository'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'

interface CreateTransactionRequest {
  userId: string
  affectedUserId?: string
  type: TransactionType
  description: string
  amount: number
  receiptUrl?: string | null
  saleId?: string
  saleItemId?: string
  appointmentServiceId?: string
  isLoan?: boolean
  loanId?: string
  tx?: Prisma.TransactionClient
  reason: TransactionReason
}

interface CreateTransactionResponse {
  transaction: Transaction
}

export class CreateTransactionService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly barberUserRepository: BarberUsersRepository,
    private readonly cashRegisterRepository: CashRegisterRepository,
  ) {}

  async execute(
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    // TODO: receber a saleId por parametro para nao precisar fazer varias requests para pegar a session em fluxos com muitas transactios
    if (!session) throw new CashRegisterClosedError()

    let affectedUser
    if (data.affectedUserId) {
      affectedUser = await this.barberUserRepository.findById(
        data.affectedUserId,
      )
      if (!affectedUser) throw new AffectedUserNotFoundError()
    }

    const effectiveUser = user

    const reason = data.reason

    const amount = Money.from(data.amount)
    const signedAmount =
      data.type === TransactionType.WITHDRAWAL ? amount.negate() : amount

    const transactionRecord = await this.transactionsRepository.create(
      {
        amount: signedAmount,
        reason,
        description: data.description,
        userId: effectiveUser.id,
        affectedUserId: affectedUser?.id,
        saleId: data.saleId,
        saleItemId: data.saleItemId,
        appointmentServiceId: data.appointmentServiceId,
        unitId: effectiveUser.unitId,
        sessionId: session.id,
        loanId: data.loanId,
        receiptUrl: data.receiptUrl,
        isLoan: data.isLoan,
      },
      data.tx,
    )

    return {
      transaction: this.toPrismaTransaction(transactionRecord),
    }
  }

  private toPrismaTransaction(record: TransactionRecord): Transaction {
    return {
      id: record.id,
      userId: record.userId,
      affectedUserId: record.affectedUserId ?? null,
      unitId: record.unitId ?? '',
      cashRegisterSessionId: record.sessionId ?? null,
      type:
        record.type === 'WITHDRAWAL'
          ? TransactionType.WITHDRAWAL
          : TransactionType.ADDITION,
      description: record.description ?? '',
      amount: record.amount.abs().toNumber(),
      isLoan: record.isLoan,
      receiptUrl: record.receiptUrl ?? null,
      createdAt: record.createdAt,
      reason: record.reason,
      saleId: record.saleId ?? null,
      saleItemId: record.saleItemId ?? null,
      appointmentServiceId: record.appointmentServiceId ?? null,
      loanId: record.loanId ?? null,
    }
  }
}
