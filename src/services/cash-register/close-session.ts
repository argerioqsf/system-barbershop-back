import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { SaleRepository } from '@/repositories/sale-repository'
import { CashRegisterSession, SaleStatus } from '@prisma/client'
import { CashRegisterNotOpenedError } from '@/services/@errors/cash-register/cash-register-not-opened-error'
import { CashRegisterHasPendingSalesError } from '@/services/@errors/cash-register/cash-register-has-pending-sales-error'

interface CloseSessionRequest {
  unitId: string
}

interface CloseSessionResponse {
  session: CashRegisterSession
}

export class CloseSessionService {
  constructor(
    private cashRegisterRepository: CashRegisterRepository,
    private saleRepository: SaleRepository,
  ) {}

  async execute({
    unitId,
  }: CloseSessionRequest): Promise<CloseSessionResponse> {
    const sessionOpen = await this.cashRegisterRepository.findOpenByUnit(unitId)
    if (!sessionOpen) throw new CashRegisterNotOpenedError()

    const now = new Date()
    const pendingSales = await this.saleRepository.findMany({
      unitId,
      status: { notIn: [SaleStatus.COMPLETED, SaleStatus.CANCELLED] },
      createdAt: { gte: sessionOpen.openedAt, lte: now },
    })
    if (pendingSales.length > 0) throw new CashRegisterHasPendingSalesError()

    const session = await this.cashRegisterRepository.close(sessionOpen.id, {
      closedAt: now,
    })

    return { session }
  }
}
