import { DebtsRepositoryPort } from '@/modules/finance/application/ports/debts-repository'
import { GetDebtUseCaseInput, GetDebtUseCaseOutput } from '../dto/get-debt.dto'

export class GetDebtUseCase {
  constructor(private readonly debtsRepository: DebtsRepositoryPort) {}

  execute(id: GetDebtUseCaseInput): Promise<GetDebtUseCaseOutput> {
    return this.debtsRepository.findById(id)
  }
}
