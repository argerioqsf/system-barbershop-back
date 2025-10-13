import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { CashRegisterSession } from '@prisma/client'
import { CashRegisterNotOpenedError } from '@/services/@errors/cash-register/cash-register-not-opened-error'

interface CloseSessionRequest {
  unitId: string
}

interface CloseSessionResponse {
  session: CashRegisterSession
}

export class CloseSessionService {
  constructor(private repository: CashRegisterRepository) {}
  // TODO: quando fechar o caixa criar um campo na tabela de caixa de lista que ira ter uma lista de
  // todos os barbeiros e atendentes relacionando eles com suas comissoes do momento para deixar registrado
  async execute({
    unitId,
  }: CloseSessionRequest): Promise<CloseSessionResponse> {
    const sessionOpen = await this.repository.findOpenByUnit(unitId)
    if (!sessionOpen) throw new CashRegisterNotOpenedError()

    const session = await this.repository.close(sessionOpen.id, {
      closedAt: new Date(),
    })
    return { session }
  }
}
