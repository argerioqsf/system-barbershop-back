import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { LoanRepository } from '@/repositories/loan-repository'
import { LoanStatus } from '@prisma/client'
import { startOfMonth, addMonths } from 'date-fns'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '../@errors/cash-register/cash-register-closed-error'
import { LoanMonthlyLimitExceededError } from '../@errors/loan/loan-monthly-limit-exceeded-error'

interface CreateLoanRequest {
  userId: string
  amount: number
}

export class CreateLoanService {
  constructor(
    private loanRepository: LoanRepository,
    private userRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
  ) {}

  async execute({ userId, amount }: CreateLoanRequest) {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    const limit = user.unit?.loanMonthlyLimit ?? 0
    if (limit > 0) {
      const start = startOfMonth(new Date())
      const end = addMonths(start, 1)
      const loans = await this.loanRepository.findMany({
        userId: user.id,
        createdAt: { gte: start, lt: end },
      })
      const total = loans.reduce((s, l) => s + l.amount, 0)
      if (total + amount > limit) throw new LoanMonthlyLimitExceededError()
    }

    const loan = await this.loanRepository.create({
      userId: user.id,
      unitId: user.unitId,
      sessionId: session.id,
      amount,
      status: LoanStatus.PENDING,
    })

    return { loan }
  }
}
