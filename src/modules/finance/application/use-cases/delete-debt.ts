import { DebtsRepositoryPort } from '@/modules/finance/application/ports/debts-repository'
import { DeleteDebtDTO } from '../dto/delete-debt.dto'

export class DeleteDebtUseCase {
  constructor(private readonly debtsRepository: DebtsRepositoryPort) {}

  execute(id: DeleteDebtDTO) {
    return this.debtsRepository.delete(id)
  }
}
