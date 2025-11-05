import { DebtsRepositoryPort } from '@/modules/finance/application/ports/debts-repository'
import { Debt } from '@/modules/finance/domain/entities/debt'
import { CreateDebtDTO } from '../dto/create-debt.dto'

export class CreateDebtUseCase {
  constructor(private readonly debtsRepository: DebtsRepositoryPort) {}

  async execute(command: CreateDebtDTO) {
    const debt = Debt.create({
      planId: command.planId,
      planProfileId: command.planProfileId,
      amount: command.amount,
      status: command.status,
      dueDate: command.dueDate,
      paymentDate: command.paymentDate ?? null,
      createdAt: command.createdAt,
    }).toObject()

    return this.debtsRepository.create({
      planId: debt.planId,
      planProfileId: debt.planProfileId,
      amount: debt.amount,
      status: debt.status,
      dueDate: debt.dueDate,
      paymentDate: debt.paymentDate,
      createdAt: debt.createdAt,
    })
  }
}
