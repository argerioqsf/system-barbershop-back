import {
  DebtsRepositoryPort,
  DebtUpdateData,
} from '@/modules/finance/application/ports/debts-repository'
import { Debt } from '@/modules/finance/domain/entities/debt'
import { UpdateDebtDTO } from '../dto/update-debt.dto'
import { DebtNotFoundError } from '../errors/debt-not-found-error'

export class UpdateDebtUseCase {
  constructor(private readonly debtsRepository: DebtsRepositoryPort) {}

  async execute(command: UpdateDebtDTO) {
    const existing = await this.debtsRepository.findById(command.id)
    if (!existing) {
      throw new DebtNotFoundError()
    }

    const nextStatus = command.status ?? existing.status
    const nextAmount = command.value ?? existing.amount
    const nextPaymentDate =
      nextStatus === 'PAID'
        ? command.paymentDate ?? existing.paymentDate ?? new Date()
        : null

    const debt = Debt.create({
      id: existing.id,
      planId: existing.planId,
      planProfileId: existing.planProfileId,
      amount: nextAmount,
      status: nextStatus,
      paymentDate: nextPaymentDate,
      dueDate: existing.dueDate,
      createdAt: existing.createdAt,
    })

    const data: DebtUpdateData = {
      amount: command.value,
      status: command.status,
      paymentDate: nextPaymentDate,
    }

    if (debt.status === 'PENDING') {
      data.paymentDate = null
    }

    return this.debtsRepository.update(command.id, data)
  }
}
