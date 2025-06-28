import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { TransactionRepository } from '@/repositories/transaction-repository'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { Transaction, TransactionType } from '@prisma/client'

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
}

interface CreateTransactionResponse {
  transaction: Transaction
}

export class CreateTransactionService {
  constructor(
    private repository: TransactionRepository,
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
  ) {}

  async execute(
    data: CreateTransactionRequest,
  ): Promise<CreateTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    let affectedUser
    if (data.affectedUserId) {
      affectedUser = await this.barberUserRepository.findById(
        data.affectedUserId,
      )
      if (!affectedUser) throw new AffectedUserNotFoundError()
    }

    const effectiveUser = affectedUser ?? user

    const transaction = await this.repository.create({
      user: { connect: { id: effectiveUser.id } },
      unit: { connect: { id: effectiveUser.unitId } },
      session: { connect: { id: session.id } },
      sale: data.saleId ? { connect: { id: data.saleId } } : undefined,
      ...(data.saleItemId && {
        saleItem: { connect: { id: data.saleItemId } },
      }),
      ...(data.appointmentServiceId && {
        appointmentService: { connect: { id: data.appointmentServiceId } },
      }),
      type: data.type,
      description: data.description,
      amount: data.amount,
      isLoan: data.isLoan ?? false,
      receiptUrl: data.receiptUrl ?? null,
      affectedUser: affectedUser
        ? { connect: { id: effectiveUser.id } }
        : undefined,
    } as any)

    return { transaction }
  }
}
